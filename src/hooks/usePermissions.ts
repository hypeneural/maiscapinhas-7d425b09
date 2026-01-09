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
    const { user, isLoading, currentStoreId, setCurrentStoreId } = useAuth();

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

    // Check single permission
    const hasPermission = useCallback(
        (permission: Permission): boolean => {
            if (!currentRole) return false;
            return ROLE_PERMISSIONS[currentRole].includes(permission);
        },
        [currentRole]
    );

    // Check any permission
    const hasAnyPermission = useCallback(
        (permissions: Permission[]): boolean => {
            return permissions.some((p) => hasPermission(p));
        },
        [hasPermission]
    );

    // Check all permissions
    const hasAllPermissions = useCallback(
        (permissions: Permission[]): boolean => {
            return permissions.every((p) => hasPermission(p));
        },
        [hasPermission]
    );

    // Check exact role
    const hasRole = useCallback(
        (role: Role): boolean => {
            return currentRole === role;
        },
        [currentRole]
    );

    // Check minimum role (hierarchy)
    const hasMinRole = useCallback(
        (minRole: Role): boolean => {
            if (!currentRole) return false;
            return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[minRole];
        },
        [currentRole]
    );

    // Check any of the roles
    const hasAnyRole = useCallback(
        (roles: Role[]): boolean => {
            if (!currentRole) return false;
            return roles.includes(currentRole);
        },
        [currentRole]
    );

    // Shortcuts
    const isAdmin = currentRole === 'admin';
    const isGerente = currentRole === 'gerente';
    const isConferente = currentRole === 'conferente';
    const isVendedor = currentRole === 'vendedor';

    // Get highest role across all stores
    const getHighestRole = useCallback((): Role | null => {
        if (!stores.length) return null;
        return stores.reduce((highest, store) => {
            if (!highest) return store.role;
            return ROLE_HIERARCHY[store.role] > ROLE_HIERARCHY[highest]
                ? store.role
                : highest;
        }, null as Role | null);
    }, [stores]);

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
