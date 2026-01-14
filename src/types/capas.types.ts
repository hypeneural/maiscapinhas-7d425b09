/**
 * Capas Personalizadas Types
 * 
 * TypeScript types for capas personalizadas (custom covers) API endpoints.
 */

import type { CustomerDevice } from './customers.types';

// ============================================================
// Status Types
// ============================================================

/**
 * Capa status values
 * 7 = No Carrinho de Produção
 */
export type CapaStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ============================================================
// Capa Personalizada
// ============================================================

/**
 * Capa Personalizada response from API
 */
export interface CapaPersonalizada {
    id: number;
    selected_product: string;
    product_reference: string | null;
    obs: string | null;
    photo_path: string | null;
    photo_url: string | null;
    qty: number;
    price: number | null;
    total: number | null;
    payed: boolean;
    payday: string | null;
    received_by?: {
        id: number;
        name: string;
    };
    received_by_id: number | null;
    sended_to_production_at: string | null;
    status: CapaStatus;
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
    created_at: string;
    updated_at: string;
}

/**
 * Request to create capa
 */
export interface CreateCapaRequest {
    customer_id: number;
    selected_product: string;
    product_reference?: string;
    store_id?: number;
    user_id?: number;
    customer_device_id?: number;
    obs?: string;
    qty?: number;
    price?: number;
    payed?: boolean;
    payday?: string;
    received_by_id?: number;
    status?: CapaStatus;
}

/**
 * Request to update capa
 */
export interface UpdateCapaRequest {
    customer_id?: number;
    selected_product?: string;
    product_reference?: string | null;
    customer_device_id?: number | null;
    obs?: string | null;
    qty?: number;
    price?: number | null;
    payed?: boolean;
    payday?: string | null;
    received_by_id?: number | null;
    status?: CapaStatus;
}

/**
 * Request to update capa status
 */
export interface UpdateCapaStatusRequest {
    status: CapaStatus;
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
export interface UpdateCapaStatusResponse {
    message: string;
    data: CapaPersonalizada;
    /** Resultado da notificação WhatsApp - só presente quando notify_whatsapp=true */
    whatsapp_notification?: WhatsAppNotificationResult;
}

/**
 * Request to bulk update capa status
 */
export interface BulkCapaStatusRequest {
    ids: number[];
    status: CapaStatus;
}

/**
 * Request to send capas to production
 */
export interface SendToProductionRequest {
    ids: number[];
    sended_to_production_at: string;
}

/**
 * Request to register payment
 */
export interface RegisterPaymentRequest {
    payed: boolean;
    payday?: string;
    received_by_id?: number;
}

/**
 * Photo upload response
 */
export interface PhotoUploadResponse {
    message: string;
    data: {
        photo_path: string;
        photo_url: string;
        size: number;
        mime: string;
    };
}

/**
 * Bulk status update response
 */
export interface BulkCapaStatusResponse {
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

/**
 * Upload token response for public upload
 */
export interface UploadTokenResponse {
    token: string;
    expires_at: string;
    upload_url: string;
}

/**
 * Public upload response
 */
export interface PublicUploadResponse {
    message: string;
    data: {
        photo_path: string;
        photo_url: string;
        size: number;
        mime: string;
    };
}

// ============================================================
// Filters
// ============================================================

/**
 * Valid sort fields for capas
 */
export type CapaSortField = 'id' | 'created_at' | 'updated_at' | 'status' | 'selected_product' | 'price' | 'qty' | 'payday' | 'sended_to_production_at' | 'store_id' | 'user_id';

/**
 * Capa list filters
 */
export interface CapaFilters {
    keyword?: string;                      // Busca em ID, produto, ref, obs, cliente
    status?: CapaStatus | CapaStatus[];    // Aceita múltiplos status
    store_id?: number;
    user_id?: number;
    customer_id?: number;
    initial_date?: string;                 // YYYY-MM-DD
    final_date?: string;                   // YYYY-MM-DD
    brand_id?: number;
    model_id?: number;
    payed?: 0 | 1;
    payday?: string;
    received_by_id?: number;
    page?: number;
    per_page?: number;
    sort?: CapaSortField;
    direction?: 'asc' | 'desc';
}

