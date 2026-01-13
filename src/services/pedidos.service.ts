/**
 * Pedidos Service
 * 
 * API service for pedidos (orders) management.
 * Includes CRUD operations and status management.
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    Pedido,
    PedidoFilters,
    CreatePedidoRequest,
    UpdatePedidoRequest,
    UpdatePedidoStatusRequest,
    BulkPedidoStatusRequest,
    BulkStatusResponse,
} from '@/types/pedidos.types';

// ============================================================
// Pedido CRUD
// ============================================================

/**
 * List pedidos with optional filters
 */
export async function listPedidos(
    filters?: PedidoFilters
): Promise<PaginatedResponse<Pedido>> {
    const params: Record<string, unknown> = {};

    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.user_id) params.user_id = filters.user_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.customer_id) params.customer_id = filters.customer_id;
    if (filters?.initial_date) params.initial_date = filters.initial_date;
    if (filters?.final_date) params.final_date = filters.final_date;
    if (filters?.brand_id) params.brand_id = filters.brand_id;
    if (filters?.model_id) params.model_id = filters.model_id;
    if (filters?.keyword) params.keyword = filters.keyword;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.sort) params.sort = filters.sort;
    if (filters?.direction) params.direction = filters.direction;

    return apiGet<PaginatedResponse<Pedido>>('/pedidos', params);
}

/**
 * Get a single pedido by ID (includes status_history)
 */
export async function getPedido(id: number): Promise<Pedido> {
    const response = await apiGet<ApiResponse<Pedido>>(`/pedidos/${id}`);
    return response.data;
}

/**
 * Create a new pedido
 */
export async function createPedido(data: CreatePedidoRequest): Promise<Pedido> {
    const response = await apiPost<ApiResponse<Pedido>>('/pedidos', data);
    return response.data;
}

/**
 * Update an existing pedido
 */
export async function updatePedido(
    id: number,
    data: UpdatePedidoRequest
): Promise<Pedido> {
    const response = await apiPut<ApiResponse<Pedido>>(`/pedidos/${id}`, data);
    return response.data;
}

/**
 * Delete a pedido
 */
export async function deletePedido(id: number): Promise<void> {
    await apiDelete(`/pedidos/${id}`);
}

// ============================================================
// Status Management
// ============================================================

/**
 * Update pedido status (single)
 */
export async function updateStatus(
    id: number,
    data: UpdatePedidoStatusRequest
): Promise<Pedido> {
    const response = await apiPatch<ApiResponse<Pedido>>(`/pedidos/${id}/status`, data);
    return response.data;
}

/**
 * Bulk update pedido status (Admin only)
 */
export async function bulkUpdateStatus(
    data: BulkPedidoStatusRequest
): Promise<BulkStatusResponse> {
    const response = await apiPost<BulkStatusResponse>('/pedidos/bulk-status', data);
    return response;
}

// ============================================================
// Service Object
// ============================================================

export const pedidosService = {
    list: listPedidos,
    get: getPedido,
    create: createPedido,
    update: updatePedido,
    delete: deletePedido,
    updateStatus,
    bulkUpdateStatus,
};

export default pedidosService;
