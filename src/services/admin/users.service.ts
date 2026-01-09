/**
 * Admin Users Service
 * 
 * API service for user management in the admin area.
 * Includes CRUD operations and avatar upload.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    AdminUserResponse,
    CreateUserRequest,
    UpdateUserRequest,
    AvatarResponse,
    AdminListFilters,
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
    const response = await apiPut<ApiResponse<AdminUserResponse>>(`/admin/users/${id}`, data);
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
export async function uploadAvatar(id: number, file: File): Promise<AvatarResponse> {
    const response = await apiUpload<ApiResponse<AvatarResponse>>(
        `/users/${id}/avatar`,
        file,
        'avatar',
        'PUT'
    );
    return response.data;
}

/**
 * Remove user avatar
 */
export async function removeAvatar(id: number): Promise<AvatarResponse> {
    const response = await apiPut<ApiResponse<AvatarResponse>>(
        `/users/${id}/avatar`,
        { remove: true }
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
};

export default usersService;
