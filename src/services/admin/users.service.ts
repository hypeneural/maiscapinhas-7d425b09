/**
 * Admin Users Service
 * 
 * API service for user management in the admin area.
 * Includes CRUD operations, avatar upload, and bulk store operations.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiUpload, api, apiPatch } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    AdminUserResponse,
    CreateUserRequest,
    UpdateUserRequest,
    AvatarResponse,
    AdminListFilters,
    BulkAddStoresRequest,
    BulkAddStoresResponse,
    BulkUpdateStoresRequest,
    BulkUpdateStoresResponse,
    BulkRemoveStoresRequest,
    BulkRemoveStoresResponse,
    SyncStoresRequest,
    SyncStoresResponse,
} from '@/types/admin.types';

/**
 * List all users with optional filters
 */
export async function listUsers(
    filters?: AdminListFilters
): Promise<PaginatedResponse<AdminUserResponse>> {
    const params: Record<string, unknown> = {};

    if (filters?.search) params.search = filters.search;
    if (filters?.active !== undefined) params.active = filters.active;
    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.has_stores !== undefined) params.has_stores = filters.has_stores;
    if (filters?.role) params.role = filters.role;
    if (filters?.is_global_admin !== undefined) params.is_global_admin = filters.is_global_admin;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.page) params.page = filters.page;

    return apiGet<PaginatedResponse<AdminUserResponse>>('/admin/users', params);
}

/**
 * Get a single user by ID
 */
export async function getUser(id: number): Promise<AdminUserResponse> {
    const response = await apiGet<ApiResponse<AdminUserResponse>>(`/admin/users/${id}`);
    return response.data;
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserRequest): Promise<AdminUserResponse> {
    const response = await apiPost<ApiResponse<AdminUserResponse>>('/admin/users', data);
    return response.data;
}

/**
 * Update an existing user
 */
export async function updateUser(
    id: number,
    data: UpdateUserRequest
): Promise<AdminUserResponse> {
    const response = await apiPatch<ApiResponse<AdminUserResponse>>(`/admin/users/${id}`, data);
    return response.data;
}

/**
 * Deactivate a user (soft delete)
 * Sets active = false and revokes all tokens
 */
export async function deactivateUser(id: number): Promise<void> {
    await apiDelete(`/admin/users/${id}`);
}

/**
 * Reactivate a deactivated user
 */
export async function reactivateUser(id: number): Promise<AdminUserResponse> {
    return updateUser(id, { active: true });
}

/**
 * Upload user avatar
 * @param id User ID
 * @param file Image file (jpg, png, webp - max 2MB, min 200x200px)
 */
export async function uploadAvatar(id: number, file: File | Blob): Promise<AvatarResponse> {
    const response = await apiUpload<ApiResponse<AvatarResponse>>(
        `/users/${id}/avatar`,
        file,
        'avatar'
    );
    return response.data;
}

/**
 * Remove user avatar
 * Uses POST with FormData and remove=true
 */
export async function removeAvatar(id: number): Promise<AvatarResponse> {
    const formData = new FormData();
    formData.append('remove', 'true');

    const response = await api.post<ApiResponse<AvatarResponse>>(
        `/users/${id}/avatar`,
        formData
    );
    return response.data.data;
}

// ============================================================
// Bulk Store Operations
// ============================================================

/**
 * Add user to multiple stores at once
 * Stores that are already linked will be skipped (not updated)
 */
export async function bulkAddStores(
    userId: number,
    data: BulkAddStoresRequest
): Promise<BulkAddStoresResponse> {
    const response = await apiPost<ApiResponse<BulkAddStoresResponse>>(
        `/admin/users/${userId}/stores/bulk`,
        data
    );
    return response.data;
}

/**
 * Update role in multiple stores at once
 * Useful for promoting/demoting user across all stores
 */
export async function bulkUpdateStores(
    userId: number,
    data: BulkUpdateStoresRequest
): Promise<BulkUpdateStoresResponse> {
    const response = await apiPatch<ApiResponse<BulkUpdateStoresResponse>>(
        `/admin/users/${userId}/stores/bulk`,
        data
    );
    return response.data;
}

/**
 * Remove user from multiple stores at once
 */
export async function bulkRemoveStores(
    userId: number,
    data: BulkRemoveStoresRequest
): Promise<BulkRemoveStoresResponse> {
    const response = await apiDelete<ApiResponse<BulkRemoveStoresResponse>>(
        `/admin/users/${userId}/stores/bulk`,
        { data }
    );
    return response.data;
}

/**
 * Sync user stores (replace all)
 * WARNING: This removes all existing bindings and creates only the ones specified
 */
export async function syncStores(
    userId: number,
    data: SyncStoresRequest
): Promise<SyncStoresResponse> {
    const response = await apiPut<ApiResponse<SyncStoresResponse>>(
        `/admin/users/${userId}/stores`,
        data
    );
    return response.data;
}

/**
 * Users Service object for easy importing
 */
export const usersService = {
    list: listUsers,
    get: getUser,
    create: createUser,
    update: updateUser,
    deactivate: deactivateUser,
    reactivate: reactivateUser,
    uploadAvatar,
    removeAvatar,
    // Bulk operations
    bulkAddStores,
    bulkUpdateStores,
    bulkRemoveStores,
    syncStores,
};

export default usersService;

