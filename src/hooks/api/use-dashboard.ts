/**
 * Dashboard Hooks
 * 
 * React Query hooks for dashboard data.
 */

import { useQuery } from '@tanstack/react-query';
import {
    getSellerDashboard,
    getStoreDashboard,
    getAdminDashboard
} from '@/services/dashboard.service';

/**
 * Query key factory for dashboard queries
 */
export const dashboardKeys = {
    all: ['dashboard'] as const,
    seller: (storeId?: number) => [...dashboardKeys.all, 'seller', storeId] as const,
    store: (storeId?: number) => [...dashboardKeys.all, 'store', storeId] as const,
    admin: () => [...dashboardKeys.all, 'admin'] as const,
};

/**
 * Hook to get seller's personal dashboard
 */
export function useSellerDashboard(storeId?: number) {
    return useQuery({
        queryKey: dashboardKeys.seller(storeId),
        queryFn: () => getSellerDashboard(storeId),
        staleTime: 1000 * 60 * 2, // 2 minutes - dashboards should refresh frequently
        refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    });
}

/**
 * Hook to get store dashboard
 */
export function useStoreDashboard(storeId?: number) {
    return useQuery({
        queryKey: dashboardKeys.store(storeId),
        queryFn: () => getStoreDashboard(storeId),
        staleTime: 1000 * 60 * 2,
        refetchInterval: 1000 * 60 * 5,
    });
}

/**
 * Hook to get admin consolidated dashboard
 */
export function useAdminDashboard() {
    return useQuery({
        queryKey: dashboardKeys.admin(),
        queryFn: getAdminDashboard,
        staleTime: 1000 * 60 * 2,
        refetchInterval: 1000 * 60 * 5,
    });
}
