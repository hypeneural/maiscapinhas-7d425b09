/**
 * Pedidos Types
 * 
 * TypeScript types for pedidos (orders) API endpoints.
 */

import type { CustomerDevice } from './customers.types';

// ============================================================
// Status Types
// ============================================================

/**
 * Pedido status values
 */
export type PedidoStatus = 1 | 2 | 3 | 4 | 5;

/**
 * Status history entry
 */
export interface PedidoStatusHistory {
    id: number;
    old_status: PedidoStatus | null;
    old_status_label: string | null;
    new_status: PedidoStatus;
    new_status_label: string;
    changed_by: {
        id: number;
        name: string;
    };
    changed_at: string;
    source: 'api' | 'bulk' | 'system' | null;
    reason: string | null;
}

// ============================================================
// Pedido
// ============================================================

/**
 * Pedido response from API
 */
export interface Pedido {
    id: number;
    selected_product: string;
    obs: string | null;
    status: PedidoStatus;
    status_label: string;
    status_color: string;
    store?: {
        id: number;
        name: string;
        city: string;
    };
    store_id: number;
    user?: {
        id: number;
        name: string;
    };
    user_id: number;
    customer?: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
    };
    customer_id: number;
    customer_device?: CustomerDevice;
    customer_device_id: number | null;
    status_history?: PedidoStatusHistory[];
    created_at: string;
    updated_at: string;
}

/**
 * Request to create pedido
 */
export interface CreatePedidoRequest {
    customer_id: number;
    selected_product: string;
    store_id?: number;
    user_id?: number;
    customer_device_id?: number;
    obs?: string;
    status?: PedidoStatus;
}

/**
 * Request to update pedido
 */
export interface UpdatePedidoRequest {
    customer_id?: number;
    selected_product?: string;
    customer_device_id?: number | null;
    obs?: string | null;
    status?: PedidoStatus;
}

/**
 * Request to update pedido status
 */
export interface UpdatePedidoStatusRequest {
    status: PedidoStatus;
    reason?: string;
    /**
     * Enviar notificação WhatsApp ao cliente
     * Só tem efeito quando status = 3 (Disponível na Loja)
     * @optional - default: false
     */
    notify_whatsapp?: boolean;
}

/**
 * WhatsApp notification result
 * Only present when notify_whatsapp=true was sent in request
 */
export interface WhatsAppNotificationResult {
    /** Se a mensagem foi enviada com sucesso */
    sent: boolean;
    /** Telefone mascarado (ex: "****9999") - null se cliente não tem telefone */
    phone: string | null;
    /** Mensagem de erro (só presente quando sent=false) */
    error?: string;
}

/**
 * Response from status update with optional WhatsApp notification
 */
export interface UpdatePedidoStatusResponse {
    message: string;
    data: Pedido;
    /** Resultado da notificação WhatsApp - só presente quando notify_whatsapp=true */
    whatsapp_notification?: WhatsAppNotificationResult;
}

/**
 * Request to bulk update pedido status
 */
export interface BulkPedidoStatusRequest {
    ids: number[];
    status: PedidoStatus;
}

/**
 * Bulk status update response
 */
export interface BulkStatusResponse {
    message: string;
    data: {
        updated: number;
        skipped: number;
        errors: Array<{
            id: number;
            error: string;
        }>;
    };
}

// ============================================================
// Filters
// ============================================================

/**
 * Valid sort fields for pedidos
 */
export type PedidoSortField = 'id' | 'created_at' | 'updated_at' | 'status' | 'selected_product' | 'store_id' | 'user_id';

/**
 * Pedido list filters
 */
export interface PedidoFilters {
    keyword?: string;                        // Busca em ID, produto, obs, cliente
    status?: PedidoStatus | PedidoStatus[];  // Aceita múltiplos status
    store_id?: number;
    user_id?: number;
    customer_id?: number;
    initial_date?: string;                   // YYYY-MM-DD
    final_date?: string;                     // YYYY-MM-DD
    brand_id?: number;
    model_id?: number;
    page?: number;
    per_page?: number;
    sort?: PedidoSortField;
    direction?: 'asc' | 'desc';
}

