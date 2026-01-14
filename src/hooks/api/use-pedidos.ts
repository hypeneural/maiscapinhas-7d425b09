/**
 * Pedidos Hooks
 * 
 * React Query hooks for pedidos (orders) management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedidosService } from '@/services/pedidos.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    PedidoFilters,
    CreatePedidoRequest,
    UpdatePedidoRequest,
    UpdatePedidoStatusRequest,
    BulkPedidoStatusRequest,
    PedidoStatus,
} from '@/types/pedidos.types';

// ============================================================
// Query Keys
// ============================================================

export const pedidosKeys = {
    all: ['pedidos'] as const,
    lists: () => [...pedidosKeys.all, 'list'] as const,
    list: (filters?: PedidoFilters) => [...pedidosKeys.lists(), filters] as const,
    details: () => [...pedidosKeys.all, 'detail'] as const,
    detail: (id: number) => [...pedidosKeys.details(), id] as const,
};

// ============================================================
// Pedido Hooks
// ============================================================

/**
 * Hook to list pedidos with filters
 */
export function usePedidos(filters?: PedidoFilters) {
    return useQuery({
        queryKey: pedidosKeys.list(filters),
        queryFn: () => pedidosService.list(filters),
    });
}

/**
 * Hook to get a single pedido (includes status_history)
 */
export function usePedido(id: number) {
    return useQuery({
        queryKey: pedidosKeys.detail(id),
        queryFn: () => pedidosService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a pedido
 */
export function useCreatePedido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePedidoRequest) => pedidosService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
            toast.success('Pedido criado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a pedido
 */
export function useUpdatePedido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePedidoRequest }) =>
            pedidosService.update(id, data),
        onSuccess: (pedido) => {
            queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
            queryClient.invalidateQueries({ queryKey: pedidosKeys.detail(pedido.id) });
            toast.success('Pedido atualizado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a pedido
 */
export function useDeletePedido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => pedidosService.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
            queryClient.invalidateQueries({ queryKey: pedidosKeys.detail(id) });
            toast.success('Pedido excluído com sucesso!');
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
 * Hook to update pedido status (single)
 * Now returns full response including WhatsApp notification result
 * Toast is not shown automatically - component should handle feedback
 */
export function useUpdatePedidoStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePedidoStatusRequest }) =>
            pedidosService.updateStatus(id, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
            queryClient.invalidateQueries({ queryKey: pedidosKeys.detail(response.data.id) });
            // Toast removed - component handles feedback based on notification result
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to bulk update pedido status (Admin only)
 */
export function useBulkPedidoStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BulkPedidoStatusRequest) => pedidosService.bulkUpdateStatus(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: pedidosKeys.lists() });
            toast.success(response.message);
            if (response.data.errors.length > 0) {
                toast.warning(`${response.data.errors.length} pedido(s) não puderam ser atualizados`);
            }
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
