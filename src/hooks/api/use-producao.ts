/**
 * Production Hooks
 * 
 * React Query hooks for production cart and orders (Admin).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { producaoService } from '@/services/producao.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    ProducaoPedidoFilters,
    CloseCartRequest,
    ReceiveOrderRequest,
    CancelOrderRequest,
} from '@/types/producao.types';

// ============================================================
// Query Keys
// ============================================================

export const producaoKeys = {
    all: ['producao'] as const,
    carrinho: () => [...producaoKeys.all, 'carrinho'] as const,
    pedidos: () => [...producaoKeys.all, 'pedidos'] as const,
    pedidoList: (filters?: ProducaoPedidoFilters) => [...producaoKeys.pedidos(), 'list', filters] as const,
    pedidoDetail: (id: number) => [...producaoKeys.pedidos(), 'detail', id] as const,
    pedidoTimeline: (id: number) => [...producaoKeys.pedidos(), 'timeline', id] as const,
};

// ============================================================
// Cart Hooks
// ============================================================

/**
 * Hook to get current production cart
 */
export function useCarrinho() {
    return useQuery({
        queryKey: producaoKeys.carrinho(),
        queryFn: () => producaoService.getCarrinho(),
    });
}

/**
 * Hook to add capas to cart
 */
export function useAddToCart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (capaIds: number[]) => producaoService.addToCart(capaIds),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: producaoKeys.carrinho() });
            queryClient.invalidateQueries({ queryKey: ['capas-personalizadas'] });

            if (response.data.added_count > 0) {
                toast.success(`${response.data.added_count} item(ns) adicionado(s) ao carrinho`);
            }

            if (response.data.blocked_count > 0) {
                response.data.blocked.forEach((item) => {
                    toast.warning(`Capa #${item.id}: ${item.message}`);
                });
            }
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to validate capas before adding to cart
 */
export function useValidateCart() {
    return useMutation({
        mutationFn: (capaIds: number[]) => producaoService.validateCart(capaIds),
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove item from cart
 */
export function useRemoveFromCart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemId: number) => producaoService.removeFromCart(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: producaoKeys.carrinho() });
            toast.success('Item removido do carrinho');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove multiple items from cart
 */
export function useBulkRemoveFromCart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemIds: number[]) => producaoService.bulkRemoveFromCart(itemIds),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: producaoKeys.carrinho() });
            queryClient.invalidateQueries({ queryKey: ['capas-personalizadas'] });

            if (response.data.removed_count > 0) {
                toast.success(`${response.data.removed_count} item(ns) removido(s)`);
            }

            if (response.data.error_count > 0) {
                response.data.errors.forEach((err) => {
                    toast.warning(`Item #${err.id}: ${err.message}`);
                });
            }
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to close cart and create order
 */
export function useCloseCart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CloseCartRequest) => producaoService.closeCart(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: producaoKeys.all });
            toast.success('Pedido de produção criado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to cancel cart
 */
export function useCancelCart() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => producaoService.cancelCart(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: producaoKeys.carrinho() });
            queryClient.invalidateQueries({ queryKey: ['capas-personalizadas'] });
            toast.success('Carrinho cancelado');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Order Hooks
// ============================================================

/**
 * Hook to list production orders
 */
export function useProducaoPedidos(filters?: ProducaoPedidoFilters) {
    return useQuery({
        queryKey: producaoKeys.pedidoList(filters),
        queryFn: () => producaoService.getPedidos(filters),
    });
}

/**
 * Hook to get production order by ID
 */
export function useProducaoPedido(id: number) {
    return useQuery({
        queryKey: producaoKeys.pedidoDetail(id),
        queryFn: () => producaoService.getPedidoById(id),
        enabled: !!id,
    });
}

/**
 * Hook to get order timeline
 */
export function useProducaoTimeline(id: number) {
    return useQuery({
        queryKey: producaoKeys.pedidoTimeline(id),
        queryFn: () => producaoService.getPedidoTimeline(id),
        enabled: !!id,
    });
}

/**
 * Hook to mark order as received
 */
export function useReceivePedido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data?: ReceiveOrderRequest }) =>
            producaoService.receivePedido(id, data),
        onSuccess: (pedido) => {
            queryClient.invalidateQueries({ queryKey: producaoKeys.pedidos() });
            queryClient.invalidateQueries({ queryKey: producaoKeys.pedidoDetail(pedido.id) });
            queryClient.invalidateQueries({ queryKey: ['capas-personalizadas'] });
            toast.success('Pedido marcado como recebido!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to cancel order
 */
export function useCancelPedido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data?: CancelOrderRequest }) =>
            producaoService.cancelPedido(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: producaoKeys.pedidos() });
            queryClient.invalidateQueries({ queryKey: producaoKeys.pedidoDetail(id) });
            queryClient.invalidateQueries({ queryKey: ['capas-personalizadas'] });
            toast.success('Pedido cancelado');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Admin Hooks
// ============================================================

/**
 * Hook to clean orphan items from cancelled carts
 */
export function useCleanOrphanItems() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => producaoService.cleanOrphanItems(),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: producaoKeys.carrinho() });
            queryClient.invalidateQueries({ queryKey: ['capas-personalizadas'] });
            toast.success(response.message);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

