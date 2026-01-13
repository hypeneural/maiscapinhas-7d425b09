/**
 * Capas Personalizadas Service
 * 
 * API service for capas personalizadas (custom covers) management.
 * Includes CRUD operations, status management, payment, and photo upload.
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiUpload, api } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    CapaPersonalizada,
    CapaFilters,
    CreateCapaRequest,
    UpdateCapaRequest,
    UpdateCapaStatusRequest,
    BulkCapaStatusRequest,
    BulkCapaStatusResponse,
    SendToProductionRequest,
    RegisterPaymentRequest,
    PhotoUploadResponse,
} from '@/types/capas.types';

// ============================================================
// Capa CRUD
// ============================================================

/**
 * List capas with optional filters
 */
export async function listCapas(
    filters?: CapaFilters
): Promise<PaginatedResponse<CapaPersonalizada>> {
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
    if (filters?.payed !== undefined) params.payed = filters.payed;
    if (filters?.payday) params.payday = filters.payday;
    if (filters?.received_by_id) params.received_by_id = filters.received_by_id;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.sort) params.sort = filters.sort;
    if (filters?.direction) params.direction = filters.direction;

    return apiGet<PaginatedResponse<CapaPersonalizada>>('/capas-personalizadas', params);
}

/**
 * Get a single capa by ID
 */
export async function getCapa(id: number): Promise<CapaPersonalizada> {
    const response = await apiGet<ApiResponse<CapaPersonalizada>>(
        `/capas-personalizadas/${id}`
    );
    return response.data;
}

/**
 * Create a new capa
 */
export async function createCapa(data: CreateCapaRequest): Promise<CapaPersonalizada> {
    const response = await apiPost<ApiResponse<CapaPersonalizada>>(
        '/capas-personalizadas',
        data
    );
    return response.data;
}

/**
 * Update an existing capa
 */
export async function updateCapa(
    id: number,
    data: UpdateCapaRequest
): Promise<CapaPersonalizada> {
    const response = await apiPatch<ApiResponse<CapaPersonalizada>>(
        `/capas-personalizadas/${id}`,
        data
    );
    return response.data;
}

/**
 * Delete a capa
 */
export async function deleteCapa(id: number): Promise<void> {
    await apiDelete(`/capas-personalizadas/${id}`);
}

// ============================================================
// Status Management
// ============================================================

/**
 * Update capa status (single)
 */
export async function updateStatus(
    id: number,
    data: UpdateCapaStatusRequest
): Promise<CapaPersonalizada> {
    const response = await apiPatch<ApiResponse<CapaPersonalizada>>(
        `/capas-personalizadas/${id}/status`,
        data
    );
    return response.data;
}

/**
 * Bulk update capa status (Admin only)
 */
export async function bulkUpdateStatus(
    data: BulkCapaStatusRequest
): Promise<BulkCapaStatusResponse> {
    const response = await apiPost<BulkCapaStatusResponse>(
        '/capas-personalizadas/bulk-status',
        data
    );
    return response;
}

/**
 * Send capas to production (Admin only)
 * Automatically sets status to 6 (Enviado para Produção)
 */
export async function sendToProduction(
    data: SendToProductionRequest
): Promise<BulkCapaStatusResponse> {
    const response = await apiPost<BulkCapaStatusResponse>(
        '/capas-personalizadas/send-to-production',
        data
    );
    return response;
}

// ============================================================
// Payment Management
// ============================================================

/**
 * Register payment for a capa
 */
export async function registerPayment(
    id: number,
    data: RegisterPaymentRequest
): Promise<CapaPersonalizada> {
    const response = await apiPatch<ApiResponse<CapaPersonalizada>>(
        `/capas-personalizadas/${id}/payment`,
        data
    );
    return response.data;
}

// ============================================================
// Photo Management
// ============================================================

/**
 * Upload photo for a capa
 */
export async function uploadPhoto(
    id: number,
    file: File
): Promise<PhotoUploadResponse> {
    const response = await apiUpload<{ message: string; data: PhotoUploadResponse['data'] }>(
        `/capas-personalizadas/${id}/photo`,
        file,
        'file'
    );
    return { message: response.message, data: response.data };
}

/**
 * Remove photo from a capa
 */
export async function removePhoto(id: number): Promise<void> {
    await apiDelete(`/capas-personalizadas/${id}/photo`);
}

// ============================================================
// Public Upload (Token-based)
// ============================================================

import type { UploadTokenResponse, PublicUploadResponse } from '@/types/capas.types';

/**
 * Generate upload token for public photo upload
 * Token expires in 5 minutes
 */
export async function generateUploadToken(id: number): Promise<UploadTokenResponse> {
    const response = await apiPost<{ message: string; data: UploadTokenResponse }>(
        `/capas-personalizadas/${id}/gerar-token-upload`,
        {}
    );
    return response.data;
}

/**
 * Upload photo publicly (no auth required)
 * Uses token for authentication
 */
export async function uploadPublic(
    id: number,
    file: File,
    token: string
): Promise<PublicUploadResponse> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('token', token);

    const baseUrl = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${baseUrl}/capas-personalizadas/${id}/upload-publico`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar foto');
    }

    return response.json();
}

// ============================================================
// Service Object
// ============================================================

export const capasService = {
    list: listCapas,
    get: getCapa,
    create: createCapa,
    update: updateCapa,
    delete: deleteCapa,
    updateStatus,
    bulkUpdateStatus,
    sendToProduction,
    registerPayment,
    uploadPhoto,
    removePhoto,
    generateUploadToken,
    uploadPublic,
};

export default capasService;
