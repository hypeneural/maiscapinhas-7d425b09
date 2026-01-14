/**
 * Authentication Hooks
 * 
 * React Query hooks for authentication operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    login,
    logout,
    logoutAll,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    changePassword,
    forgotPasswordWhatsApp,
    resetPasswordWithCode,
    type ForgotPasswordWhatsAppResponse,
} from '@/services/auth.service';
import { handleApiError, ApiError, isApiError, getToken } from '@/lib/api';
import {
    checkLoginRateLimit,
    recordLoginAttempt,
    clearLoginAttempts,
    getRateLimitRemainingTime
} from '@/lib/utils/rateLimiter';
import { toast } from 'sonner';
import type { UserWithStores } from '@/types/api';

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
    // Only fetch if there's a token
    const hasToken = !!getToken();

    return useQuery({
        queryKey: authKeys.user(),
        queryFn: getCurrentUser,
        enabled: hasToken, // Don't call /me without a token
        staleTime: 1000 * 60 * 10, // 10 minutes
        retry: (failureCount, error) => {
            // Never retry on 401 (not authorized)
            if (isApiError(error) && error.status === 401) {
                return false;
            }
            // Also don't retry on 403 (forbidden)
            if (isApiError(error) && error.status === 403) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

/**
 * Hook to perform login
 */
export function useLogin() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async (credentials: { email: string; password: string }) => {
            // Check rate limit before attempting login
            if (!checkLoginRateLimit(credentials.email)) {
                const remainingTime = getRateLimitRemainingTime(credentials.email);
                const minutes = Math.ceil(remainingTime / 60);
                throw new Error(
                    `Muitas tentativas de login. Aguarde ${minutes} minuto(s) e tente novamente.`
                );
            }

            // Record the attempt
            recordLoginAttempt(credentials.email);

            try {
                const user = await login(credentials);
                // Clear rate limit on success
                clearLoginAttempts(credentials.email);
                return user;
            } catch (error) {
                // Rethrow to let the mutation handle it
                throw error;
            }
        },
        onSuccess: (user) => {
            // Don't set partial user data in cache - invalidate to force fetch from /me
            queryClient.invalidateQueries({ queryKey: authKeys.user() });
            toast.success(`Bem-vindo, ${user.name.split(' ')[0]}!`);
            navigate('/', { replace: true });
        },
        onError: (error) => {
            if (error instanceof Error && !isApiError(error)) {
                // Rate limit error
                toast.error(error.message);
            } else {
                handleApiError(error);
            }
        },
    });
}

/**
 * Hook to perform logout
 */
export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            queryClient.clear();
            navigate('/login', { replace: true });
            toast.success('Logout realizado com sucesso');
        },
        onError: () => {
            // Still clear client-side state even if API fails
            queryClient.clear();
            navigate('/login', { replace: true });
        },
    });
}

/**
 * Hook to logout all sessions
 */
export function useLogoutAll() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: logoutAll,
        onSuccess: () => {
            queryClient.clear();
            navigate('/login', { replace: true });
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
 * Hook to request password reset via WhatsApp
 * Sends a 6-digit code to the user's registered WhatsApp number
 */
export function useForgotPasswordWhatsApp() {
    return useMutation({
        mutationFn: forgotPasswordWhatsApp,
        onSuccess: (data: ForgotPasswordWhatsAppResponse) => {
            toast.success(`Código enviado para o WhatsApp ${data.phone_masked}!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to reset password using a 6-digit code
 */
export function useResetPasswordWithCode() {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: resetPasswordWithCode,
        onSuccess: () => {
            toast.success('Senha alterada com sucesso! Faça login com a nova senha.');
            navigate('/login', { replace: true });
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Check if user has a specific role in any store
 * Super admins and global admins implicitly have access to admin-level features
 * Uses has_fabrica_access from /me endpoint for fabrica role
 */
export function hasRole(user: UserWithStores | null | undefined, role: string): boolean {
    if (!user) return false;

    // Super admin has all roles
    if (user.is_super_admin) return true;

    // Check for fabrica role using the new has_fabrica_access field
    if (role === 'fabrica') {
        return user.has_fabrica_access ?? false;
    }

    // Check for admin role using is_global_admin
    if (role === 'admin') {
        return user.is_global_admin ?? false;
    }

    // For other roles, check stores
    if (!user.stores) return false;
    return user.stores.some((s) => s.role === role);
}

/**
 * Check if user has access to a specific store
 * Super admins have access to all stores
 */
export function hasAccessToStore(user: UserWithStores | null | undefined, storeId: number): boolean {
    if (!user) return false;
    // Super admin has access to all stores
    if (user.is_super_admin) return true;
    if (!user.stores) return false;
    return user.stores.some((s) => s.id === storeId);
}

/**
 * Get highest role for a user
 */
export function getHighestRole(user: UserWithStores | null | undefined): string | null {
    if (!user || !user.stores || user.stores.length === 0) return null;

    const roleHierarchy = ['admin', 'gerente', 'conferente', 'vendedor'];

    for (const role of roleHierarchy) {
        if (user.stores.some(s => s.role === role)) {
            return role;
        }
    }

    return null;
}
