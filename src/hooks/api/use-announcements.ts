/**
 * Announcements Hooks
 * 
 * React Query hooks for the Internal Communication System.
 * Includes optimistic updates and cache management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getActiveAnnouncements,
    getAnnouncementHistory,
    markAnnouncementSeen,
    acknowledgeAnnouncement,
    dismissAnnouncement,
    listAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    republishAnnouncement,
    duplicateAnnouncement,
    getAnnouncementStats,
    getAnnouncementReceipts,
} from '@/services/announcements.service';
import type {
    ActiveAnnouncementsParams,
    ActiveAnnouncementsResponse,
    AnnouncementFilters,
    CreateAnnouncementPayload,
    UpdateAnnouncementPayload,
    AnnouncementReceiptsFilters,
} from '@/types/announcements.types';

// ============================================================
// Query Keys
// ============================================================

export const announcementKeys = {
    all: ['announcements'] as const,

    // User queries
    active: (params?: ActiveAnnouncementsParams) =>
        [...announcementKeys.all, 'active', params] as const,
    history: (filters?: AnnouncementFilters) =>
        [...announcementKeys.all, 'history', filters] as const,

    // Admin queries
    list: (filters?: AnnouncementFilters) =>
        [...announcementKeys.all, 'list', filters] as const,
    detail: (id: number) =>
        [...announcementKeys.all, 'detail', id] as const,
};

// ============================================================
// Cache Strategies
// ============================================================

const CACHE_STRATEGIES = {
    active: {
        staleTime: 1000 * 60 * 2,         // 2 min stale
        refetchInterval: 1000 * 60 * 5,   // Poll every 5 min
        refetchOnWindowFocus: true,
    },
    history: {
        staleTime: 1000 * 60 * 5,         // 5 min stale
    },
    admin: {
        staleTime: 1000 * 60 * 2,         // 2 min stale
    },
};

// ============================================================
// User Hooks
// ============================================================

/**
 * Hook to get active announcements for dashboard
 * Returns critical (modals) and banners (carousel)
 */
export function useActiveAnnouncements(params?: ActiveAnnouncementsParams) {
    return useQuery({
        queryKey: announcementKeys.active(params),
        queryFn: () => getActiveAnnouncements(params),
        ...CACHE_STRATEGIES.active,
    });
}

/**
 * Hook to get user's announcement history
 */
export function useAnnouncementHistory(filters?: AnnouncementFilters) {
    return useQuery({
        queryKey: announcementKeys.history(filters),
        queryFn: () => getAnnouncementHistory(filters),
        ...CACHE_STRATEGIES.history,
    });
}

/**
 * Hook to mark announcement as seen
 */
export function useMarkSeen() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, storeId }: { id: number; storeId?: number }) =>
            markAnnouncementSeen(id, storeId),
        onSuccess: () => {
            // Invalidate active and history queries
            queryClient.invalidateQueries({ queryKey: announcementKeys.all });
        },
    });
}

/**
 * Hook to acknowledge announcement (ACK button)
 * Includes optimistic update to remove from critical list
 */
export function useAcknowledge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, storeId }: { id: number; storeId?: number }) =>
            acknowledgeAnnouncement(id, storeId),
        onMutate: async ({ id }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: announcementKeys.all });

            // Snapshot previous value
            const previousActive = queryClient.getQueriesData<ActiveAnnouncementsResponse>({
                queryKey: ['announcements', 'active'],
            });

            // Optimistically remove from critical list
            queryClient.setQueriesData<ActiveAnnouncementsResponse>(
                { queryKey: ['announcements', 'active'] },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        critical: old.critical.filter((a) => a.id !== id),
                    };
                }
            );

            return { previousActive };
        },
        onError: (_err, _vars, context) => {
            // Rollback on error
            if (context?.previousActive) {
                context.previousActive.forEach(([key, data]) => {
                    if (data) queryClient.setQueryData(key, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.all });
        },
    });
}

/**
 * Hook to dismiss announcement
 */
export function useDismiss() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, storeId }: { id: number; storeId?: number }) =>
            dismissAnnouncement(id, storeId),
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries({ queryKey: announcementKeys.all });

            // Optimistically remove from banners list
            queryClient.setQueriesData<ActiveAnnouncementsResponse>(
                { queryKey: ['announcements', 'active'] },
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        banners: old.banners.filter((a) => a.id !== id),
                    };
                }
            );
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.all });
        },
    });
}

// ============================================================
// Admin Hooks
// ============================================================

/**
 * Hook to list announcements (admin)
 */
export function useAnnouncements(filters?: AnnouncementFilters) {
    return useQuery({
        queryKey: announcementKeys.list(filters),
        queryFn: () => listAnnouncements(filters),
        ...CACHE_STRATEGIES.admin,
    });
}

/**
 * Hook to get single announcement
 */
export function useAnnouncement(id: number) {
    return useQuery({
        queryKey: announcementKeys.detail(id),
        queryFn: () => getAnnouncement(id),
        enabled: !!id && id > 0,
        ...CACHE_STRATEGIES.admin,
    });
}

/**
 * Hook to create announcement
 */
export function useCreateAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAnnouncementPayload) => createAnnouncement(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.all });
        },
    });
}

/**
 * Hook to update announcement
 */
export function useUpdateAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateAnnouncementPayload }) =>
            updateAnnouncement(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
        },
    });
}

/**
 * Hook to delete announcement
 */
export function useDeleteAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteAnnouncement(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.all });
        },
    });
}

/**
 * Hook to publish announcement
 */
export function usePublishAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => publishAnnouncement(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.active() });
        },
    });
}

/**
 * Hook to archive announcement
 */
export function useArchiveAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => archiveAnnouncement(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.active() });
        },
    });
}

/**
 * Hook to republish an archived/expired announcement
 */
export function useRepublishAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => republishAnnouncement(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
            queryClient.invalidateQueries({ queryKey: announcementKeys.active() });
        },
    });
}

/**
 * Hook to duplicate an announcement
 */
export function useDuplicateAnnouncement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => duplicateAnnouncement(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
        },
    });
}

/**
 * Hook to get announcement stats
 */
export function useAnnouncementStats(id: number) {
    return useQuery({
        queryKey: [...announcementKeys.detail(id), 'stats'],
        queryFn: () => getAnnouncementStats(id),
        enabled: !!id && id > 0,
        staleTime: 1000 * 60 * 1, // 1 min stale
    });
}

/**
 * Hook to get announcement receipts
 */
export function useAnnouncementReceipts(id: number, filters?: AnnouncementReceiptsFilters) {
    return useQuery({
        queryKey: [...announcementKeys.detail(id), 'receipts', filters],
        queryFn: () => getAnnouncementReceipts(id, filters),
        enabled: !!id && id > 0,
        staleTime: 1000 * 60 * 1, // 1 min stale
    });
}
