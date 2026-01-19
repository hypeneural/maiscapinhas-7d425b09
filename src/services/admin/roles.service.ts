/**
 * Roles Service
 *
 * API calls for role management.
 */

import { api } from '@/lib/api';
import type {
    Role,
    RoleWithPermissions,
    CreateRoleRequest,
    UpdateRoleRequest,
    AssignRoleRequest,
    RoleAssignment,
} from '@/types/permissions.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

const BASE_URL = '/admin';

// ============================================================
// Roles CRUD
// ============================================================

/**
 * List all roles
 */
export async function getRoles(): Promise<Role[]> {
    const response = await api.get<{ data: Role[] }>(`${BASE_URL}/roles`);
    return response.data.data;
}

/**
 * Get available roles with hierarchy level
 * GET /admin/roles/available
 * Returns all roles sorted by level for role assignment
 */
export async function getAvailableRoles(): Promise<Role[]> {
    const response = await api.get<{ data: Role[] }>(`${BASE_URL}/roles/available`);
    return response.data.data;
}

/**
 * Get role details with permissions
 */
export async function getRole(roleId: number): Promise<RoleWithPermissions> {
    const response = await api.get<ApiResponse<RoleWithPermissions>>(
        `${BASE_URL}/roles/${roleId}`
    );
    return response.data.data;
}

/**
 * Create a new role
 */
export async function createRole(data: CreateRoleRequest): Promise<Role> {
    const response = await api.post<ApiResponse<Role>>(`${BASE_URL}/roles`, data);
    return response.data.data;
}

/**
 * Update a role
 */
export async function updateRole(
    roleId: number,
    data: UpdateRoleRequest
): Promise<Role> {
    const response = await api.put<ApiResponse<Role>>(
        `${BASE_URL}/roles/${roleId}`,
        data
    );
    return response.data.data;
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: number): Promise<void> {
    await api.delete(`${BASE_URL}/roles/${roleId}`);
}

// ============================================================
// User Roles
// ============================================================

/**
 * Get user's role assignments
 */
export async function getUserRoles(userId: number): Promise<RoleAssignment[]> {
    const response = await api.get<ApiResponse<RoleAssignment[]>>(
        `${BASE_URL}/users/${userId}/roles`
    );
    return response.data.data;
}

/**
 * Assign role to user
 */
export async function assignUserRole(
    userId: number,
    data: AssignRoleRequest
): Promise<RoleAssignment> {
    const response = await api.post<ApiResponse<RoleAssignment>>(
        `${BASE_URL}/users/${userId}/roles`,
        data
    );
    return response.data.data;
}

/**
 * Remove role from user
 */
export async function removeUserRole(
    userId: number,
    assignmentId: number
): Promise<void> {
    await api.delete(`${BASE_URL}/users/${userId}/roles/${assignmentId}`);
}

/**
 * Sync all user roles (replace all roles with new list)
 */
export async function syncUserRoles(
    userId: number,
    roles: AssignRoleRequest[]
): Promise<RoleAssignment[]> {
    const response = await api.put<ApiResponse<RoleAssignment[]>>(
        `${BASE_URL}/users/${userId}/roles/sync`,
        { roles }
    );
    return response.data.data;
}

// ============================================================
// New Endpoints (v2.0)
// ============================================================

/**
 * Clone a role
 */
export interface CloneRoleRequest {
    name: string;
    display_name: string;
    description?: string;
}

export interface CloneRoleResponse {
    message: string;
    data: {
        id: number;
        name: string;
        display_name: string;
        permissions_count: number;
        cloned_from: string;
    };
}

export async function cloneRole(
    roleId: number,
    data: CloneRoleRequest
): Promise<CloneRoleResponse> {
    const response = await api.post<CloneRoleResponse>(
        `${BASE_URL}/roles/${roleId}/clone`,
        data
    );
    return response.data;
}

/**
 * Update role permissions (add/remove)
 */
export interface UpdateRolePermissionsRequest {
    add?: string[];
    remove?: string[];
}

export interface UpdateRolePermissionsResponse {
    message: string;
    data: {
        role_id: number;
        permissions: string[];
        permissions_count: number;
    };
}

export async function updateRolePermissions(
    roleId: number,
    data: UpdateRolePermissionsRequest
): Promise<UpdateRolePermissionsResponse> {
    const response = await api.put<UpdateRolePermissionsResponse>(
        `${BASE_URL}/roles/${roleId}/permissions`,
        data
    );
    return response.data;
}

/**
 * Sync role permissions (replace all)
 * POST /admin/roles/{id}/permissions
 */
export interface SyncRolePermissionsRequest {
    permissions: string[];
}

export interface SyncRolePermissionsResponse {
    message: string;
    data: {
        role_id: number;
        permissions: string[];
        permissions_count: number;
    };
}

export async function syncRolePermissions(
    roleId: number,
    permissions: string[]
): Promise<SyncRolePermissionsResponse> {
    const response = await api.post<SyncRolePermissionsResponse>(
        `${BASE_URL}/roles/${roleId}/permissions`,
        { permissions }
    );
    return response.data;
}

export const rolesService = {
    getRoles,
    getAvailableRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    getUserRoles,
    assignUserRole,
    removeUserRole,
    syncUserRoles,
    // New v2.0
    cloneRole,
    updateRolePermissions,
    syncRolePermissions,
};

export default rolesService;
