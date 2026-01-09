/**
 * Dashboard Hooks
 * 
 * React Query hooks for dashboard data with optimized cache strategies per role.
 * 
 * Cache Strategy (as recommended by backend):
 * - Vendedor: staleTime 1min, polling 2min (needs near real-time updates)
 * - Conferente: staleTime 2min, polling 3min (moderate updates)
 * - Admin/Gerente: staleTime 5min, manual refresh (stable data)
 * - Reports: staleTime 30min (historical data)
 */

import { useQuery } from '@tanstack/react-query';
import {
    getSellerDashboard,
    getConferenteDashboard,
    getAdminDashboard,
    getRanking,
    getStorePerformance,
    getCashIntegrity,
    getConsolidatedReport,
    getPendingShifts,
    getDivergentShifts,
} from '@/services/dashboard.service';
import type {
    VendedorDashboardParams,
    ConferenteDashboardParams,
    AdminDashboardParams,
    RankingParams,
    StorePerformanceParams,
    CashIntegrityParams,
} from '@/types/dashboard.types';

// ============================================================
// Query Keys
// ============================================================

export const dashboardKeys = {
    all: ['dashboard'] as const,

    // Vendedor
    vendedor: (params: VendedorDashboardParams) =>
        [...dashboardKeys.all, 'vendedor', params] as const,

    // Conferente
    conferente: (params: ConferenteDashboardParams) =>
        [...dashboardKeys.all, 'conferente', params] as const,
    pendingShifts: (storeId: number) =>
        [...dashboardKeys.all, 'pending-shifts', storeId] as const,
    divergentShifts: (storeId: number, month?: string) =>
        [...dashboardKeys.all, 'divergent-shifts', storeId, month] as const,
    cashIntegrity: (params: CashIntegrityParams) =>
        [...dashboardKeys.all, 'cash-integrity', params] as const,

    // Admin/Gerente
    admin: (params?: AdminDashboardParams) =>
        [...dashboardKeys.all, 'admin', params] as const,
    ranking: (params?: RankingParams) =>
        [...dashboardKeys.all, 'ranking', params] as const,
    storePerformance: (params: StorePerformanceParams) =>
        [...dashboardKeys.all, 'store-performance', params] as const,
    consolidated: (month?: string) =>
        [...dashboardKeys.all, 'consolidated', month] as const,
};

// ============================================================
// Cache Strategies
// ============================================================

const CACHE_STRATEGIES = {
    vendedor: {
        staleTime: 1000 * 60,       // 1 min
        refetchInterval: 1000 * 60 * 2,  // Polling 2 min
    },
    conferente: {
        staleTime: 1000 * 60 * 2,   // 2 min
        refetchInterval: 1000 * 60 * 3,  // Polling 3 min
    },
    admin: {
        staleTime: 1000 * 60 * 5,   // 5 min
        refetchInterval: false as const,  // Manual refresh
    },
    reports: {
        staleTime: 1000 * 60 * 30,  // 30 min
        gcTime: 1000 * 60 * 60,     // 1 hour
    },
};

// ============================================================
// Vendedor Hooks
// ============================================================

/**
 * Hook to get seller's personal dashboard
 * Uses frequent polling for near real-time updates
 */
export function useSellerDashboard(params: VendedorDashboardParams) {
    return useQuery({
        queryKey: dashboardKeys.vendedor(params),
        queryFn: () => getSellerDashboard(params),
        enabled: !!params.store_id,
        ...CACHE_STRATEGIES.vendedor,
    });
}

// ============================================================
// Conferente Hooks
// ============================================================

/**
 * Hook to get conferente dashboard
 */
export function useConferenteDashboard(params: ConferenteDashboardParams) {
    return useQuery({
        queryKey: dashboardKeys.conferente(params),
        queryFn: () => getConferenteDashboard(params),
        enabled: !!params.store_id,
        ...CACHE_STRATEGIES.conferente,
    });
}

/**
 * Hook to get pending shifts for review
 */
export function usePendingShifts(storeId: number) {
    return useQuery({
        queryKey: dashboardKeys.pendingShifts(storeId),
        queryFn: () => getPendingShifts(storeId),
        enabled: !!storeId,
        ...CACHE_STRATEGIES.conferente,
    });
}

/**
 * Hook to get divergent shifts
 */
export function useDivergentShifts(storeId: number, month?: string) {
    return useQuery({
        queryKey: dashboardKeys.divergentShifts(storeId, month),
        queryFn: () => getDivergentShifts(storeId, month),
        enabled: !!storeId,
        ...CACHE_STRATEGIES.conferente,
    });
}

/**
 * Hook to get cash integrity report
 */
export function useCashIntegrity(params: CashIntegrityParams) {
    return useQuery({
        queryKey: dashboardKeys.cashIntegrity(params),
        queryFn: () => getCashIntegrity(params),
        enabled: !!params.store_id,
        ...CACHE_STRATEGIES.reports,
    });
}

// ============================================================
// Admin/Gerente Hooks
// ============================================================

/**
 * Hook to get admin consolidated dashboard
 */
export function useAdminDashboard(params?: AdminDashboardParams) {
    return useQuery({
        queryKey: dashboardKeys.admin(params),
        queryFn: () => getAdminDashboard(params),
        ...CACHE_STRATEGIES.admin,
    });
}

/**
 * Hook to get ranking of sellers
 */
export function useRanking(params?: RankingParams) {
    return useQuery({
        queryKey: dashboardKeys.ranking(params),
        queryFn: () => getRanking(params),
        ...CACHE_STRATEGIES.admin,
    });
}

/**
 * Hook to get store performance with forecast
 */
export function useStorePerformance(params: StorePerformanceParams) {
    return useQuery({
        queryKey: dashboardKeys.storePerformance(params),
        queryFn: () => getStorePerformance(params),
        enabled: !!params.store_id,
        ...CACHE_STRATEGIES.reports,
    });
}

/**
 * Hook to get consolidated multi-store report
 */
export function useConsolidatedReport(month?: string) {
    return useQuery({
        queryKey: dashboardKeys.consolidated(month),
        queryFn: () => getConsolidatedReport(month),
        ...CACHE_STRATEGIES.reports,
    });
}

// ============================================================
// Legacy exports for backward compatibility
// ============================================================

/** @deprecated Use useSellerDashboard instead */
export function useDashboardVendedor(storeId?: number, date?: string) {
    return useSellerDashboard({ store_id: storeId || 0, date });
}

/** @deprecated Use useConferenteDashboard instead */
export function useDashboardConferente(storeId?: number, date?: string) {
    return useConferenteDashboard({ store_id: storeId || 0, date });
}

/** @deprecated Use useAdminDashboard instead */
export function useDashboardAdmin(month?: string) {
    return useAdminDashboard({ month });
}
