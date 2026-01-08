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
