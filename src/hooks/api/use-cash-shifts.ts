/**
 * Cash Shifts Hooks
 * 
 * React Query hooks for cash shift operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cashShiftsService } from '@/services/conference';
import type {
    CashShiftFilters,
    CreateCashShiftRequest,
} from '@/types/conference.types';

// ============================================================
// Query Keys
// ============================================================

export const cashShiftKeys = {
    all: ['cash-shifts'] as const,
    lists: () => [...cashShiftKeys.all, 'list'] as const,
    list: (filters?: CashShiftFilters) => [...cashShiftKeys.lists(), filters] as const,
    details: () => [...cashShiftKeys.all, 'detail'] as const,
    detail: (id: number) => [...cashShiftKeys.details(), id] as const,
    pending: (storeId?: number) => [...cashShiftKeys.all, 'pending', storeId] as const,
    divergent: (storeId?: number) => [...cashShiftKeys.all, 'divergent', storeId] as const,
};

// ============================================================
// Queries
// ============================================================

/**
 * List cash shifts with filters
 */
export function useCashShifts(filters?: CashShiftFilters) {
    return useQuery({
        queryKey: cashShiftKeys.list(filters),
        queryFn: () => cashShiftsService.list(filters),
        staleTime: 30 * 1000, // 30 seconds
    });
}

/**
 * Get a single cash shift
 */
export function useCashShift(id: number, enabled = true) {
    return useQuery({
        queryKey: cashShiftKeys.detail(id),
        queryFn: () => cashShiftsService.get(id),
        enabled: enabled && id > 0,
        staleTime: 30 * 1000,
    });
}

/**
 * Get pending shifts (for conferentes dashboard)
 */
export function usePendingShifts(storeId?: number) {
    return useQuery({
        queryKey: cashShiftKeys.pending(storeId),
        queryFn: () => cashShiftsService.getPending(storeId),
        staleTime: 60 * 1000, // 1 minute
    });
}

/**
 * Get divergent shifts
 */
export function useDivergentShifts(storeId?: number) {
    return useQuery({
        queryKey: cashShiftKeys.divergent(storeId),
        queryFn: () => cashShiftsService.getDivergent(storeId),
        staleTime: 60 * 1000,
    });
}

// ============================================================
// Mutations
// ============================================================

/**
 * Create a new cash shift
 */
export function useCreateCashShift() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (data: CreateCashShiftRequest) => cashShiftsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cashShiftKeys.lists() });
            queryClient.invalidateQueries({ queryKey: cashShiftKeys.pending() });
            toast({
                title: 'Turno criado',
                description: 'O turno foi criado com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao criar turno',
                description: error.message || 'Ocorreu um erro ao criar o turno.',
                variant: 'destructive',
            });
        },
    });
}
