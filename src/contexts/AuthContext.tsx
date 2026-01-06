import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { usuarios } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // Dev only
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Mock: Inicia com vendedor para demonstração
    return usuarios.find(u => u.role === 'vendedor') || null;
  });

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Mock login
    const foundUser = usuarios.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  // Dev only: permite trocar de role para testar
  const switchRole = useCallback((role: UserRole) => {
    const userWithRole = usuarios.find(u => u.role === role);
    if (userWithRole) {
      setUser(userWithRole);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        switchRole,
        isAuthenticated: !!user,
      }}
    >
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
