/**
 * Authentication Context
 * 
 * Provides authentication state and utilities throughout the app.
 * Refactored to use real API via React Query hooks.
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useCurrentUser, useLogout, hasRole, hasAccessToStore, getHighestRole } from '@/hooks/api/use-auth';
import type { User, UserRole } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAccessToStore: (storeId: number) => boolean;
  highestRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: user, isLoading, isError } = useCurrentUser();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const checkHasRole = useCallback((role: UserRole): boolean => {
    return hasRole(user, role);
  }, [user]);

  const checkHasAccessToStore = useCallback((storeId: number): boolean => {
    return hasAccessToStore(user, storeId);
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !isError,
    logout: handleLogout,
    hasRole: checkHasRole,
    hasAccessToStore: checkHasAccessToStore,
    highestRole: getHighestRole(user) as UserRole | null,
  }), [user, isLoading, isError, handleLogout, checkHasRole, checkHasAccessToStore]);

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
