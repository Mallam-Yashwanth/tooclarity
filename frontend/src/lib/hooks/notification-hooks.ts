import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "@/lib/api";
import { useProfile } from "./user-hooks";

type NotificationItem = {
    id: string;
    title: string;
    description?: string;
    time: number;
    read: boolean;
    category?: "system" | "billing" | "user" | "security" | "other";
    metadata?: Record<string, unknown>;
};

export const NOTIFICATION_QUERY_KEY = ['notifications', 'infinite'] as const;

export function useInfiniteNotifications() {
    const { data: userProfile } = useProfile();

    return useInfiniteQuery({
        queryKey: NOTIFICATION_QUERY_KEY,
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam }) => {
            // 1. Determine Scope based on User Profile
            // (This logic mirrors what was in Topbar.tsx)
            const scopeParams: any = { limit: 50 }; // Batch size 50

            if (pageParam) {
                scopeParams.cursor = pageParam;
            }

            const prof = userProfile;
            const role = (prof?.role || '').toString().toUpperCase();
            const id = prof?.id || prof?._id;

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

            // 2. Fetch from API
            const res: any = await notificationsAPI.list(scopeParams);

            if (!res.success) throw new Error(res.message);

            // 3. Transform Data
            const items = (res.data?.items || []).map((n: any) => ({
                id: String(n._id || n.id || ''),
                title: String(n.title || ''),
                description: String(n.description || ''),
                time: n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
                read: !!n.read,
                category: String(n.category || ''),
                metadata: n.metadata,
            })) as NotificationItem[];

            const nextCursor = res.data?.nextCursor || null;

            return { items, nextCursor };
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!userProfile?.id, // Only run if user is loaded
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });
}
