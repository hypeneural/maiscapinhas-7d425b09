/**
 * Production Service
 * 
 * API service for production cart and orders (Admin).
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    ProducaoPedido,
    ProducaoPedidoFilters,
    AddToCartResponse,
    ValidateCartResponse,
    BulkRemoveResponse,
    CleanOrphanResponse,
    CloseCartRequest,
    ReceiveOrderRequest,
    CancelOrderRequest,
} from '@/types/producao.types';

// ============================================================
// Cart Operations
// ============================================================

/**
 * Get current production cart
 */
export async function getCarrinho(): Promise<ProducaoPedido> {
    const response = await apiGet<ApiResponse<ProducaoPedido>>('/producao/carrinho');
    return response.data;
}

/**
 * Add capas to cart
 */
export async function addToCart(capaIds: number[]): Promise<AddToCartResponse> {
    return apiPost<AddToCartResponse>('/producao/carrinho/itens', { capa_ids: capaIds });
}

/**
 * Validate capas before adding to cart
 */
export async function validateCart(capaIds: number[]): Promise<ValidateCartResponse> {
    return apiPost<ValidateCartResponse>('/producao/carrinho/validar', { capa_ids: capaIds });
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: number): Promise<void> {
    await apiDelete(`/producao/carrinho/itens/${itemId}`);
}

/**
 * Remove multiple items from cart
 */
export async function bulkRemoveFromCart(itemIds: number[]): Promise<BulkRemoveResponse> {
    return apiDelete<BulkRemoveResponse>('/producao/carrinho/itens/bulk', {
        data: { item_ids: itemIds }
    });
}

/**
 * Close cart and create production order
 */
export async function closeCart(data: CloseCartRequest): Promise<ProducaoPedido> {
    const response = await apiPost<ApiResponse<ProducaoPedido>>(
        '/producao/carrinho/fechar',
        data
    );
    return response.data;
}

/**
 * Cancel current cart
 */
export async function cancelCart(): Promise<void> {
    await apiDelete('/producao/carrinho');
}

// ============================================================
// Order Operations
// ============================================================

/**
 * List production orders with filters
 */
export async function getPedidos(
    filters?: ProducaoPedidoFilters
): Promise<PaginatedResponse<ProducaoPedido>> {
    const params: Record<string, unknown> = {};

    if (filters?.status) params.status = filters.status;
    if (filters?.initial_date) params.initial_date = filters.initial_date;
    if (filters?.final_date) params.final_date = filters.final_date;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.per_page = filters.per_page;

    return apiGet<PaginatedResponse<ProducaoPedido>>('/producao/pedidos', params);
}

/**
 * Get production order by ID
 */
export async function getPedidoById(id: number): Promise<ProducaoPedido> {
    const response = await apiGet<ApiResponse<ProducaoPedido>>(`/producao/pedidos/${id}`);
    return response.data;
}

/**
 * Get order timeline
 */
export async function getPedidoTimeline(id: number): Promise<ProducaoPedido['timeline']> {
    const response = await apiGet<ApiResponse<{ timeline: ProducaoPedido['timeline'] }>>(
        `/producao/pedidos/${id}/timeline`
    );
    return response.data.timeline;
}

/**
 * Mark order as received
 */
export async function receivePedido(
    id: number,
    data?: ReceiveOrderRequest
): Promise<ProducaoPedido> {
    const response = await apiPatch<ApiResponse<ProducaoPedido>>(
        `/producao/pedidos/${id}/receber`,
        data || {}
    );
    return response.data;
}

/**
 * Cancel production order
 */
export async function cancelPedido(
    id: number,
    data?: CancelOrderRequest
): Promise<void> {
    await apiDelete(`/producao/pedidos/${id}`, { data });
}

// ============================================================
// Service Object
// ============================================================

export const producaoService = {
    // Cart
    getCarrinho,
    validateCart,
    addToCart,
    removeFromCart,
    bulkRemoveFromCart,
    closeCart,
    cancelCart,
    // Orders
    getPedidos,
    getPedidoById,
    getPedidoTimeline,
    receivePedido,
    cancelPedido,
    // Admin
    cleanOrphanItems,
};

/**
 * Clean orphan items from cancelled carts
 */
export async function cleanOrphanItems(): Promise<CleanOrphanResponse> {
    return apiPost<CleanOrphanResponse>('/producao/admin/limpar-itens-cancelados', {});
}

export default producaoService;
