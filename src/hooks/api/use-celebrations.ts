/**
 * Celebrations Hooks
 * 
 * React Query hooks for celebrations API.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
    getCelebrations,
    getCelebrationsMonth,
    getCelebrationsUpcoming,
    getCelebrationsToday,
} from '@/services/celebrations.service';
import type {
    CelebrationsParams,
    CelebrationsMonthParams,
    CelebrationsUpcomingParams,
} from '@/types/celebrations.types';

// ============================================================
// Query Keys
// ============================================================

export const celebrationsKeys = {
    all: ['celebrations'] as const,
    list: (params: CelebrationsParams) =>
        [...celebrationsKeys.all, 'list', params] as const,
    month: (params: CelebrationsMonthParams) =>
        [...celebrationsKeys.all, 'month', params] as const,
    upcoming: (params: CelebrationsUpcomingParams) =>
        [...celebrationsKeys.all, 'upcoming', params] as const,
    today: () => [...celebrationsKeys.all, 'today'] as const,
};

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to get celebrations list with filters
 */
export function useCelebrations(params: CelebrationsParams = {}) {
    return useQuery({
        queryKey: celebrationsKeys.list(params),
        queryFn: () => getCelebrations(params),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to get celebrations for a specific month
 */
export function useCelebrationsMonth(params: CelebrationsMonthParams = {}) {
    return useQuery({
        queryKey: celebrationsKeys.month(params),
        queryFn: () => getCelebrationsMonth(params),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

/**
 * Hook to get upcoming celebrations for widget
 */
export function useCelebrationsUpcoming(
    limit: number = 5,
    days: number = 7,
    storeId?: number
) {
    const params: CelebrationsUpcomingParams = { limit, days };
    if (storeId) params.store_id = storeId;

    return useQuery({
        queryKey: celebrationsKeys.upcoming(params),
        queryFn: () => getCelebrationsUpcoming(params),
        staleTime: 1000 * 60 * 15, // 15 minutes - doesn't change often
    });
}

/**
 * Hook to get today's celebrations with messages
 */
export function useCelebrationsToday() {
    return useQuery({
        queryKey: celebrationsKeys.today(),
        queryFn: getCelebrationsToday,
        staleTime: 1000 * 60 * 30, // 30 minutes - only changes once per day
        refetchOnWindowFocus: false, // No need to refetch on focus
    });
}
