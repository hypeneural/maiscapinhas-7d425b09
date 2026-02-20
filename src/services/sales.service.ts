/**
 * Sales Service
 * 
 * Manages sales CRUD operations.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type {
    ApiResponse,
    PaginatedResponse,
    Sale,
    SalesFilters,
    CreateSaleRequest
} from '@/types/api';

/**
 * List sales with filters and pagination
 */
export async function getSales(filters: SalesFilters = {}): Promise<PaginatedResponse<Sale>> {
    return apiGet<PaginatedResponse<Sale>>('/sales', filters);
}

/**
 * Get a single sale by ID
 */
export async function getSale(id: number): Promise<Sale> {
    const response = await apiGet<ApiResponse<Sale>>(`/sales/${id}`);
    return response.data;
}

/**
 * Create a new sale
 */
export async function createSale(data: CreateSaleRequest): Promise<Sale> {
    const response = await apiPost<ApiResponse<Sale>>('/sales', data);
    return response.data;
}

/**
 * Update an existing sale (gerente+ only)
 */
export async function updateSale(id: number, data: Partial<CreateSaleRequest>): Promise<Sale> {
    const response = await apiPut<ApiResponse<Sale>>(`/sales/${id}`, data);
    return response.data;
}

/**
 * Delete a sale (admin only)
 */
export async function deleteSale(id: number): Promise<void> {
    await apiDelete(`/sales/${id}`);
}

/**
 * Validate sale(s) against the database.
 * - source=erp: pass operation_ids (UUID string, comma-separated for multiple)
 * - source=payload: pass payload (raw JSON string of the operation)
 */
export async function validateSale(params: {
    source: 'erp' | 'payload';
    operation_ids?: string;
    payload?: string;
    connection_id?: number;
}): Promise<any> {
    const response = await apiPost<any>('/pdv/sales/validate', {
        ...params,
        timezone: 'America/Sao_Paulo',
    });
    return response;
}

/**
 * Validate a batch of sales from JSON payload against the database
 */
export async function validateSaleBatch(payload: any): Promise<any> {
    const response = await apiPost<any>('/pdv/sales/validate-batch', {
        timezone: 'America/Sao_Paulo',
        ...payload
    });
    return response;
}

/**
 * Validate a batch of closure/turno data against the database
 */
export async function validateClosureBatch(payload: any): Promise<any> {
    const response = await apiPost<any>('/pdv/closures/validate-batch', {
        timezone: 'America/Sao_Paulo',
        ...payload
    });
    return response;
}

/**
 * Compare closure detail: ERP Online × Local Database
 *
 * Fetches detailed closure data from Hiper ERP and compares
 * side-by-side with local unified data.
 */
export async function compareClosureDetail(params: {
    turno_id: string;
    closure_uuid: string;
    connection_id?: number;
}): Promise<any> {
    const response = await apiPost<any>('/pdv/closures/compare-detail', params);
    return response;
}
