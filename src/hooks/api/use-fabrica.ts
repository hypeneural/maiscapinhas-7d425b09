/**
 * Factory Portal Hooks
 * 
 * React Query hooks for factory portal operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fabricaService } from '@/services/fabrica.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    FabricaPedidoFilters,
    AcceptOrderRequest,
    DispatchOrderRequest,
} from '@/types/producao.types';

// ============================================================
// Query Keys
// ============================================================

export const fabricaKeys = {
    all: ['fabrica'] as const,
    pedidos: () => [...fabricaKeys.all, 'pedidos'] as const,
    pedidoList: (filters?: FabricaPedidoFilters) => [...fabricaKeys.pedidos(), 'list', filters] as const,
    pedidoDetail: (id: number) => [...fabricaKeys.pedidos(), 'detail', id] as const,
};

// ============================================================
// Order Hooks
// ============================================================

/**
 * Hook to list factory orders
 */
export function useFabricaPedidos(filters?: FabricaPedidoFilters) {
    return useQuery({
        queryKey: fabricaKeys.pedidoList(filters),
        queryFn: () => fabricaService.getPedidos(filters),
    });
}

/**
 * Hook to get factory order by ID
 */
export function useFabricaPedido(id: number) {
    return useQuery({
        queryKey: fabricaKeys.pedidoDetail(id),
        queryFn: () => fabricaService.getPedidoById(id),
        enabled: !!id,
    });
}

/**
 * Hook to accept order
 */
export function useAcceptPedido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: AcceptOrderRequest }) =>
            fabricaService.acceptPedido(id, data),
        onSuccess: (pedido) => {
            queryClient.invalidateQueries({ queryKey: fabricaKeys.pedidos() });
            queryClient.invalidateQueries({ queryKey: fabricaKeys.pedidoDetail(pedido.id) });
            toast.success('Pedido aceito com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to dispatch order
 */
export function useDispatchPedido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data?: DispatchOrderRequest }) =>
            fabricaService.dispatchPedido(id, data),
        onSuccess: (pedido) => {
            queryClient.invalidateQueries({ queryKey: fabricaKeys.pedidos() });
            queryClient.invalidateQueries({ queryKey: fabricaKeys.pedidoDetail(pedido.id) });
            toast.success('Pedido despachado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
