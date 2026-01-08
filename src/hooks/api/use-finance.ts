/**
 * Finance Hooks
 * 
 * React Query hooks for bonus and commission data.
 */

import { useQuery } from '@tanstack/react-query';
import {
    getBonusLedger,
    getSellerBonus,
    calculateBonus,
    getCommissionLedger,
    getSellerCommission,
    getCommissionProjection
} from '@/services/finance.service';

/**
 * Query key factory for finance queries
 */
export const financeKeys = {
    all: ['finance'] as const,
    bonus: () => [...financeKeys.all, 'bonus'] as const,
    bonusLedger: (filters: { store_id?: number; from?: string; to?: string }) =>
        [...financeKeys.bonus(), 'ledger', filters] as const,
    sellerBonus: (sellerId: number, filters?: { from?: string; to?: string }) =>
        [...financeKeys.bonus(), 'seller', sellerId, filters] as const,
    bonusCalculate: (amount: number, storeId?: number) =>
        [...financeKeys.bonus(), 'calculate', amount, storeId] as const,
    commission: () => [...financeKeys.all, 'commission'] as const,
    commissionLedger: (filters: { store_id?: number; month?: string }) =>
        [...financeKeys.commission(), 'ledger', filters] as const,
    sellerCommission: (sellerId: number, month?: string) =>
        [...financeKeys.commission(), 'seller', sellerId, month] as const,
    commissionProjection: (sellerId: number, month?: string) =>
        [...financeKeys.commission(), 'projection', sellerId, month] as const,
};

// ============================================================
// Bonus Hooks
// ============================================================

/**
 * Hook to get bonus ledger
 */
export function useBonusLedger(filters: { store_id?: number; from?: string; to?: string } = {}) {
    return useQuery({
        queryKey: financeKeys.bonusLedger(filters),
        queryFn: () => getBonusLedger(filters),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get bonus for a specific seller
 */
export function useSellerBonus(sellerId: number, filters?: { from?: string; to?: string }) {
    return useQuery({
        queryKey: financeKeys.sellerBonus(sellerId, filters),
        queryFn: () => getSellerBonus(sellerId, filters),
        enabled: !!sellerId,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to calculate bonus for a given amount
 * Useful for real-time bonus simulation
 */
export function useBonusCalculator(amount: number, storeId?: number) {
    return useQuery({
        queryKey: financeKeys.bonusCalculate(amount, storeId),
        queryFn: () => calculateBonus(amount, storeId),
        enabled: amount > 0,
        staleTime: 1000 * 60 * 10, // Bonus rules don't change often
    });
}

// ============================================================
// Commission Hooks
// ============================================================

/**
 * Hook to get commission ledger
 */
export function useCommissionLedger(filters: { store_id?: number; month?: string } = {}) {
    return useQuery({
        queryKey: financeKeys.commissionLedger(filters),
        queryFn: () => getCommissionLedger(filters),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get commission for a specific seller
 */
export function useSellerCommission(sellerId: number, month?: string) {
    return useQuery({
        queryKey: financeKeys.sellerCommission(sellerId, month),
        queryFn: () => getSellerCommission(sellerId, month),
        enabled: !!sellerId,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get commission projection with scenarios
 */
export function useCommissionProjection(sellerId: number, month?: string) {
    return useQuery({
        queryKey: financeKeys.commissionProjection(sellerId, month),
        queryFn: () => getCommissionProjection(sellerId, month),
        enabled: !!sellerId,
        staleTime: 1000 * 60 * 5,
    });
}
