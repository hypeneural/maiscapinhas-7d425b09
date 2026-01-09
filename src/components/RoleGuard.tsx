/**
 * RoleGuard Component
 * 
 * Protects content based on roles, permissions, or minimum role hierarchy.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Role, Permission } from '@/lib/permissions';

interface RoleGuardProps {
  children: React.ReactNode;

  // Option 1: Check specific roles
  roles?: Role[];

  // Option 2: Check minimum role (hierarchy)
  minRole?: Role;

  // Option 3: Check permissions
  permissions?: Permission[];
  requireAll?: boolean; // default: false (any permission matches)

  // Fallbacks
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  minRole,
  permissions,
  requireAll = false,
  fallback,
  redirectTo,
}) => {
  const {
    hasRole,
    hasMinRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    isLoading,
  } = usePermissions();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check authorization
  let isAuthorized = true;

  // Check specific roles
  if (roles?.length) {
    isAuthorized = hasAnyRole(roles);
  }

  // Check minimum role
  if (minRole && isAuthorized) {
    isAuthorized = hasMinRole(minRole);
  }

  // Check permissions
  if (permissions?.length && isAuthorized) {
    isAuthorized = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  // Not authorized
  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>;
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return null;
  }

  return <>{children}</>;
};

// ============================================
// CONVENIENCE VARIANTS
// ============================================

interface GuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminOnly: React.FC<GuardProps> = ({ children, fallback }) => (
  <RoleGuard roles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const ManagerOnly: React.FC<GuardProps> = ({ children, fallback }) => (
  <RoleGuard minRole="gerente" fallback={fallback}>
    {children}
  </RoleGuard>
);

export const ConferenteOnly: React.FC<GuardProps> = ({ children, fallback }) => (
  <RoleGuard roles={['conferente', 'gerente', 'admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const CanApprove: React.FC<GuardProps> = ({ children, fallback }) => (
  <RoleGuard permissions={['closing:approve']} fallback={fallback}>
    {children}
  </RoleGuard>
);

/**
 * Hook to check if user has any of the specified roles
 */
export const useHasRole = (allowedRoles: Role[]): boolean => {
  const { hasAnyRole } = usePermissions();
  return hasAnyRole(allowedRoles);
};

/**
 * Hook to check if user has a specific permission
 */
export const useHasPermission = (permission: Permission): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};
