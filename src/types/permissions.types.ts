/**
 * Permission System Types
 * 
 * TypeScript interfaces for the granular permission system.
 */

// ============================================================
// Base Permission Types
// ============================================================

/**
 * Permission type categories
 */
export type PermissionType = 'ability' | 'screen' | 'feature';

/**
 * Permission entity from the API
 */
export interface Permission {
    id: number;
    name: string;
    display_name: string;
    type: PermissionType;
    type_display?: string;           // "Ação", "Tela", "Feature"
    module: string;
    module_display?: string;
    description: string | null;
    sort_order?: number;
    group?: string | null;
}

/**
 * Permission group within a module (from /permissions/grouped)
 */
export interface ModuleGroup {
    module: string;                  // "pedidos"
    module_display: string;          // "Pedidos"
    abilities: Permission[];
    screens: Permission[];
    features: Permission[];
}

/**
 * Response from /permissions/grouped endpoint
 */
export interface PermissionsGroupedResponse {
    data: ModuleGroup[];
}

/**
 * Permission type group from /permissions/by-type endpoint
 */
export interface PermissionTypeGroup {
    type: PermissionType;
    display: string;
    description: string;
    permissions: Permission[];
}

/**
 * Response from /permissions/by-type endpoint
 */
export interface PermissionsByTypeResponse {
    abilities: PermissionTypeGroup;
    screens: PermissionTypeGroup;
    features: PermissionTypeGroup;
}

/**
 * Permission group for UI organization (legacy)
 */
export interface PermissionGroup {
    id: string;
    label: string;
    icon: string;
    description?: string;
    permissions: string[];
}

// ============================================================
// Role Types
// ============================================================

/**
 * Role entity (basic)
 */
export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system: boolean;
    permissions_count: number;
    users_count: number;
}

/**
 * Role with full permissions list
 */
export interface RoleWithPermissions extends Role {
    permissions: Array<{
        name: string;
        display_name: string;
    }>;
    users: Array<{
        id: number;
        name: string;
        store?: string;
    }>;
}

/**
 * Request to create a new role
 */
export interface CreateRoleRequest {
    name: string;
    display_name: string;
    description?: string;
    permissions: string[];
}

/**
 * Request to update a role
 */
export interface UpdateRoleRequest {
    display_name?: string;
    description?: string;
    permissions?: string[];
}

/**
 * Request to assign role to user
 */
export interface AssignRoleRequest {
    role_id: number;
    store_id: number;
}

/**
 * Role assignment entity
 */
export interface RoleAssignment {
    id: number;
    user_id: number;
    role_id: number;
    role_name: string;
    role_display_name: string;
    store_id: number;
    store_name: string;
    assigned_at: string;
}

// ============================================================
// Permission Overrides
// ============================================================

/**
 * Override type
 */
export type OverrideType = 'grant' | 'deny';

/**
 * Permission override entity (user-level)
 */
export interface PermissionOverride {
    id: number;
    permission: {
        id: number;
        name: string;
        display_name: string;
        type: PermissionType;
        module: string;
    };
    type: OverrideType;
    store?: { id: number; name: string } | null;
    is_global: boolean;
    expires_at?: string | null;
    granted_by?: string;
    reason?: string;
    created_at: string;
}

/**
 * Request to add permission override
 */
export interface AddPermissionOverrideRequest {
    permission_id: number;
    type: OverrideType;
    store_id?: number | null;   // null = global
    expires_at?: string | null;
    reason?: string;
}

/**
 * Store permission override (applies to all users in store)
 */
export interface StorePermissionOverride {
    id: number;
    permission: Permission;
    granted: boolean;   // true = grant, false = deny
    created_at: string;
    updated_at: string;
}

// ============================================================
// Effective Permissions
// ============================================================

/**
 * Source of an effective permission
 */
export type PermissionSource = 'role' | 'user_override' | 'store_override';

/**
 * Effective permission with source information
 */
export interface EffectivePermission {
    name: string;
    display_name: string;
    source: PermissionSource;
    role?: string;
    store?: string;
    granted_by?: string;
    expires_at?: string | null;
    reason?: string;
}

/**
 * Effective permissions response
 */
export interface EffectivePermissionsResponse {
    user_id: number;
    permissions: EffectivePermission[];
}

// ============================================================
// Temporary Permissions (from /me)
// ============================================================

/**
 * Temporary permission from /me
 */
export interface TemporaryPermission {
    permission: string;
    expires_at: string;
    granted_by: string;
}

/**
 * Expiring soon permission from /me
 */
export interface ExpiringPermission {
    permission: string;
    expires_in_hours: number;
}

// ============================================================
// User Permissions Response
// ============================================================

/**
 * User permissions response
 */
export interface UserPermissionsResponse {
    user_id: number;
    user_name: string;
    permissions: string[];
    overrides: PermissionOverride[];
}

// ============================================================
// Permissions List Response
// ============================================================

/**
 * Permissions list response with groups
 */
export interface PermissionsListResponse {
    data: Permission[];
    groups: Record<string, {
        label: string;
        icon: string;
    }>;
}

// ============================================================
// Bulk Operations
// ============================================================

/**
 * Request to preview permission changes
 */
export interface PermissionPreviewRequest {
    user_id: number;
    add_permissions?: string[];
    remove_permissions?: string[];
}

/**
 * Response from permission preview
 */
export interface PermissionPreviewResponse {
    user_id: number;
    user_name: string;
    current: string[];
    after: string[];
    added: string[];
    removed: string[];
    total_change: number;
}

/**
 * Request to bulk grant permissions
 */
export interface BulkGrantPermissionsRequest {
    user_ids: number[];
    permissions: string[];
    expires_at?: string;
    reason?: string;
}

/**
 * Response from bulk grant permissions
 */
export interface BulkGrantPermissionsResponse {
    message: string;
    data: Array<{
        user_id: number;
        user_name: string;
        granted: string[];
    }>;
    total_users: number;
    total_permissions: number;
}

/**
 * Request to copy permissions between users
 */
export interface CopyPermissionsRequest {
    include_temporary?: boolean;
    expires_at?: string;
}

/**
 * Response from copy permissions
 */
export interface CopyPermissionsResponse {
    message: string;
    data: {
        source_user: string;
        target_user: string;
        permissions_copied: string[];
        count: number;
    };
}

/**
 * Permission audit log entry
 */
export interface PermissionAuditEntry {
    permission: string;
    type: OverrideType;
    is_active: boolean;
    granted_by: string;
    reason?: string;
    expires_at?: string | null;
    created_at: string;
}

/**
 * Permission audit log response
 */
export interface PermissionAuditLogResponse {
    user_id: number;
    user_name: string;
    entries: PermissionAuditEntry[];
    total: number;
}

/**
 * Request to create store permission override
 */
export interface CreateStorePermissionOverrideRequest {
    permission_id: number;
    granted: boolean;
}
