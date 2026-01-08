/**
 * Reports Hooks
 * 
 * React Query hooks for ranking and reports.
 */

import { useQuery } from '@tanstack/react-query';
import {
    getRanking,
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
    storePerformance: (storeId?: number, month?: string) =>
        [...reportsKeys.all, 'store-performance', storeId, month] as const,
    cashIntegrity: (storeId?: number, month?: string) =>
        [...reportsKeys.all, 'cash-integrity', storeId, month] as const,
    birthdays: (month?: number, storeId?: number) =>
        [...reportsKeys.all, 'birthdays', month, storeId] as const,
};

/**
 * Hook to get seller ranking
 */
export function useRanking(filters: RankingFilters = {}) {
    return useQuery({
        queryKey: reportsKeys.ranking(filters),
        queryFn: () => getRanking(filters),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get store performance report
 */
export function useStorePerformance(storeId?: number, month?: string) {
    return useQuery({
        queryKey: reportsKeys.storePerformance(storeId, month),
        queryFn: () => getStorePerformance(storeId, month),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get cash integrity report
 */
export function useCashIntegrity(storeId?: number, month?: string) {
    return useQuery({
        queryKey: reportsKeys.cashIntegrity(storeId, month),
        queryFn: () => getCashIntegrity(storeId, month),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get birthdays
 */
export function useBirthdays(month?: number, storeId?: number) {
    return useQuery({
        queryKey: reportsKeys.birthdays(month, storeId),
        queryFn: () => getBirthdays(month, storeId),
        staleTime: 1000 * 60 * 30, // Birthdays don't change often
    });
}
