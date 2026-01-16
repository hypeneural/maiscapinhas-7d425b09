/**
 * useUserScreens Hook
 *
 * React Query hook for fetching user's accessible screens.
 */

import { useQuery } from '@tanstack/react-query';
import { getUserScreens } from '@/services/auth.service';
import { authKeys } from './use-auth';

export const screenKeys = {
    all: ['screens'] as const,
    user: () => [...screenKeys.all, 'user'] as const,
};

/**
 * Hook to fetch user's accessible screens from /me/screens
 */
export function useUserScreens() {
    return useQuery({
        queryKey: screenKeys.user(),
        queryFn: getUserScreens,
        staleTime: 1000 * 60 * 5, // 5 minutes - screens don't change often
        gcTime: 1000 * 60 * 30, // 30 minutes cache
    });
}

/**
 * Hook to check if user can access a specific screen
 */
export function useCanAccessScreen(screenName: string) {
    const { data, isLoading } = useUserScreens();

    const hasAccess = data?.screens.some(s => s.name === screenName) ?? false;

    return { hasAccess, isLoading };
}
