/**
 * Reports Service
 * 
 * Manages ranking, store performance, and cash integrity reports.
 */

import { apiGet } from '@/lib/api';
import type {
    ApiResponse,
    RankingResponse,
    RankingFilters,
    BirthdayEntry,
    StorePerformance,
    ConsolidatedPerformanceResponse,
    CashIntegrityData
} from '@/types/api';

// ============================================================
// Ranking
// ============================================================

/**
 * Get seller ranking
 */
export async function getRanking(filters: RankingFilters = {}): Promise<RankingResponse> {
    const response = await apiGet<ApiResponse<RankingResponse>>('/reports/ranking', filters);
    return response.data;
}

// ============================================================
// Store Performance
// ============================================================

/**
 * Get consolidated performance for all stores
 * Used by /gestao/lojas page
 */
export async function getConsolidatedPerformance(
    month?: string
): Promise<ConsolidatedPerformanceResponse> {
    const params: Record<string, unknown> = {};
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<ConsolidatedPerformanceResponse>>(
        '/reports/consolidated',
        params
    );
    return response.data;
}

/**
 * Get performance for a single store
 */
export async function getStorePerformance(
    storeId: number,
    month?: string
): Promise<StorePerformance> {
    const params: Record<string, unknown> = { store_id: storeId };
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<StorePerformance>>(
        '/reports/store-performance',
        params
    );
    return response.data;
}

// ============================================================
// Cash Integrity
// ============================================================

/**
 * Get cash integrity report for a store
 * Used by /gestao/quebra page
 */
export async function getCashIntegrity(
    storeId: number,
    month?: string
): Promise<CashIntegrityData> {
    const params: Record<string, unknown> = { store_id: storeId };
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<CashIntegrityData>>(
        '/reports/cash-integrity',
        params
    );
    return response.data;
}

// ============================================================
// Birthdays
// ============================================================

/**
 * Get birthdays for current/specified month
 */
export async function getBirthdays(
    month?: number,
    storeId?: number
): Promise<BirthdayEntry[]> {
    const params: Record<string, unknown> = {};
    if (month) params.month = month;
    if (storeId) params.store_id = storeId;

    const response = await apiGet<ApiResponse<BirthdayEntry[]>>('/users/birthdays', params);
    return response.data;
}
