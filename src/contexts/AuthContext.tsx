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
import type { UserWithStores, UserRole } from '@/types/api';

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
  const { data: user, isLoading: isLoadingUser, isError } = useCurrentUser();
  const logoutMutation = useLogout();

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

  // Loading is true until initialized AND user query completes
  const isLoading = !isInitialized || isLoadingUser;

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !isError,
    isSuperAdmin: user?.is_super_admin === true,
    logout: handleLogout,
    hasRole: checkHasRole,
    hasAccessToStore: checkHasAccessToStore,
    highestRole: getHighestRole(user) as UserRole | null,
    currentStoreId,
    setCurrentStoreId: handleSetCurrentStoreId,
  }), [user, isLoading, isError, handleLogout, checkHasRole, checkHasAccessToStore, currentStoreId, handleSetCurrentStoreId]);

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
