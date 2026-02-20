/**
 * Stores Service
 * 
 * Manages store operations.
 */

import { apiGet, apiUpload } from '@/lib/api';
import { getStoreGuid } from '@/lib/store-identifiers';
import type {
    ApiResponse,
    PaginatedResponse,
    Store,
    StoreSeller
} from '@/types/api';

/**
 * Public store data (minimal, accessible by any authenticated user)
 */
export interface PublicStore {
    id: number;
    guid?: string | null;
    uuid?: string | null;
    store_uuid?: string | null;
    loja_uuid?: string | null;
    name: string;
    city: string;
}

type StoreWithGuidFallback = Store & {
    guid?: string | null;
    uuid?: string | null;
    store_uuid?: string | null;
    loja_uuid?: string | null;
};

function normalizeStoreGuid<T extends { guid?: string | null }>(store: T): T {
    return {
        ...store,
        guid: getStoreGuid(store as unknown as { id: number; guid?: string | null; uuid?: string | null; store_uuid?: string | null; loja_uuid?: string | null }) ?? null,
    };
}

/**
 * Filters for public stores list
 */
export interface PublicStoreFilters {
    city?: string;
    search?: string;
    per_page?: number;
}

/**
 * Get all active stores (public list)
 * Any authenticated user can access this endpoint.
 * Returns only id, name, city - minimal data for selects/dropdowns.
 */
export async function getAllPublicStores(filters?: PublicStoreFilters): Promise<PaginatedResponse<PublicStore>> {
    const response = await apiGet<PaginatedResponse<PublicStore>>('/stores/all', filters);
    return {
        ...response,
        data: response.data.map((store) => normalizeStoreGuid(store)),
    };
}

/**
 * Get all stores accessible by current user
 */
export async function getStores(): Promise<Store[]> {
    const response = await apiGet<ApiResponse<StoreWithGuidFallback[]>>('/stores');
    const stores = response.data.map((store) => normalizeStoreGuid(store));

    const missingGuidStoreIds = stores
        .filter((store) => !store.guid)
        .map((store) => store.id);

    if (missingGuidStoreIds.length === 0) {
        return stores;
    }

    // Fallback for older API payloads that omit guid in /stores.
    try {
        const allStores = await getAllPublicStores({ per_page: 200 });
        const publicGuidByStoreId = new Map(
            allStores.data
                .map((store) => [store.id, getStoreGuid(store as unknown as { id: number; guid?: string | null; uuid?: string | null; store_uuid?: string | null; loja_uuid?: string | null })] as const)
                .filter((entry): entry is readonly [number, string] => entry[1] !== null)
        );

        return stores.map((store) => {
            if (store.guid) {
                return store;
            }

            return {
                ...store,
                guid: publicGuidByStoreId.get(store.id) ?? null,
            };
        });
    } catch {
        return stores;
    }
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
    return apiUpload<Store>(`/stores/${storeId}/photo`, photo, 'photo');
}
