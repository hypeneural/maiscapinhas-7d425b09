/**
 * Authentication Context
 * 
 * Provides authentication state and utilities throughout the app.
 * Uses React Query for data fetching and token management for persistence.
 */

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useLogout, hasRole, hasAccessToStore, getHighestRole, authKeys } from '@/hooks/api/use-auth';
import { initializeToken, setOnUnauthorized, clearToken } from '@/lib/api';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import type { UserWithStores, UserRole, TemporaryPermission, ExpiringPermission } from '@/types/api';

interface AuthContextType {
  user: UserWithStores | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;  // Super Administrator flag - has access to everything
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAccessToStore: (storeId: number) => boolean;
  highestRole: UserRole | null;
  currentStoreId: number | null;
  setCurrentStoreId: (id: number) => void;

  // New permission system
  /** All permissions from /me (abilities + screens + features) */
  permissions: string[];
  /** Temporary permissions with expiration info */
  temporaryPermissions: TemporaryPermission[];
  /** Permissions expiring soon (< 7 days) */
  expiringSoon: ExpiringPermission[];
  /** Check if user has a specific permission */
  can: (permission: string) => boolean;
  /** Check if user has any of the given permissions */
  canAny: (permissions: string[]) => boolean;
  /** Check if user has all of the given permissions */
  canAll: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(() => {
    // Restore from sessionStorage
    const saved = sessionStorage.getItem('currentStoreId');
    return saved ? parseInt(saved, 10) : null;
  });
  const { data: userData, isLoading: isLoadingUser, isError } = useCurrentUser();
  const logoutMutation = useLogout();

  // Extract user and permissions from the response
  // The response may have { user, stores, permissions, ... } format
  const user = userData ?? null;
  const permissions = useMemo(() => {
    // Get permissions from response
    return (userData as { permissions?: string[] })?.permissions ?? [];
  }, [userData]);

  const temporaryPermissions = useMemo(() => {
    return (userData as { temporary_permissions?: TemporaryPermission[] })?.temporary_permissions ?? [];
  }, [userData]);

  const expiringSoon = useMemo(() => {
    return (userData as { expiring_soon?: ExpiringPermission[] })?.expiring_soon ?? [];
  }, [userData]);

  // Auto-select first store when user loads and no store is selected
  useEffect(() => {
    if (user?.stores?.length && !currentStoreId) {
      const firstStoreId = user.stores[0].id;
      setCurrentStoreId(firstStoreId);
      sessionStorage.setItem('currentStoreId', String(firstStoreId));
    }
  }, [user, currentStoreId]);

  // Persist store selection
  const handleSetCurrentStoreId = useCallback((id: number) => {
    setCurrentStoreId(id);
    sessionStorage.setItem('currentStoreId', String(id));
  }, []);

  // Initialize token and set up unauthorized handler on mount
  useEffect(() => {
    // Restore token from sessionStorage
    initializeToken();

    // Set up handler for 401 errors
    setOnUnauthorized(() => {
      // Clear React Query cache
      queryClient.setQueryData(authKeys.user(), null);
      queryClient.clear();
      // Redirect to login
      window.location.href = '/login';
    });

    setIsInitialized(true);
  }, [queryClient]);

  // Session timeout (only when authenticated)
  useSessionTimeout({
    enabled: !!user && isInitialized,
  });

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const checkHasRole = useCallback((role: UserRole): boolean => {
    return hasRole(user, role);
  }, [user]);

  const checkHasAccessToStore = useCallback((storeId: number): boolean => {
    return hasAccessToStore(user, storeId);
  }, [user]);

  // Permission checking methods
  const isSuperAdmin = user?.is_super_admin === true;

  const can = useCallback((permission: string): boolean => {
    // Super admin bypasses all permission checks
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  }, [isSuperAdmin, permissions]);

  const canAny = useCallback((perms: string[]): boolean => {
    if (isSuperAdmin) return true;
    return perms.some(p => permissions.includes(p));
  }, [isSuperAdmin, permissions]);

  const canAll = useCallback((perms: string[]): boolean => {
    if (isSuperAdmin) return true;
    return perms.every(p => permissions.includes(p));
  }, [isSuperAdmin, permissions]);

  // Loading is true until initialized AND user query completes
  const isLoading = !isInitialized || isLoadingUser;

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !isError,
    isSuperAdmin,
    logout: handleLogout,
    hasRole: checkHasRole,
    hasAccessToStore: checkHasAccessToStore,
    highestRole: getHighestRole(user) as UserRole | null,
    currentStoreId,
    setCurrentStoreId: handleSetCurrentStoreId,
    // New permission system
    permissions,
    temporaryPermissions,
    expiringSoon,
    can,
    canAny,
    canAll,
  }), [
    user, isLoading, isError, isSuperAdmin, handleLogout,
    checkHasRole, checkHasAccessToStore, currentStoreId, handleSetCurrentStoreId,
    permissions, temporaryPermissions, expiringSoon, can, canAny, canAll
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
