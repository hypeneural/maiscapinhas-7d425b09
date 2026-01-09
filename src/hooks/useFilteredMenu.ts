/**
 * useFilteredMenu Hook
 * 
 * Returns the menu filtered based on user's current role and permissions.
 */

import { useMemo } from 'react';
import { usePermissions } from './usePermissions';
import { menuSections, filterMenuSections, type MenuSection } from '@/lib/config/menuConfig';

interface UseFilteredMenuReturn {
    menu: MenuSection[];
    isLoading: boolean;
}

export function useFilteredMenu(): UseFilteredMenuReturn {
    const { hasPermission, hasRole, hasMinRole, isLoading } = usePermissions();

    const menu = useMemo(() => {
        if (isLoading) return [];
        return filterMenuSections(menuSections, hasPermission, hasRole, hasMinRole);
    }, [hasPermission, hasRole, hasMinRole, isLoading]);

    return { menu, isLoading };
}
