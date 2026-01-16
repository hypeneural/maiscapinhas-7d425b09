/**
 * useFilteredMenu Hook
 * 
 * Returns the menu filtered based on user's current role and permissions.
 * 
 * MIGRATION NOTE (2026-01):
 * - Now uses `can()` from AuthContext (permissions[] from /me API)
 * - Falls back to role checks for sections that don't specify permissions
 * - This ensures new permission overrides and module permissions work correctly
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from './usePermissions';
import { menuSections, filterMenuSections, type MenuSection } from '@/lib/config/menuConfig';

interface UseFilteredMenuReturn {
    menu: MenuSection[];
    isLoading: boolean;
}

export function useFilteredMenu(): UseFilteredMenuReturn {
    const { can, isSuperAdmin, isLoading: authLoading } = useAuth();
    const { hasRole, hasMinRole, isLoading: permissionsLoading } = usePermissions();

    const isLoading = authLoading || permissionsLoading;

    // Create a permission checker that uses both systems:
    // 1. First checks API permissions via can() (new system)
    // 2. For legacy ROLE_PERMISSIONS, we map them to equivalent API permission strings
    const hasPermission = useMemo(() => {
        return (permission: string): boolean => {
            // Super admin bypasses all checks
            if (isSuperAdmin) return true;

            // Check if user has this permission in the API response
            return can(permission);
        };
    }, [can, isSuperAdmin]);

    const menu = useMemo(() => {
        if (isLoading) return [];
        return filterMenuSections(menuSections, hasPermission, hasRole, hasMinRole, isSuperAdmin);
    }, [hasPermission, hasRole, hasMinRole, isLoading, isSuperAdmin]);

    return { menu, isLoading };
}

