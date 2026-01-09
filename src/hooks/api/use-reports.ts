/**
 * Reports Hooks
 * 
 * React Query hooks for ranking, store performance, and cash integrity reports.
 */

import { useQuery } from '@tanstack/react-query';
import {
    getRanking,
    getConsolidatedPerformance,
    getStorePerformance,
    getCashIntegrity,
    getBirthdays
} from '@/services/reports.service';
import type { RankingFilters } from '@/types/api';

/**
 * Query key factory for reports queries
 */
export const reportsKeys = {
    all: ['reports'] as const,
    ranking: (filters?: RankingFilters) => [...reportsKeys.all, 'ranking', filters] as const,
    consolidated: (month?: string) => [...reportsKeys.all, 'consolidated', month] as const,
    storePerformance: (storeId: number, month?: string) =>
        [...reportsKeys.all, 'store-performance', storeId, month] as const,
    cashIntegrity: (storeId: number, month?: string) =>
        [...reportsKeys.all, 'cash-integrity', storeId, month] as const,
    birthdays: (month?: number, storeId?: number) =>
        [...reportsKeys.all, 'birthdays', month, storeId] as const,
};

/**
 * Hook to get seller ranking
 * @param filters - Optional filters: month (YYYY-MM), store_id, limit
 */
export function useRanking(filters: RankingFilters = {}) {
    return useQuery({
        queryKey: reportsKeys.ranking(filters),
        queryFn: () => getRanking(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to get consolidated performance for all stores
 * Used by /gestao/lojas page
 * @param month - Optional month in YYYY-MM format
 */
export function useConsolidatedPerformance(month?: string) {
    return useQuery({
        queryKey: reportsKeys.consolidated(month),
        queryFn: () => getConsolidatedPerformance(month),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get store performance report
 * @param storeId - Required store ID
 * @param month - Optional month in YYYY-MM format
 */
export function useStorePerformance(storeId: number, month?: string) {
    return useQuery({
        queryKey: reportsKeys.storePerformance(storeId, month),
        queryFn: () => getStorePerformance(storeId, month),
        enabled: !!storeId,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get cash integrity report
 * Used by /gestao/quebra page
 * @param storeId - Required store ID
 * @param month - Optional month in YYYY-MM format
 */
export function useCashIntegrity(storeId: number, month?: string) {
    return useQuery({
        queryKey: reportsKeys.cashIntegrity(storeId, month),
        queryFn: () => getCashIntegrity(storeId, month),
        enabled: !!storeId,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get birthdays
 * @param month - Optional month number (1-12)
 * @param storeId - Optional store ID to filter
 */
export function useBirthdays(month?: number, storeId?: number) {
    return useQuery({
        queryKey: reportsKeys.birthdays(month, storeId),
        queryFn: () => getBirthdays(month, storeId),
        staleTime: 1000 * 60 * 30, // Birthdays don't change often
    });
}
