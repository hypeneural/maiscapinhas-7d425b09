/**
 * Admin Stores Service
 * 
 * API service for store management and user bindings.
 * Includes CRUD operations, photo upload, and user-store relationships.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    AdminStoreResponse,
    CreateStoreRequest,
    UpdateStoreRequest,
    StorePhotoResponse,
    StoreUserBinding,
    CreateStoreUserRequest,
    UpdateStoreUserRequest,
    AdminListFilters,
} from '@/types/admin.types';

// ============================================================
// Store CRUD
// ============================================================

/**
 * List all stores with optional filters
 */
export async function listStores(
    filters?: AdminListFilters
): Promise<PaginatedResponse<AdminStoreResponse>> {
    const params: Record<string, unknown> = {};

    if (filters?.search) params.search = filters.search;
    if (filters?.active !== undefined) params.active = filters.active;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.page) params.page = filters.page;

    return apiGet<PaginatedResponse<AdminStoreResponse>>('/admin/stores', params);
}

/**
 * Get a single store by ID with user bindings
 */
export async function getStore(id: number): Promise<AdminStoreResponse> {
    const response = await apiGet<ApiResponse<AdminStoreResponse>>(`/admin/stores/${id}`);
    return response.data;
}

/**
 * Create a new store
 */
export async function createStore(data: CreateStoreRequest): Promise<AdminStoreResponse> {
    const response = await apiPost<ApiResponse<AdminStoreResponse>>('/admin/stores', data);
    return response.data;
}

/**
 * Update an existing store
 */
export async function updateStore(
    id: number,
    data: UpdateStoreRequest
): Promise<AdminStoreResponse> {
    const response = await apiPut<ApiResponse<AdminStoreResponse>>(`/admin/stores/${id}`, data);
    return response.data;
}

/**
 * Deactivate a store (soft delete)
 */
export async function deactivateStore(id: number): Promise<void> {
    await apiDelete(`/admin/stores/${id}`);
}

/**
 * Reactivate a deactivated store
 */
export async function reactivateStore(id: number): Promise<AdminStoreResponse> {
    return updateStore(id, { active: true });
}

// ============================================================
// Store Photo
// ============================================================

/**
 * Upload store photo
 * @param id Store ID
 * @param file Image file (jpg, png, webp - max 5MB, min 800x600px)
 */
export async function uploadPhoto(id: number, file: File): Promise<StorePhotoResponse> {
    const response = await apiUpload<ApiResponse<StorePhotoResponse>>(
        `/stores/${id}/photo`,
        file,
        'photo',
        'PUT'
    );
    return response.data;
}

/**
 * Remove store photo
 */
export async function removePhoto(id: number): Promise<StorePhotoResponse> {
    const response = await apiPut<ApiResponse<StorePhotoResponse>>(
        `/stores/${id}/photo`,
        { remove: true }
    );
    return response.data;
}

// ============================================================
// Store-User Bindings
// ============================================================

/**
 * List users in a store
 */
export async function listStoreUsers(storeId: number): Promise<StoreUserBinding[]> {
    const response = await apiGet<ApiResponse<StoreUserBinding[]>>(
        `/admin/stores/${storeId}/users`
    );
    return response.data;
}

/**
 * Add a user to a store
 */
export async function addUserToStore(
    storeId: number,
    data: CreateStoreUserRequest
): Promise<{ user_id: number; store_id: number; role: string }> {
    const response = await apiPost<ApiResponse<{ user_id: number; store_id: number; role: string }>>(
        `/admin/stores/${storeId}/users`,
        data
    );
    return response.data;
}

/**
 * Update user role in a store
 */
export async function updateUserRole(
    storeId: number,
    userId: number,
    data: UpdateStoreUserRequest
): Promise<void> {
    await apiPut(`/admin/stores/${storeId}/users/${userId}`, data);
}

/**
 * Remove user from a store
 */
export async function removeUserFromStore(storeId: number, userId: number): Promise<void> {
    await apiDelete(`/admin/stores/${storeId}/users/${userId}`);
}

/**
 * Stores Service object for easy importing
 */
export const storesService = {
    list: listStores,
    get: getStore,
    create: createStore,
    update: updateStore,
    deactivate: deactivateStore,
    reactivate: reactivateStore,
    uploadPhoto,
    removePhoto,
    listUsers: listStoreUsers,
    addUser: addUserToStore,
    updateUserRole,
    removeUser: removeUserFromStore,
};

export default storesService;
