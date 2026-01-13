/**
 * Phone Catalog Service
 * 
 * API service for phone brands and models management.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    PhoneBrand,
    PhoneModel,
    PhoneBrandFilters,
    PhoneModelFilters,
    CreatePhoneBrandRequest,
    UpdatePhoneBrandRequest,
    CreatePhoneModelRequest,
    UpdatePhoneModelRequest,
} from '@/types/customers.types';

// ============================================================
// Phone Brands
// ============================================================

/**
 * List phone brands with optional filters
 */
export async function listBrands(
    filters?: PhoneBrandFilters
): Promise<PaginatedResponse<PhoneBrand>> {
    const params: Record<string, unknown> = {};

    if (filters?.search) params.search = filters.search;
    if (filters?.slug) params.slug = filters.slug;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.per_page = filters.per_page;

    return apiGet<PaginatedResponse<PhoneBrand>>('/phone-brands', params);
}

/**
 * Get a single phone brand by ID
 */
export async function getBrand(id: number): Promise<PhoneBrand> {
    const response = await apiGet<ApiResponse<PhoneBrand>>(`/phone-brands/${id}`);
    return response.data;
}

/**
 * Create a new phone brand (Admin only)
 */
export async function createBrand(data: CreatePhoneBrandRequest): Promise<PhoneBrand> {
    const response = await apiPost<ApiResponse<PhoneBrand>>('/phone-brands', data);
    return response.data;
}

/**
 * Update a phone brand (Admin only)
 */
export async function updateBrand(
    id: number,
    data: UpdatePhoneBrandRequest
): Promise<PhoneBrand> {
    const response = await apiPut<ApiResponse<PhoneBrand>>(`/phone-brands/${id}`, data);
    return response.data;
}

/**
 * Delete a phone brand (Admin only)
 */
export async function deleteBrand(id: number): Promise<void> {
    await apiDelete(`/phone-brands/${id}`);
}

// ============================================================
// Phone Models
// ============================================================

/**
 * List phone models with optional filters
 */
export async function listModels(
    filters?: PhoneModelFilters
): Promise<PaginatedResponse<PhoneModel>> {
    const params: Record<string, unknown> = {};

    if (filters?.search) params.search = filters.search;
    if (filters?.brand_id) params.brand_id = filters.brand_id;
    if (filters?.form_factor) params.form_factor = filters.form_factor;
    if (filters?.release_year) params.release_year = filters.release_year;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.per_page = filters.per_page;

    return apiGet<PaginatedResponse<PhoneModel>>('/phone-models', params);
}

/**
 * Get a single phone model by ID
 */
export async function getModel(id: number): Promise<PhoneModel> {
    const response = await apiGet<ApiResponse<PhoneModel>>(`/phone-models/${id}`);
    return response.data;
}

/**
 * Create a new phone model (Admin only)
 */
export async function createModel(data: CreatePhoneModelRequest): Promise<PhoneModel> {
    const response = await apiPost<ApiResponse<PhoneModel>>('/phone-models', data);
    return response.data;
}

/**
 * Update a phone model (Admin only)
 */
export async function updateModel(
    id: number,
    data: UpdatePhoneModelRequest
): Promise<PhoneModel> {
    const response = await apiPut<ApiResponse<PhoneModel>>(`/phone-models/${id}`, data);
    return response.data;
}

/**
 * Delete a phone model (Admin only)
 */
export async function deleteModel(id: number): Promise<void> {
    await apiDelete(`/phone-models/${id}`);
}

// ============================================================
// Service Object
// ============================================================

export const phoneCatalogService = {
    // Brands
    listBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    // Models
    listModels,
    getModel,
    createModel,
    updateModel,
    deleteModel,
};

export default phoneCatalogService;
