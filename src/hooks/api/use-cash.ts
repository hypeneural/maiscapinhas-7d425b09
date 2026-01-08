/**
 * Cash Hooks
 * 
 * React Query hooks for cash shift and closing operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getCashShifts,
    getCashShift,
    createCashShift,
    getPendingShifts,
    getDivergentShifts,
    getCashClosing,
    submitClosing,
    approveClosing,
    rejectClosing
} from '@/services/cash.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type { CashShiftsFilters, SubmitClosingRequest } from '@/types/api';
import { dashboardKeys } from './use-dashboard';

/**
 * Query key factory for cash queries
 */
export const cashKeys = {
    all: ['cash'] as const,
    shifts: () => [...cashKeys.all, 'shifts'] as const,
    shiftList: (filters: CashShiftsFilters) => [...cashKeys.shifts(), 'list', filters] as const,
    shiftDetail: (id: number) => [...cashKeys.shifts(), 'detail', id] as const,
    pending: (storeId?: number) => [...cashKeys.shifts(), 'pending', storeId] as const,
    divergent: (storeId?: number) => [...cashKeys.shifts(), 'divergent', storeId] as const,
    closings: () => [...cashKeys.all, 'closings'] as const,
    closing: (shiftId: number) => [...cashKeys.closings(), shiftId] as const,
};

/**
 * Hook to list cash shifts
 */
export function useCashShifts(filters: CashShiftsFilters = {}) {
    return useQuery({
        queryKey: cashKeys.shiftList(filters),
        queryFn: () => getCashShifts(filters),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get a single shift
 */
export function useCashShift(id: number) {
    return useQuery({
        queryKey: cashKeys.shiftDetail(id),
        queryFn: () => getCashShift(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a new shift
 */
export function useCreateCashShift() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCashShift,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cashKeys.shifts() });
            toast.success('Turno criado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to get pending shifts
 */
export function usePendingShifts(storeId?: number) {
    return useQuery({
        queryKey: cashKeys.pending(storeId),
        queryFn: () => getPendingShifts(storeId),
        staleTime: 1000 * 60 * 2, // Refresh more frequently
        refetchInterval: 1000 * 60 * 3,
    });
}

/**
 * Hook to get divergent shifts
 */
export function useDivergentShifts(storeId?: number) {
    return useQuery({
        queryKey: cashKeys.divergent(storeId),
        queryFn: () => getDivergentShifts(storeId),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get closing details
 */
export function useCashClosing(shiftId: number) {
    return useQuery({
        queryKey: cashKeys.closing(shiftId),
        queryFn: () => getCashClosing(shiftId),
        enabled: !!shiftId,
    });
}

/**
 * Hook to submit closing
 */
export function useSubmitClosing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ shiftId, data }: { shiftId: number; data: SubmitClosingRequest }) =>
            submitClosing(shiftId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cashKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Fechamento enviado para aprovação!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to approve closing
 */
export function useApproveClosing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ shiftId, notes }: { shiftId: number; notes?: string }) =>
            approveClosing(shiftId, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cashKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Fechamento aprovado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to reject closing
 */
export function useRejectClosing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ shiftId, reason }: { shiftId: number; reason: string }) =>
            rejectClosing(shiftId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cashKeys.all });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Fechamento rejeitado. Vendedor será notificado.');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
