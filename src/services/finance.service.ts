/**
 * Finance Service
 * 
 * Manages bonus and commission operations.
 */

import { apiGet } from '@/lib/api';
import type {
    ApiResponse,
    PaginatedResponse,
    SellerBonus,
    BonusCalculation,
    CommissionProjection
} from '@/types/api';

// ============================================================
// Bonus
// ============================================================

interface BonusFilters {
    store_id?: number;
    from?: string;
    to?: string;
}

/**
 * Get bonus ledger with filters
 */
export async function getBonusLedger(filters: BonusFilters = {}): Promise<PaginatedResponse<SellerBonus>> {
    return apiGet<PaginatedResponse<SellerBonus>>('/finance/bonus', filters);
}

/**
 * Get bonus for a specific seller
 */
export async function getSellerBonus(
    sellerId: number,
    filters?: { from?: string; to?: string }
): Promise<SellerBonus[]> {
    const response = await apiGet<ApiResponse<SellerBonus[]>>(
        `/finance/bonus/seller/${sellerId}`,
        filters
    );
    return response.data;
}

/**
 * Calculate bonus for a given sales amount
 */
export async function calculateBonus(amount: number, storeId?: number): Promise<BonusCalculation> {
    const params = { amount, store_id: storeId };
    const response = await apiGet<ApiResponse<BonusCalculation>>('/finance/bonus/calculate', params);
    return response.data;
}

// ============================================================
// Commission
// ============================================================

interface CommissionFilters {
    store_id?: number;
    month?: string;
}

interface CommissionEntry {
    seller_id: number;
    seller_name: string;
    sales_total: number;
    goal: number;
    achievement_rate: number;
    commission_rate: number;
    commission_amount: number;
}

/**
 * Get commission ledger with filters
 */
export async function getCommissionLedger(
    filters: CommissionFilters = {}
): Promise<PaginatedResponse<CommissionEntry>> {
    return apiGet<PaginatedResponse<CommissionEntry>>('/finance/commission', filters);
}

/**
 * Get commission for a specific seller
 */
export async function getSellerCommission(
    sellerId: number,
    month?: string
): Promise<CommissionEntry> {
    const params = month ? { month } : {};
    const response = await apiGet<ApiResponse<CommissionEntry>>(
        `/finance/commission/seller/${sellerId}`,
        params
    );
    return response.data;
}

/**
 * Get commission projection with scenarios
 */
export async function getCommissionProjection(
    sellerId: number,
    month?: string
): Promise<CommissionProjection> {
    const params = month ? { month } : {};
    const response = await apiGet<ApiResponse<CommissionProjection>>(
        `/finance/commission/projection/${sellerId}`,
        params
    );
    return response.data;
}
