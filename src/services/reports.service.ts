/**
 * Reports Service
 * 
 * Manages ranking and performance reports.
 */

import { apiGet } from '@/lib/api';
import type {
    ApiResponse,
    RankingResponse,
    RankingFilters,
    BirthdayEntry
} from '@/types/api';

/**
 * Get seller ranking
 */
export async function getRanking(filters: RankingFilters = {}): Promise<RankingResponse> {
    const response = await apiGet<ApiResponse<RankingResponse>>('/reports/ranking', filters);
    return response.data;
}

/**
 * Store performance report data
 */
export interface StorePerformanceData {
    store: {
        id: number;
        name: string;
    };
    period: string;
    total_sold: number;
    goal: number;
    achievement_rate: number;
    sellers_count: number;
    sellers_above_goal: number;
    top_seller: {
        id: number;
        name: string;
        total_sold: number;
    };
    sales_by_payment_method: Record<string, number>;
    daily_trend: Array<{
        date: string;
        amount: number;
    }>;
}

/**
 * Get store performance report
 */
export async function getStorePerformance(
    storeId?: number,
    month?: string
): Promise<StorePerformanceData> {
    const params: Record<string, unknown> = {};
    if (storeId) params.store_id = storeId;
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<StorePerformanceData>>(
        '/reports/store-performance',
        params
    );
    return response.data;
}

/**
 * Cash integrity report data
 */
export interface CashIntegrityData {
    period: string;
    total_shifts: number;
    approved_shifts: number;
    rejected_shifts: number;
    pending_shifts: number;
    total_divergence: number;
    divergence_rate: number;
    top_divergences: Array<{
        seller: { id: number; name: string };
        total_divergence: number;
        count: number;
    }>;
}

/**
 * Get cash integrity report
 */
export async function getCashIntegrity(
    storeId?: number,
    month?: string
): Promise<CashIntegrityData> {
    const params: Record<string, unknown> = {};
    if (storeId) params.store_id = storeId;
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<CashIntegrityData>>(
        '/reports/cash-integrity',
        params
    );
    return response.data;
}

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
