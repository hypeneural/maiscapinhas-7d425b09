/**
 * Stores Service
 * 
 * Manages store operations.
 */

import { apiGet, apiUpload } from '@/lib/api';
import type {
    ApiResponse,
    Store,
    StoreSeller
} from '@/types/api';

/**
 * Get all stores accessible by current user
 */
export async function getStores(): Promise<Store[]> {
    const response = await apiGet<ApiResponse<Store[]>>('/stores');
    return response.data;
}

/**
 * Get a single store by ID
 */
export async function getStore(id: number): Promise<Store> {
    const response = await apiGet<ApiResponse<Store>>(`/stores/${id}`);
    return response.data;
}

/**
 * Get sellers for a store
 */
export async function getStoreSellers(storeId: number): Promise<StoreSeller[]> {
    const response = await apiGet<ApiResponse<StoreSeller[]>>(`/stores/${storeId}/sellers`);
    return response.data;
}

/**
 * Update store photo
 */
export async function updateStorePhoto(storeId: number, photo: File): Promise<Store> {
    return apiUpload<Store>(`/stores/${storeId}/photo`, photo, 'photo', 'PUT');
}
