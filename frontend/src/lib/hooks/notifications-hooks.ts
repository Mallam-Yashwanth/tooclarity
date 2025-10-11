import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI, authAPI } from '../api';
import { cacheGet, cacheSet, CACHE_DURATION } from '../localDb';

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  time: number; // epoch ms
  read: boolean;
  category?: 'system' | 'billing' | 'user' | 'security' | 'other';
};

export const BASE_CACHE_KEY = 'notifications:list';

export function cacheKeyFor(scope: { scope?: 'student'|'institution'|'branch'|'admin'; studentId?: string; institutionId?: string; branchId?: string; institutionAdminId?: string }) {
  const parts = [BASE_CACHE_KEY, scope.scope || 'all'];
  if (scope.scope === 'student') parts.push(scope.studentId || '');
  if (scope.scope === 'institution') parts.push(scope.institutionId || '');
  if (scope.scope === 'branch') parts.push(scope.branchId || '');
  if (scope.scope === 'admin') parts.push(scope.institutionAdminId || '');
  return parts.join(':');
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async (): Promise<NotificationItem[]> => {
      // Determine scope and role with a single profile call (cached by react-query)
      let scopeParams: any = {};
      try {
        const prof = await authAPI.getProfile();
        const role = ((prof as any)?.data?.role || '').toString().toUpperCase();
        const id = (prof as any)?.data?.id;
        if (role === 'INSTITUTE_ADMIN' && id) {
          scopeParams.scope = 'admin';
          scopeParams.institutionAdminId = id;
        } else if (role === 'ADMIN' && id) {
          scopeParams.scope = 'admin';
          scopeParams.institutionAdminId = id;
        } else if (role === 'STUDENT' && id) {
          scopeParams.scope = 'student';
          scopeParams.studentId = id;
        }
      } catch (err) {
        console.error('Notifications hooks: profile fetch failed for scope', err);
      }

      const key = cacheKeyFor(scopeParams);
      // Try cache first per-scope
      const cached = await cacheGet<NotificationItem[]>(key);
      if (Array.isArray(cached) && cached.length) {
        return cached;
      }

      // Fetch from API
      const res = await notificationsAPI.listCursor({ ...scopeParams, limit: 100, cursor: null });
      const mapped: NotificationItem[] = (res?.data?.items || res?.data || []).map((n: any) => ({
        id: n._id,
        title: n.title,
        description: n.description,
        time: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
        read: !!n.read,
        category: n.category,
      })).sort((a: NotificationItem, b: NotificationItem) => b.time - a.time);

      // Save to cache per-scope
      await cacheSet(key, mapped, CACHE_DURATION.STUDENTS);
      return mapped;
    },
    staleTime: CACHE_DURATION.STUDENTS,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useNotificationActions() {
  const qc = useQueryClient();
  const setCache = async (updater: (list: NotificationItem[]) => NotificationItem[]) => {
    const keyTuple = ['notifications', 'list'] as const;
    const current = (qc.getQueryData(keyTuple) as NotificationItem[]) || [];
    const next = updater(current);
    qc.setQueryData(keyTuple, next);
    // Scope cache is updated by the socket bridge and initial load; avoid duplicate writes here.
  };

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await setCache(list => list.map(i => ids.includes(i.id) ? { ...i, read: true } : i));
      try { await notificationsAPI.markRead(ids); } catch (err) { console.error('Notifications hooks: markRead failed', err); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); }
  });


  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      await setCache(list => list.filter(i => !ids.includes(i.id)));
      try { await notificationsAPI.remove(ids); } catch (err) { console.error('Notifications hooks: remove failed', err); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); }
  });

  return { markRead, remove };
} 