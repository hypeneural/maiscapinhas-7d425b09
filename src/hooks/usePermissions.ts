/**
 * usePermissions Hook
 * 
 * Main hook for checking permissions and roles based on current store context.
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Role,
    Permission,
    StoreWithRole,
    ROLE_PERMISSIONS,
    ROLE_HIERARCHY,
} from '@/lib/permissions';

interface UsePermissionsReturn {
    // State
    stores: StoreWithRole[];
    currentStore: StoreWithRole | null;
    currentRole: Role | null;
    isLoading: boolean;

    // Super Admin
    isSuperAdmin: boolean;           // User is a Super Administrator
    canManageSuperAdmins: boolean;   // Can promote/demote super admins
    canAccessAllStores: boolean;     // Has implicit access to all stores

    // Permission checks
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
    hasAllPermissions: (permissions: Permission[]) => boolean;

    // Role checks
    hasRole: (role: Role) => boolean;
    hasMinRole: (minRole: Role) => boolean;
    hasAnyRole: (roles: Role[]) => boolean;

    // Shortcuts
    isAdmin: boolean;
    isGerente: boolean;
    isConferente: boolean;
    isVendedor: boolean;

    // Store management
    setCurrentStore: (storeId: number) => void;
    getHighestRole: () => Role | null;
}

export function usePermissions(): UsePermissionsReturn {
    const { user, isLoading, currentStoreId, setCurrentStoreId, isSuperAdmin } = useAuth();

    // Super admin checks
    const canManageSuperAdmins = isSuperAdmin;
    const canAccessAllStores = isSuperAdmin;

    // Transform stores to StoreWithRole type
    const stores = useMemo((): StoreWithRole[] => {
        if (!user?.stores) return [];
        return user.stores.map((s) => ({
            id: s.id,
            name: s.name,
            role: s.role as Role,
        }));
    }, [user]);

    // Current store
    const currentStore = useMemo((): StoreWithRole | null => {
        if (!stores.length) return null;
        if (currentStoreId) {
            const store = stores.find((s) => s.id === currentStoreId);
            if (store) return store;
        }
        // Default to first store
        return stores[0];
    }, [currentStoreId, stores]);

    // Current role from current store
    const currentRole = useMemo((): Role | null => {
        return currentStore?.role ?? null;
    }, [currentStore]);

    // Check single permission - Super admin has all permissions
    const hasPermission = useCallback(
        (permission: Permission): boolean => {
            if (isSuperAdmin) return true;
            if (!currentRole) return false;
            return ROLE_PERMISSIONS[currentRole].includes(permission);
        },
        [currentRole, isSuperAdmin]
    );

    // Check any permission
    const hasAnyPermission = useCallback(
        (permissions: Permission[]): boolean => {
            if (isSuperAdmin) return true;
            return permissions.some((p) => hasPermission(p));
        },
        [hasPermission, isSuperAdmin]
    );

    // Check all permissions
    const hasAllPermissions = useCallback(
        (permissions: Permission[]): boolean => {
            if (isSuperAdmin) return true;
            return permissions.every((p) => hasPermission(p));
        },
        [hasPermission, isSuperAdmin]
    );

    // Check exact role - Super admin counts as having all roles
    // For fabrica role, check has_fabrica_access since fabrica users have no stores
    const hasRole = useCallback(
        (role: Role): boolean => {
            if (isSuperAdmin) return true;
            // Special check for fabrica role using has_fabrica_access from /me
            if (role === 'fabrica') {
                return user?.has_fabrica_access ?? false;
            }
            return currentRole === role;
        },
        [currentRole, isSuperAdmin, user?.has_fabrica_access]
    );

    // Check minimum role (hierarchy) - Super admin is above all
    const hasMinRole = useCallback(
        (minRole: Role): boolean => {
            if (isSuperAdmin) return true;
            if (!currentRole) return false;
            return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[minRole];
        },
        [currentRole, isSuperAdmin]
    );

    // Check any of the roles
    const hasAnyRole = useCallback(
        (roles: Role[]): boolean => {
            if (isSuperAdmin) return true;
            if (!currentRole) return false;
            return roles.includes(currentRole);
        },
        [currentRole, isSuperAdmin]
    );

    // Shortcuts - Super admin counts for all
    const isAdmin = isSuperAdmin || currentRole === 'admin';
    const isGerente = isSuperAdmin || currentRole === 'gerente';
    const isConferente = isSuperAdmin || currentRole === 'conferente';
    const isVendedor = isSuperAdmin || currentRole === 'vendedor';

    // Get highest role across all stores
    const getHighestRole = useCallback((): Role | null => {
        if (isSuperAdmin) return 'admin'; // Super admin is treated as highest
        if (!stores.length) return null;
        return stores.reduce((highest, store) => {
            if (!highest) return store.role;
            return ROLE_HIERARCHY[store.role] > ROLE_HIERARCHY[highest]
                ? store.role
                : highest;
        }, null as Role | null);
    }, [stores, isSuperAdmin]);

    // Set current store
    const setCurrentStore = useCallback(
        (storeId: number) => {
            setCurrentStoreId(storeId);
        },
        [setCurrentStoreId]
    );

    return {
        stores,
        currentStore,
        currentRole,
        isLoading,
        // Super Admin
        isSuperAdmin,
        canManageSuperAdmins,
        canAccessAllStores,
        // Permissions
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasMinRole,
        hasAnyRole,
        isAdmin,
        isGerente,
        isConferente,
        isVendedor,
        setCurrentStore,
        getHighestRole,
    };
}

/**
 * Hook for requiring a specific minimum role
 */
export function useRequireRole(requiredRole: Role) {
    const { currentRole, hasMinRole, isLoading } = usePermissions();

    return {
        isAllowed: hasMinRole(requiredRole),
        isLoading,
        currentRole,
    };
}

/**
 * Hook for requiring a specific permission
 */
export function useRequirePermission(permission: Permission) {
    const { hasPermission, isLoading, currentRole } = usePermissions();

    return {
        isAllowed: hasPermission(permission),
        isLoading,
        currentRole,
    };
}
