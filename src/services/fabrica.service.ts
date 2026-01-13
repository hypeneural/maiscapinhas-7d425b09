/**
 * Factory Portal Service
 * 
 * API service for factory portal operations.
 */

import { apiGet, apiPatch } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    ProducaoPedido,
    FabricaPedidoFilters,
    AcceptOrderRequest,
    DispatchOrderRequest,
} from '@/types/producao.types';

// ============================================================
// Order Operations
// ============================================================

/**
 * List factory orders with filters
 */
export async function getPedidos(
    filters?: FabricaPedidoFilters
): Promise<PaginatedResponse<ProducaoPedido>> {
    const params: Record<string, unknown> = {};

    if (filters?.status) params.status = filters.status;
    if (filters?.initial_date) params.initial_date = filters.initial_date;
    if (filters?.final_date) params.final_date = filters.final_date;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.per_page = filters.per_page;

    return apiGet<PaginatedResponse<ProducaoPedido>>('/fabrica/pedidos', params);
}

/**
 * Get factory order by ID
 */
export async function getPedidoById(id: number): Promise<ProducaoPedido> {
    const response = await apiGet<ApiResponse<ProducaoPedido>>(`/fabrica/pedidos/${id}`);
    return response.data;
}

/**
 * Accept order with factory total
 */
export async function acceptPedido(
    id: number,
    data: AcceptOrderRequest
): Promise<ProducaoPedido> {
    const response = await apiPatch<ApiResponse<ProducaoPedido>>(
        `/fabrica/pedidos/${id}/aceitar`,
        data
    );
    return response.data;
}

/**
 * Dispatch order
 */
export async function dispatchPedido(
    id: number,
    data?: DispatchOrderRequest
): Promise<ProducaoPedido> {
    const response = await apiPatch<ApiResponse<ProducaoPedido>>(
        `/fabrica/pedidos/${id}/despachar`,
        data || {}
    );
    return response.data;
}

/**
 * Get photo download URL for an item
 */
export function getPhotoDownloadUrl(pedidoId: number, itemId: number): string {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}/fabrica/pedidos/${pedidoId}/itens/${itemId}/foto`;
}

// ============================================================
// Service Object
// ============================================================

export const fabricaService = {
    getPedidos,
    getPedidoById,
    acceptPedido,
    dispatchPedido,
    getPhotoDownloadUrl,
};

export default fabricaService;
