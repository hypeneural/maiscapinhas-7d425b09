/**
 * Authentication Hooks
 * 
 * React Query hooks for authentication operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    login,
    logout,
    logoutAll,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    changePassword
} from '@/services/auth.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type { User } from '@/types/api';

/**
 * Query key factory for auth queries
 */
export const authKeys = {
    all: ['auth'] as const,
    user: () => [...authKeys.all, 'user'] as const,
};

/**
 * Hook to get current authenticated user
 */
export function useCurrentUser() {
    return useQuery({
        queryKey: authKeys.user(),
        queryFn: getCurrentUser,
        staleTime: 1000 * 60 * 10, // 10 minutes
        retry: false, // Don't retry on auth failure
    });
}

/**
 * Hook to perform login
 */
export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credentials: { email: string; password: string }) => login(credentials),
        onSuccess: (user) => {
            queryClient.setQueryData(authKeys.user(), user);
            toast.success(`Bem-vindo, ${user.name.split(' ')[0]}!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to perform logout
 */
export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.clear();
            toast.success('Logout realizado com sucesso');
        },
        onError: () => {
            // Still clear client-side state even if API fails
            queryClient.clear();
        },
    });
}

/**
 * Hook to logout all sessions
 */
export function useLogoutAll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logoutAll,
        onSuccess: () => {
            queryClient.clear();
            toast.success('Todas as sessões foram encerradas');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to request password reset
 */
export function useForgotPassword() {
    return useMutation({
        mutationFn: forgotPassword,
        onSuccess: () => {
            toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to reset password with token
 */
export function useResetPassword() {
    return useMutation({
        mutationFn: resetPassword,
        onSuccess: () => {
            toast.success('Senha alterada com sucesso! Faça login com a nova senha.');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to change current password
 */
export function useChangePassword() {
    return useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            toast.success('Senha alterada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Check if user has a specific role in any store
 */
export function hasRole(user: User | null | undefined, role: string): boolean {
    return user?.stores.some((s) => s.role === role) ?? false;
}

/**
 * Check if user has access to a specific store
 */
export function hasAccessToStore(user: User | null | undefined, storeId: number): boolean {
    return user?.stores.some((s) => s.id === storeId) ?? false;
}

/**
 * Get highest role for a user
 */
export function getHighestRole(user: User | null | undefined): string | null {
    if (!user) return null;

    const roleHierarchy = ['admin', 'gerente', 'conferente', 'vendedor'];

    for (const role of roleHierarchy) {
        if (user.stores.some(s => s.role === role)) {
            return role;
        }
    }

    return null;
}
