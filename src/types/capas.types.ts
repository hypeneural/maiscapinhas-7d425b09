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
 */
export type CapaStatus = 1 | 2 | 3 | 4 | 5 | 6;

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
 * Capa list filters
 */
export interface CapaFilters {
    store_id?: number;
    user_id?: number;
    status?: CapaStatus;
    customer_id?: number;
    initial_date?: string;
    final_date?: string;
    brand_id?: number;
    model_id?: number;
    keyword?: string;
    payed?: 0 | 1;
    payday?: string;
    received_by_id?: number;
    page?: number;
    per_page?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
}
