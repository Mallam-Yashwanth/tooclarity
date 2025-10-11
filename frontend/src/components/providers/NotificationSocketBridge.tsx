"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { cacheSet, CACHE_DURATION } from "@/lib/localDb";
import { BASE_CACHE_KEY, cacheKeyFor, type NotificationItem } from "@/lib/hooks/notifications-hooks";
import { authAPI } from "@/lib/api";

export default function NotificationSocketBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: any;
    let mounted = true;
    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
        let origin = apiBase.replace('/api','');
        if (!origin) origin = typeof window !== 'undefined' ? window.location.origin : '';

        socket = await getSocket(origin);
        if (!socket) return;

        // Derive role and id once (uses existing session cookie)
        let scope: any = {};
        try {
          const prof = await authAPI.getProfile();
          const role = ((prof as any)?.data?.role || '').toString().toUpperCase();
          const id = (prof as any)?.data?.id;
          if (role === 'INSTITUTE_ADMIN' && id) { scope = { scope: 'admin', institutionAdminId: id }; socket.emit('joinInstitutionAdmin', id); }
          else if (role === 'ADMIN' && id) { scope = { scope: 'admin', institutionAdminId: id }; socket.emit('joinAdmin', id); }
          else if (role === 'STUDENT' && id) { scope = { scope: 'student', studentId: id }; socket.emit('joinStudent', id); }
        } catch {}

        const cacheKey = cacheKeyFor(scope);
        const listKey = ['notifications','list'] as const;

        const onCreated = async (data: { notification: any }) => {
          const n = data.notification;
          const newNotification: NotificationItem = {
            id: n._id,
            title: n.title,
            description: n.description,
            time: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
            read: !!n.read,
            category: n.category,
          };
          const cat = (newNotification.category || 'other').toString().toLowerCase();
          const message = `${newNotification.title}${newNotification.description ? ` — ${newNotification.description}` : ''}`;
          try {
            if (cat === 'system') toast.info(message); else if (cat === 'billing') toast.warning(message); else if (cat === 'security') toast.error(message); else toast.success(message);
          } catch {}

          const current = (queryClient.getQueryData(listKey) as NotificationItem[] | undefined) || [];
          const next = [newNotification, ...current].sort((a, b) => b.time - a.time);
          queryClient.setQueryData(listKey, next);
          try { await cacheSet(cacheKey, next, CACHE_DURATION.INSTITUTION); } catch {}
        };

        const onUpdated = async (data: { notificationId: string, read: boolean }) => {
          const current = (queryClient.getQueryData(listKey) as NotificationItem[] | undefined) || [];
          const next = current.map(n => n.id === data.notificationId ? { ...n, read: data.read } : n);
          queryClient.setQueryData(listKey, next);
          try { await cacheSet(cacheKey, next, CACHE_DURATION.INSTITUTION); } catch {}
        };

        const onRemoved = async (data: { notificationId: string }) => {
          const current = (queryClient.getQueryData(listKey) as NotificationItem[] | undefined) || [];
          const next = current.filter(n => n.id !== data.notificationId);
          queryClient.setQueryData(listKey, next);
          try { await cacheSet(cacheKey, next, CACHE_DURATION.INSTITUTION); } catch {}
        };

        socket.on('notificationCreated', onCreated);
        socket.on('notificationUpdated', onUpdated);
        socket.on('notificationRemoved', onRemoved);

        return () => {
          try {
            socket.off('notificationCreated', onCreated);
            socket.off('notificationUpdated', onUpdated);
            socket.off('notificationRemoved', onRemoved);
          } catch {}
        };
      } catch {}
    })();

    return () => { mounted = false; };
  }, [queryClient]);

  return null;
}


