/**
 * Cash Closings Hooks
 * 
 * React Query hooks for cash closing workflow operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cashClosingsService } from '@/services/conference';
import { cashShiftKeys } from './use-cash-shifts';
import type {
    CreateClosingRequest,
    UpdateClosingRequest,
    RejectClosingRequest,
} from '@/types/conference.types';

// ============================================================
// Query Keys
// ============================================================

export const cashClosingKeys = {
    all: ['cash-closings'] as const,
    details: () => [...cashClosingKeys.all, 'detail'] as const,
    detail: (shiftId: number) => [...cashClosingKeys.details(), shiftId] as const,
    reports: () => [...cashClosingKeys.all, 'report'] as const,
    report: (storeId: number, month: string) => [...cashClosingKeys.reports(), storeId, month] as const,
};

// ============================================================
// Queries
// ============================================================

/**
 * Get closing details for a shift
 */
export function useCashClosing(shiftId: number, enabled = true) {
    return useQuery({
        queryKey: cashClosingKeys.detail(shiftId),
        queryFn: () => cashClosingsService.get(shiftId),
        enabled: enabled && shiftId > 0,
        staleTime: 30 * 1000,
        retry: false, // 404 is expected if no closing exists
    });
}

/**
 * Get cash integrity report
 */
export function useCashIntegrityReport(storeId: number, month: string, enabled = true) {
    return useQuery({
        queryKey: cashClosingKeys.report(storeId, month),
        queryFn: () => cashClosingsService.getReport(storeId, month),
        enabled: enabled && storeId > 0 && !!month,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// ============================================================
// Mutations
// ============================================================

/**
 * Create a new closing for a shift
 */
export function useCreateClosing() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ shiftId, data }: { shiftId: number; data: CreateClosingRequest }) =>
            cashClosingsService.create(shiftId, data),
        onSuccess: (_, { shiftId }) => {
            queryClient.invalidateQueries({ queryKey: cashClosingKeys.detail(shiftId) });
            queryClient.invalidateQueries({ queryKey: cashShiftKeys.detail(shiftId) });
            toast({
                title: 'Fechamento criado',
                description: 'Os valores foram salvos como rascunho.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao criar fechamento',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Update an existing closing
 */
export function useUpdateClosing() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ shiftId, data }: { shiftId: number; data: UpdateClosingRequest }) =>
            cashClosingsService.update(shiftId, data),
        onSuccess: (_, { shiftId }) => {
            queryClient.invalidateQueries({ queryKey: cashClosingKeys.detail(shiftId) });
            toast({
                title: 'Fechamento atualizado',
                description: 'Os valores foram atualizados.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao atualizar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Submit closing for approval
 */
export function useSubmitClosing() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (shiftId: number) => cashClosingsService.submit(shiftId),
        onSuccess: (_, shiftId) => {
            queryClient.invalidateQueries({ queryKey: cashClosingKeys.detail(shiftId) });
            queryClient.invalidateQueries({ queryKey: cashShiftKeys.all });
            toast({
                title: 'Enviado para conferência',
                description: 'O fechamento foi enviado para aprovação.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao enviar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Approve a submitted closing
 */
export function useApproveClosing() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (shiftId: number) => cashClosingsService.approve(shiftId),
        onSuccess: (_, shiftId) => {
            queryClient.invalidateQueries({ queryKey: cashClosingKeys.detail(shiftId) });
            queryClient.invalidateQueries({ queryKey: cashShiftKeys.all });
            toast({
                title: 'Fechamento aprovado',
                description: 'O caixa foi conferido e fechado com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao aprovar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Reject a submitted closing
 */
export function useRejectClosing() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ shiftId, data }: { shiftId: number; data: RejectClosingRequest }) =>
            cashClosingsService.reject(shiftId, data),
        onSuccess: (_, { shiftId }) => {
            queryClient.invalidateQueries({ queryKey: cashClosingKeys.detail(shiftId) });
            queryClient.invalidateQueries({ queryKey: cashShiftKeys.all });
            toast({
                title: 'Fechamento rejeitado',
                description: 'O vendedor deverá corrigir os valores.',
                variant: 'destructive',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao rejeitar',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
