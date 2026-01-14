/**
 * WhatsApp Instances Service
 * 
 * API service for WhatsApp instance management via Evolution API.
 * Super Admin only - requires is_super_admin = true.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    WhatsAppInstanceResponse,
    CreateWhatsAppInstanceRequest,
    UpdateWhatsAppInstanceRequest,
    WhatsAppInstanceFilters,
    InstanceStateResponse,
    InstanceConnectResponse,
    InstanceTestResponse,
    InstanceSecretResponse,
} from '@/types/whatsapp-instances.types';

// ============================================================
// Base URL
// ============================================================

const BASE_URL = '/admin/whatsapp/instances';

// ============================================================
// Instance CRUD
// ============================================================

/**
 * List all WhatsApp instances with optional filters
 */
export async function listInstances(
    filters?: WhatsAppInstanceFilters
): Promise<PaginatedResponse<WhatsAppInstanceResponse>> {
    const params: Record<string, unknown> = {};

    if (filters?.search) params.search = filters.search;
    if (filters?.scope) params.scope = filters.scope;
    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.user_id) params.user_id = filters.user_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.is_active !== undefined) params.is_active = filters.is_active;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.page) params.page = filters.page;

    return apiGet<PaginatedResponse<WhatsAppInstanceResponse>>(BASE_URL, params);
}

/**
 * Get a single WhatsApp instance by ID
 */
export async function getInstance(id: number): Promise<WhatsAppInstanceResponse> {
    const response = await apiGet<ApiResponse<WhatsAppInstanceResponse>>(`${BASE_URL}/${id}`);
    return response.data;
}

/**
 * Create a new WhatsApp instance
 */
export async function createInstance(
    data: CreateWhatsAppInstanceRequest
): Promise<WhatsAppInstanceResponse> {
    const response = await apiPost<ApiResponse<WhatsAppInstanceResponse>>(BASE_URL, data);
    return response.data;
}

/**
 * Update an existing WhatsApp instance
 */
export async function updateInstance(
    id: number,
    data: UpdateWhatsAppInstanceRequest
): Promise<WhatsAppInstanceResponse> {
    const response = await apiPut<ApiResponse<WhatsAppInstanceResponse>>(`${BASE_URL}/${id}`, data);
    return response.data;
}

/**
 * Delete a WhatsApp instance (soft delete)
 */
export async function deleteInstance(id: number): Promise<void> {
    await apiDelete(`${BASE_URL}/${id}`);
}

// ============================================================
// Instance Actions
// ============================================================

/**
 * Set an instance as the default/favorite for its scope
 */
export async function setDefault(id: number): Promise<WhatsAppInstanceResponse> {
    const response = await apiPost<ApiResponse<WhatsAppInstanceResponse>>(
        `${BASE_URL}/${id}/set-default`
    );
    return response.data;
}

/**
 * Clear the API key from an instance
 */
export async function clearApiKey(id: number): Promise<InstanceSecretResponse> {
    const response = await apiDelete<ApiResponse<InstanceSecretResponse>>(
        `${BASE_URL}/${id}/secrets/api-key`
    );
    return response.data;
}

/**
 * Clear the token from an instance
 */
export async function clearToken(id: number): Promise<InstanceSecretResponse> {
    const response = await apiDelete<ApiResponse<InstanceSecretResponse>>(
        `${BASE_URL}/${id}/secrets/token`
    );
    return response.data;
}

// ============================================================
// Connection & Status
// ============================================================

/**
 * Check the connection state of an instance
 */
export async function checkState(id: number): Promise<InstanceStateResponse> {
    const response = await apiGet<ApiResponse<InstanceStateResponse>>(
        `${BASE_URL}/${id}/state`
    );
    return response.data;
}

/**
 * Get QR code data for connecting WhatsApp
 */
export async function getConnectQR(id: number): Promise<InstanceConnectResponse> {
    const response = await apiGet<ApiResponse<InstanceConnectResponse>>(
        `${BASE_URL}/${id}/connect`
    );
    return response.data;
}

/**
 * Test the connection to the Evolution API server
 */
export async function testConnection(id: number): Promise<InstanceTestResponse> {
    const response = await apiPost<ApiResponse<InstanceTestResponse>>(
        `${BASE_URL}/${id}/test`
    );
    return response.data;
}

// ============================================================
// Service Object Export
// ============================================================

/**
 * WhatsApp Instances Service object for easy importing
 */
export const whatsAppInstancesService = {
    // CRUD
    list: listInstances,
    get: getInstance,
    create: createInstance,
    update: updateInstance,
    delete: deleteInstance,
    // Actions
    setDefault,
    clearApiKey,
    clearToken,
    // Connection
    checkState,
    getConnectQR,
    testConnection,
};

export default whatsAppInstancesService;
