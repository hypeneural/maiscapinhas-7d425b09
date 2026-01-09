/**
 * Audit Hooks
 * 
 * React Query hooks for audit logs.
 */

import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/admin';
import type { AuditLogFilters } from '@/types/admin.types';

/**
 * Query key factory for audit logs
 */
export const auditKeys = {
    all: ['audit'] as const,
    lists: () => [...auditKeys.all, 'list'] as const,
    list: (filters?: AuditLogFilters) => [...auditKeys.lists(), filters] as const,
    details: () => [...auditKeys.all, 'detail'] as const,
    detail: (id: number) => [...auditKeys.details(), id] as const,
    stats: (filters?: { from?: string; to?: string }) => [...auditKeys.all, 'stats', filters] as const,
};

/**
 * Hook to list audit logs with filters
 */
export function useAuditLogs(filters?: AuditLogFilters) {
    return useQuery({
        queryKey: auditKeys.list(filters),
        queryFn: () => auditService.list(filters),
    });
}

/**
 * Hook to get a single audit log
 */
export function useAuditLog(id: number) {
    return useQuery({
        queryKey: auditKeys.detail(id),
        queryFn: () => auditService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to get audit statistics
 */
export function useAuditStats(filters?: { from?: string; to?: string }) {
    return useQuery({
        queryKey: auditKeys.stats(filters),
        queryFn: () => auditService.getStats(filters),
    });
}
