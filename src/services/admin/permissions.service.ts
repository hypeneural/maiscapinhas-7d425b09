/**
 * Permissions Service
 *
 * API calls for permission management.
 */

import { api } from '@/lib/api';
import type {
    Permission,
    ModuleGroup,
    PermissionsByTypeResponse,
    PermissionOverride,
    EffectivePermission,
    AddPermissionOverrideRequest,
    UserPermissionsResponse,
    EffectivePermissionsResponse,
    PermissionsListResponse,
} from '@/types/permissions.types';
import type { ApiResponse } from '@/types/api';

const BASE_URL = '/admin';

// ============================================================
// Permissions List
// ============================================================

/**
 * List all permissions in the system
 */
export async function getPermissions(): Promise<PermissionsListResponse> {
    const response = await api.get<PermissionsListResponse>(`${BASE_URL}/permissions`);
    return response.data;
}

/**
 * Get permissions grouped by module
 * Returns array of ModuleGroup with abilities/screens/features
 */
export async function getPermissionsGrouped(): Promise<ModuleGroup[]> {
    const response = await api.get<ApiResponse<ModuleGroup[]>>(
        `${BASE_URL}/permissions/grouped`
    );
    return response.data.data;
}

/**
 * Get permissions separated by type
 * Returns abilities/screens/features with metadata
 */
export async function getPermissionsByType(): Promise<PermissionsByTypeResponse> {
    const response = await api.get<ApiResponse<PermissionsByTypeResponse>>(
        `${BASE_URL}/permissions/by-type`
    );
    return response.data.data;
}

// ============================================================
// User Permissions
// ============================================================

/**
 * Get user permission overrides
 * GET /admin/users/{id}/permission-overrides
 */
export async function getUserPermissions(userId: number): Promise<UserPermissionsResponse> {
    const response = await api.get<ApiResponse<UserPermissionsResponse>>(
        `${BASE_URL}/users/${userId}/permission-overrides`
    );
    return response.data.data;
}

/**
 * Get user effective permissions with source information
 * GET /admin/users/{id}/permission-overrides/effective
 */
export async function getUserEffectivePermissions(
    userId: number
): Promise<EffectivePermissionsResponse> {
    const response = await api.get<ApiResponse<EffectivePermissionsResponse>>(
        `${BASE_URL}/users/${userId}/permission-overrides/effective`
    );
    return response.data.data;
}

/**
 * Add permission override for user
 * POST /admin/users/{id}/permission-overrides
 */
export async function addUserPermissionOverride(
    userId: number,
    data: AddPermissionOverrideRequest
): Promise<PermissionOverride> {
    const response = await api.post<ApiResponse<PermissionOverride>>(
        `${BASE_URL}/users/${userId}/permission-overrides`,
        data
    );
    return response.data.data;
}

/**
 * Remove permission override from user
 * DELETE /admin/users/{id}/permission-overrides/{overrideId}
 */
export async function removeUserPermissionOverride(
    userId: number,
    overrideId: number
): Promise<void> {
    await api.delete(`${BASE_URL}/users/${userId}/permission-overrides/${overrideId}`);
}

/**
 * Clear all permission overrides for user
 * DELETE /admin/users/{id}/permission-overrides/clear
 */
export async function clearUserPermissionOverrides(
    userId: number
): Promise<{ message: string }> {
    const response = await api.delete<ApiResponse<{ message: string }>>(
        `${BASE_URL}/users/${userId}/permission-overrides/clear`
    );
    return response.data.data;
}

// ============================================================
// Store Permissions
// ============================================================

/**
 * Get store permission overrides
 */
export async function getStorePermissions(
    storeId: number
): Promise<PermissionOverride[]> {
    const response = await api.get<ApiResponse<PermissionOverride[]>>(
        `${BASE_URL}/stores/${storeId}/permissions`
    );
    return response.data.data;
}

/**
 * Add permission override for store
 */
export async function addStorePermissionOverride(
    storeId: number,
    data: AddPermissionOverrideRequest
): Promise<PermissionOverride> {
    const response = await api.post<ApiResponse<PermissionOverride>>(
        `${BASE_URL}/stores/${storeId}/permissions`,
        data
    );
    return response.data.data;
}

/**
 * Remove permission override from store
 */
export async function removeStorePermissionOverride(
    storeId: number,
    overrideId: number
): Promise<void> {
    await api.delete(`${BASE_URL}/stores/${storeId}/permissions/${overrideId}`);
}

// ============================================================
// New Endpoints (v2.0)
// ============================================================

/**
 * Preview permission changes before applying
 */
export interface PermissionPreviewRequest {
    user_id: number;
    add_permissions?: string[];
    remove_permissions?: string[];
}

export interface PermissionPreviewResponse {
    user_id: number;
    user_name: string;
    current: string[];
    after: string[];
    added: string[];
    removed: string[];
    total_change: number;
}

export async function previewPermissionChanges(
    data: PermissionPreviewRequest
): Promise<PermissionPreviewResponse> {
    const response = await api.post<ApiResponse<PermissionPreviewResponse>>(
        `${BASE_URL}/permissions/preview`,
        data
    );
    return response.data.data;
}

/**
 * Bulk grant permissions to multiple users
 */
export interface BulkGrantRequest {
    user_ids: number[];
    permissions: string[];
    expires_at?: string;
    reason?: string;
}

export interface BulkGrantResponse {
    message: string;
    data: Array<{
        user_id: number;
        user_name: string;
        granted: string[];
    }>;
    total_users: number;
    total_permissions: number;
}

export async function bulkGrantPermissions(
    data: BulkGrantRequest
): Promise<BulkGrantResponse> {
    const response = await api.post<BulkGrantResponse>(
        `${BASE_URL}/permissions/bulk-grant`,
        data
    );
    return response.data;
}

/**
 * Copy permissions from one user to another
 */
export interface CopyPermissionsRequest {
    include_temporary?: boolean;
    expires_at?: string;
}

export interface CopyPermissionsResponse {
    message: string;
    data: {
        source_user: string;
        target_user: string;
        permissions_copied: string[];
        count: number;
    };
}

export async function copyUserPermissions(
    targetUserId: number,
    sourceUserId: number,
    data?: CopyPermissionsRequest
): Promise<CopyPermissionsResponse> {
    const response = await api.post<CopyPermissionsResponse>(
        `${BASE_URL}/users/${targetUserId}/permissions/copy-from/${sourceUserId}`,
        data ?? {}
    );
    return response.data;
}

/**
 * Get user permission audit log
 */
export interface PermissionAuditEntry {
    permission: string;
    type: 'grant' | 'deny';
    is_active: boolean;
    granted_by: string;
    reason?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface PermissionAuditLogResponse {
    user_id: number;
    user_name: string;
    entries: PermissionAuditEntry[];
    total: number;
}

export async function getUserPermissionAuditLog(
    userId: number
): Promise<PermissionAuditLogResponse> {
    const response = await api.get<ApiResponse<PermissionAuditLogResponse>>(
        `${BASE_URL}/users/${userId}/permissions/audit-log`
    );
    return response.data.data;
}

// ============================================================
// Analytics (New)
// ============================================================

/**
 * Get most granted permissions
 */
export interface MostGrantedPermission {
    permission: string;
    display_name: string;
    module: string;
    count: number;
}

export async function getMostGrantedPermissions(
    limit: number = 10
): Promise<MostGrantedPermission[]> {
    const response = await api.get<{ data: MostGrantedPermission[]; total: number }>(
        `${BASE_URL}/permissions/most-granted`,
        { params: { limit } }
    );
    return response.data.data;
}

/**
 * Get users that have a specific permission
 */
export interface PermissionUser {
    id: number;
    name: string;
    email: string;
    source: 'role' | 'override';
    is_temporary: boolean;
    expires_at?: string;
}

export interface PermissionUsersResponse {
    permission: string;
    display_name: string;
    users: PermissionUser[];
    total: number;
}

export async function getPermissionUsers(
    permissionName: string
): Promise<PermissionUsersResponse> {
    const response = await api.get<ApiResponse<PermissionUsersResponse>>(
        `${BASE_URL}/permissions/${permissionName}/users`
    );
    return response.data.data;
}

export const permissionsService = {
    getPermissions,
    getPermissionsGrouped,
    getPermissionsByType,
    getUserPermissions,
    getUserEffectivePermissions,
    addUserPermissionOverride,
    removeUserPermissionOverride,
    clearUserPermissionOverrides,
    getStorePermissions,
    addStorePermissionOverride,
    removeStorePermissionOverride,
    // New v2.0
    previewPermissionChanges,
    bulkGrantPermissions,
    copyUserPermissions,
    getUserPermissionAuditLog,
    // Analytics
    getMostGrantedPermissions,
    getPermissionUsers,
};

export default permissionsService;
