/**
 * Capas Personalizadas Hooks
 * 
 * React Query hooks for capas personalizadas (custom covers) management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { capasService } from '@/services/capas.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    CapaFilters,
    CreateCapaRequest,
    UpdateCapaRequest,
    UpdateCapaStatusRequest,
    BulkCapaStatusRequest,
    SendToProductionRequest,
    RegisterPaymentRequest,
} from '@/types/capas.types';

// ============================================================
// Query Keys
// ============================================================

export const capasKeys = {
    all: ['capas-personalizadas'] as const,
    lists: () => [...capasKeys.all, 'list'] as const,
    list: (filters?: CapaFilters) => [...capasKeys.lists(), filters] as const,
    details: () => [...capasKeys.all, 'detail'] as const,
    detail: (id: number) => [...capasKeys.details(), id] as const,
};

// ============================================================
// Capa Hooks
// ============================================================

/**
 * Hook to list capas with filters
 */
export function useCapas(filters?: CapaFilters) {
    return useQuery({
        queryKey: capasKeys.list(filters),
        queryFn: () => capasService.list(filters),
    });
}

/**
 * Hook to get a single capa
 */
export function useCapa(id: number) {
    return useQuery({
        queryKey: capasKeys.detail(id),
        queryFn: () => capasService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a capa
 */
export function useCreateCapa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCapaRequest) => capasService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            toast.success('Capa personalizada criada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a capa
 */
export function useUpdateCapa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCapaRequest }) =>
            capasService.update(id, data),
        onSuccess: (capa) => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: capasKeys.detail(capa.id) });
            toast.success('Capa personalizada atualizada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a capa
 */
export function useDeleteCapa() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => capasService.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: capasKeys.detail(id) });
            toast.success('Capa personalizada excluída com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Status Hooks
// ============================================================

/**
 * Hook to update capa status (single)
 */
export function useUpdateCapaStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCapaStatusRequest }) =>
            capasService.updateStatus(id, data),
        onSuccess: (capa) => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: capasKeys.detail(capa.id) });
            toast.success(`Status alterado para "${capa.status_label}"`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to bulk update capa status (Admin only)
 */
export function useBulkCapaStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BulkCapaStatusRequest) => capasService.bulkUpdateStatus(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            toast.success(response.message);
            if (response.data.errors.length > 0) {
                toast.warning(`${response.data.errors.length} capa(s) não puderam ser atualizadas`);
            }
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to send capas to production (Admin only)
 */
export function useSendToProduction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SendToProductionRequest) => capasService.sendToProduction(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            toast.success(response.message);
            if (response.data.errors.length > 0) {
                toast.warning(`${response.data.errors.length} capa(s) não puderam ser enviadas`);
            }
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Payment Hooks
// ============================================================

/**
 * Hook to register payment for a capa
 */
export function useRegisterPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: RegisterPaymentRequest }) =>
            capasService.registerPayment(id, data),
        onSuccess: (capa) => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: capasKeys.detail(capa.id) });
            toast.success(capa.payed ? 'Pagamento registrado com sucesso!' : 'Pagamento removido');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Photo Hooks
// ============================================================

/**
 * Hook to upload photo for a capa
 */
export function useUploadCapaPhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: number; file: File }) =>
            capasService.uploadPhoto(id, file),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: capasKeys.detail(id) });
            toast.success('Foto enviada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove photo from a capa
 */
export function useRemoveCapaPhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => capasService.removePhoto(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: capasKeys.lists() });
            queryClient.invalidateQueries({ queryKey: capasKeys.detail(id) });
            toast.success('Foto removida com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Token Generation Hook
// ============================================================

/**
 * Hook to generate upload token for public photo upload
 */
export function useGenerateUploadToken() {
    return useMutation({
        mutationFn: (id: number) => capasService.generateUploadToken(id),
        onError: (error) => {
            handleApiError(error);
        },
    });
}
