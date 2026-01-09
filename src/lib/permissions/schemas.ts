/**
 * Permission Schemas & Types
 * 
 * Zod schemas and TypeScript types for role-based access control.
 */

import { z } from 'zod';

// ============================================
// ROLES
// ============================================

export const roleSchema = z.enum(['admin', 'gerente', 'conferente', 'vendedor']);
export type Role = z.infer<typeof roleSchema>;

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
    admin: 4,
    gerente: 3,
    conferente: 2,
    vendedor: 1,
};

// ============================================
// PERMISSIONS
// ============================================

/**
 * All granular permissions in the system
 */
export type Permission =
    // Dashboard
    | 'dashboard:view'
    // Sales
    | 'sales:create'
    | 'sales:view'
    | 'sales:edit'
    | 'sales:delete'
    // Bonus
    | 'bonus:view_own'
    | 'bonus:view_all'
    // Commission
    | 'commission:view_own'
    | 'commission:view_all'
    // Shifts & Closings
    | 'shift:create'
    | 'shift:view'
    | 'closing:submit'
    | 'closing:approve'
    | 'closing:reject'
    | 'divergence:view'
    // Goals & Rules
    | 'goals:view'
    | 'goals:manage'
    | 'rules:view'
    | 'rules:manage'
    // Reports
    | 'ranking:view'
    | 'reports:store_performance'
    | 'reports:cash_integrity'
    | 'reports:consolidated'
    // Admin
    | 'users:view'
    | 'users:manage'
    | 'stores:view'
    | 'stores:manage'
    | 'audit:view';

/**
 * Permission map by role
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    admin: [
        'dashboard:view',
        'sales:view',
        'sales:edit',
        'sales:delete',
        'bonus:view_all',
        'commission:view_all',
        'shift:view',
        'closing:approve',
        'closing:reject',
        'divergence:view',
        'goals:view',
        'goals:manage',
        'rules:view',
        'rules:manage',
        'ranking:view',
        'reports:store_performance',
        'reports:cash_integrity',
        'reports:consolidated',
        'users:view',
        'users:manage',
        'stores:view',
        'stores:manage',
        'audit:view',
    ],
    gerente: [
        'dashboard:view',
        'sales:view',
        'sales:edit',
        'bonus:view_all',
        'commission:view_all',
        'shift:view',
        'closing:approve',
        'closing:reject',
        'divergence:view',
        'goals:view',
        'goals:manage',
        'rules:view',
        'rules:manage',
        'ranking:view',
        'reports:store_performance',
        'reports:cash_integrity',
    ],
    conferente: [
        'dashboard:view',
        'shift:create',
        'shift:view',
        'closing:submit',
        'closing:approve',
        'closing:reject',
        'divergence:view',
        'reports:cash_integrity',
    ],
    vendedor: [
        'dashboard:view',
        'sales:create',
        'sales:view',
        'bonus:view_own',
        'commission:view_own',
        'shift:create',
        'closing:submit',
    ],
};

// ============================================
// STORE WITH ROLE
// ============================================

export const storeWithRoleSchema = z.object({
    id: z.number(),
    name: z.string(),
    role: roleSchema,
});

export type StoreWithRole = z.infer<typeof storeWithRoleSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if role1 is higher or equal to role2 in hierarchy
 */
export function isRoleAtLeast(role: Role, minRole: Role): boolean {
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

/**
 * Get highest role from a list of store roles
 */
export function getHighestRoleFromStores(stores: StoreWithRole[]): Role | null {
    if (!stores.length) return null;

    return stores.reduce((highest, store) => {
        if (!highest) return store.role;
        return ROLE_HIERARCHY[store.role] > ROLE_HIERARCHY[highest]
            ? store.role
            : highest;
    }, null as Role | null);
}
