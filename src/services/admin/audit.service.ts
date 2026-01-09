/**
 * Audit Service
 * 
 * API service for audit logs and statistics.
 */

import { apiGet } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    AuditLogEntry,
    AuditStats,
    AuditLogFilters,
} from '@/types/admin.types';

/**
 * List audit logs with optional filters
 */
export async function listAuditLogs(
    filters?: AuditLogFilters
): Promise<PaginatedResponse<AuditLogEntry>> {
    const params: Record<string, unknown> = {};

    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    if (filters?.causer_id) params.causer_id = filters.causer_id;
    if (filters?.event) params.event = filters.event;
    if (filters?.log_name) params.log_name = filters.log_name;
    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.subject_type) params.subject_type = filters.subject_type;
    if (filters?.subject_id) params.subject_id = filters.subject_id;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.page) params.page = filters.page;

    return apiGet<PaginatedResponse<AuditLogEntry>>('/admin/audit-logs', params);
}

/**
 * Get a single audit log by ID
 */
export async function getAuditLog(id: number): Promise<AuditLogEntry> {
    const response = await apiGet<ApiResponse<AuditLogEntry>>(`/admin/audit-logs/${id}`);
    return response.data;
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(
    filters?: { from?: string; to?: string }
): Promise<AuditStats> {
    const params: Record<string, unknown> = {};

    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;

    const response = await apiGet<ApiResponse<AuditStats>>('/admin/audit-logs/stats', params);
    return response.data;
}

/**
 * Audit Service object for easy importing
 */
export const auditService = {
    list: listAuditLogs,
    get: getAuditLog,
    getStats: getAuditStats,
};

export default auditService;
