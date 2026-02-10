"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { cacheSet, CACHE_DURATION } from "@/lib/localDb";
import { cacheKeyFor, type NotificationItem } from "@/lib/hooks/notifications-hooks";
import { authAPI } from "@/lib/api";

export default function NotificationSocketBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: { on: (ev: string, h: (...args: unknown[]) => void) => void; off: (ev: string, h: (...args: unknown[]) => void) => void; emit: (ev: string, ...args: unknown[]) => void } | null;
    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

        let origin = "";
        try {
          const urlObj = new URL(apiBase);
          origin = urlObj.origin; // This gives http://localhost:3001 without path
        } catch {
          origin = apiBase.replace(/\/api\/?$/, '');
        }
        if (!origin) origin = typeof window !== 'undefined' ? window.location.origin : '';

        socket = await getSocket(origin);
        if (!socket) return;

        // Derive role and id once (uses existing session cookie)
        let scope: Record<string, unknown> = {};
        try {
          const prof = await authAPI.getProfile();
          const role = ((prof as { data?: { role?: string; id?: string } })?.data?.role || '').toString().toUpperCase();
          const id = (prof as { data?: { role?: string; id?: string } })?.data?.id;
          if (role === 'INSTITUTE_ADMIN' && id) { scope = { scope: 'admin', institutionAdminId: id }; socket.emit('joinInstitutionAdmin', id); }
          else if (role === 'ADMIN' && id) { scope = { scope: 'admin', institutionAdminId: id }; socket.emit('joinAdmin', id); }
          else if (role === 'STUDENT' && id) { scope = { scope: 'student', studentId: id }; socket.emit('joinStudent', id); }
        } catch { }

        const cacheKey = cacheKeyFor(scope as { scope: "institution" | "student" | "branch" | "admin"; institutionAdminId?: string; studentId?: string });
        const listKey = ['notifications', 'list'] as const;

        const onCreated = async (data: { notification: { _id: string; title?: string; description?: string; createdAt?: string; read?: boolean; category?: string } }) => {
          const n = data.notification;
          const newNotification: NotificationItem = {
            id: n._id,
            title: n.title || '',
            description: n.description || '',
            time: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
            read: !!n.read,
            category: (n.category as NotificationItem['category']) || 'other',
          };
          const cat = (newNotification.category || 'other').toString().toLowerCase();
          const message = `${newNotification.title}${newNotification.description ? ` — ${newNotification.description}` : ''}`;
          try {
            if (cat === 'system') toast.info(message); else if (cat === 'billing') toast.warning(message); else if (cat === 'security') toast.error(message); else toast.success(message);
          } catch { }

          const current = (queryClient.getQueryData(listKey) as NotificationItem[] | undefined) || [];
          const next = [newNotification, ...current].sort((a, b) => b.time - a.time);
          queryClient.setQueryData(listKey, next);
          try { await cacheSet(cacheKey, next, CACHE_DURATION.INSTITUTION); } catch { }
        };

        const onUpdated = async (data: { notificationId: string, read: boolean }) => {
          const current = (queryClient.getQueryData(listKey) as NotificationItem[] | undefined) || [];
          const next = current.map(n => n.id === data.notificationId ? { ...n, read: data.read } : n);
          queryClient.setQueryData(listKey, next);
          try { await cacheSet(cacheKey, next, CACHE_DURATION.INSTITUTION); } catch { }
        };

        const onRemoved = async (data: { notificationId: string }) => {
          const current = (queryClient.getQueryData(listKey) as NotificationItem[] | undefined) || [];
          const next = current.filter(n => n.id !== data.notificationId);
          queryClient.setQueryData(listKey, next);
          try { await cacheSet(cacheKey, next, CACHE_DURATION.INSTITUTION); } catch { }
        };

        socket.on('notificationCreated', (d: unknown) => { void onCreated(d as { notification: { _id: string; title?: string; description?: string; createdAt?: string; read?: boolean; category?: string } }); });
        socket.on('notificationUpdated', (d: unknown) => { void onUpdated(d as { notificationId: string; read: boolean }); });
        socket.on('notificationRemoved', (d: unknown) => { void onRemoved(d as { notificationId: string }); });

        return () => {
          try {
            if (socket) {
              socket.off('notificationCreated', (d: unknown) => { void onCreated(d as { notification: { _id: string; title?: string; description?: string; createdAt?: string; read?: boolean; category?: string } }); });
              socket.off('notificationUpdated', (d: unknown) => { void onUpdated(d as { notificationId: string; read: boolean }); });
              socket.off('notificationRemoved', (d: unknown) => { void onRemoved(d as { notificationId: string }); });
            }
          } catch { }
        };
      } catch { }
    })();

    return () => { /* cleanup */ };
  }, [queryClient]);

  return null;
}


