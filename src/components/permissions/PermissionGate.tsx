/**
 * PermissionGate Component
 * 
 * Conditionally renders children based on user permissions.
 * Uses the new permission system from AuthContext.
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGateProps {
    /** Single permission to check */
    permission?: string;
    /** Check if user has ANY of these permissions */
    anyOf?: string[];
    /** Check if user has ALL of these permissions */
    allOf?: string[];
    /** Content to render when permission is granted */
    children: React.ReactNode;
    /** Content to render when permission is denied (optional) */
    fallback?: React.ReactNode;
    /** If true, inverts the check (render when NOT having permission) */
    not?: boolean;
}

/**
 * PermissionGate - Conditionally renders content based on permissions
 * 
 * @example
 * // Single permission check
 * <PermissionGate permission="pedidos.delete">
 *   <DeleteButton />
 * </PermissionGate>
 * 
 * @example
 * // Any of multiple permissions
 * <PermissionGate anyOf={['pedidos.update', 'pedidos.delete']}>
 *   <ActionsMenu />
 * </PermissionGate>
 * 
 * @example
 * // All permissions required
 * <PermissionGate allOf={['admin.users.view', 'admin.users.update']}>
 *   <UserEditor />
 * </PermissionGate>
 * 
 * @example
 * // With fallback
 * <PermissionGate permission="reports.view" fallback={<UpgradePrompt />}>
 *   <ReportsSection />
 * </PermissionGate>
 * 
 * @example
 * // Inverted check (hide from admins)
 * <PermissionGate permission="admin" not>
 *   <NonAdminContent />
 * </PermissionGate>
 */
export function PermissionGate({
    permission,
    anyOf,
    allOf,
    children,
    fallback = null,
    not = false,
}: PermissionGateProps): React.ReactNode {
    const { can, canAny, canAll, isSuperAdmin } = useAuth();

    // Determine if access is granted
    let hasAccess = false;

    if (isSuperAdmin) {
        // Super admin always has access (unless inverted)
        hasAccess = true;
    } else if (permission) {
        hasAccess = can(permission);
    } else if (anyOf && anyOf.length > 0) {
        hasAccess = canAny(anyOf);
    } else if (allOf && allOf.length > 0) {
        hasAccess = canAll(allOf);
    } else {
        // No permission specified, default to allowed
        hasAccess = true;
    }

    // Apply inversion if needed
    const shouldRender = not ? !hasAccess : hasAccess;

    return shouldRender ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook version for programmatic use
 */
export function useHasPermission(permission: string): boolean {
    const { can } = useAuth();
    return can(permission);
}

export function useHasAnyPermission(permissions: string[]): boolean {
    const { canAny } = useAuth();
    return canAny(permissions);
}

export function useHasAllPermissions(permissions: string[]): boolean {
    const { canAll } = useAuth();
    return canAll(permissions);
}

export default PermissionGate;
