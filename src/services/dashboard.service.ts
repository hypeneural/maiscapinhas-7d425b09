/**
 * Dashboard Service
 * 
 * Fetches dashboard data for different user roles.
 * Each role has its own endpoint as per backend specification.
 */

import { apiGet } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type {
    SellerDashboard,
    ConferenteDashboard,
    AdminDashboard,
    VendedorDashboardParams,
    ConferenteDashboardParams,
    AdminDashboardParams,
    RankingData,
    RankingParams,
    StorePerformance,
    StorePerformanceParams,
    CashIntegrityReport,
    CashIntegrityParams,
    ConsolidatedReport,
    ConsolidatedReportParams,
    PendingShift,
    DivergentShift,
} from '@/types/dashboard.types';

// ============================================================
// Dashboard Endpoints
// ============================================================

/**
 * Get seller's personal dashboard
 * Requires store_id as the backend needs context
 */
export async function getSellerDashboard(
    params: VendedorDashboardParams
): Promise<SellerDashboard> {
    const response = await apiGet<ApiResponse<SellerDashboard>>('/dashboard/vendedor', params);
    return response.data;
}

/**
 * Get conferente dashboard
 * Requires store_id as the backend needs context
 */
export async function getConferenteDashboard(
    params: ConferenteDashboardParams
): Promise<ConferenteDashboard> {
    const response = await apiGet<ApiResponse<ConferenteDashboard>>('/dashboard/conferente', params);
    return response.data;
}

/**
 * Get admin consolidated dashboard
 * Shows all stores the admin/gerente has access to
 */
export async function getAdminDashboard(
    params?: AdminDashboardParams
): Promise<AdminDashboard> {
    const response = await apiGet<ApiResponse<AdminDashboard>>('/dashboard/admin', params || {});
    return response.data;
}

// ============================================================
// Reports Endpoints
// ============================================================

/**
 * Get ranking of sellers
 */
export async function getRanking(params?: RankingParams): Promise<RankingData> {
    const response = await apiGet<ApiResponse<RankingData>>('/reports/ranking', params || {});
    return response.data;
}

/**
 * Get store performance with forecast
 */
export async function getStorePerformance(
    params: StorePerformanceParams
): Promise<StorePerformance> {
    const response = await apiGet<ApiResponse<StorePerformance>>('/reports/store-performance', params);
    return response.data;
}

/**
 * Get cash integrity report
 */
export async function getCashIntegrity(
    params: CashIntegrityParams
): Promise<CashIntegrityReport> {
    const response = await apiGet<ApiResponse<CashIntegrityReport>>('/reports/cash-integrity', params);
    return response.data;
}

/**
 * Get consolidated multi-store report (Admin only)
 */
export async function getConsolidatedReport(
    params?: ConsolidatedReportParams
): Promise<ConsolidatedReport> {
    const response = await apiGet<ApiResponse<ConsolidatedReport>>('/reports/consolidated', params);
    return response.data;
}

// ============================================================
// Cash Shifts Endpoints (Conferente)
// ============================================================

/**
 * Get pending shifts for conferente
 */
export async function getPendingShifts(storeId: number): Promise<{
    pending_count: number;
    shifts: PendingShift[];
}> {
    const response = await apiGet<ApiResponse<{
        pending_count: number;
        shifts: PendingShift[];
    }>>('/cash/shifts/pending', { store_id: storeId });
    return response.data;
}

/**
 * Get divergent shifts for conferente
 */
export async function getDivergentShifts(storeId: number, month?: string): Promise<{
    total_divergent: number;
    total_divergence_value: number;
    shifts: DivergentShift[];
}> {
    const params: Record<string, unknown> = { store_id: storeId };
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<{
        total_divergent: number;
        total_divergence_value: number;
        shifts: DivergentShift[];
    }>>('/cash/shifts/divergent', params);
    return response.data;
}

// ============================================================
// Export all
// ============================================================

export const dashboardService = {
    getSellerDashboard,
    getConferenteDashboard,
    getAdminDashboard,
    getRanking,
    getStorePerformance,
    getCashIntegrity,
    getConsolidatedReport,
    getPendingShifts,
    getDivergentShifts,
};
