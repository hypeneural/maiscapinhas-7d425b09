import { apiGet, apiPost, apiDelete } from '@/lib/api';
import type {
    StoreMapping,
    StoreMappingPayload,
    UserMapping,
    UserMappingPayload,
    BulkUserMappingPayload,
    UserSuggestion,
    PdvMappingFilters,
    PdvMappingResponse
} from '@/types/pdv-mapping.types';
import { ApiResponse } from '@/types/api';

const BASE_URL = '/admin/pdv/mappings';

// --- Store Mappings ---

export const getPdvStores = async (): Promise<ApiResponse<StoreMapping[]>> => {
    return apiGet<ApiResponse<StoreMapping[]>>(`${BASE_URL}/stores`);
};

export const updateStoreMapping = async (payload: StoreMappingPayload): Promise<StoreMappingResponse> => {
    return apiPost<StoreMappingResponse>(`${BASE_URL}/stores`, payload);
};

// --- User Mappings ---

export const getPdvUserMappings = async (filters: PdvMappingFilters): Promise<PdvMappingResponse<UserMapping>> => {
    const params = new URLSearchParams();
    if (filters.store_id) params.append('store_id', filters.store_id.toString());
    if (filters.pdv_store_id) params.append('pdv_store_id', filters.pdv_store_id.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.search) params.append('search', filters.search);

    return (await apiGet<PdvMappingResponse<UserMapping>>(`${BASE_URL}/users?${params.toString()}`));
};

export const createPdvUserMapping = async (payload: UserMappingPayload): Promise<ApiResponse<UserMapping>> => {
    return apiPost<ApiResponse<UserMapping>>(`${BASE_URL}/users`, payload);
};

export const bulkCreatePdvUserMappings = async (payload: BulkUserMappingPayload): Promise<ApiResponse<{ count: number, message: string }>> => {
    return apiPost<ApiResponse<{ count: number, message: string }>>(`${BASE_URL}/users/bulk`, payload);
};

export const deletePdvUserMapping = async (id: number): Promise<void> => {
    await apiDelete(`${BASE_URL}/users/${id}`);
};

// --- Suggestions ---

export const getPdvUserSuggestions = async (): Promise<ApiResponse<UserSuggestion[]>> => {
    return apiGet<ApiResponse<UserSuggestion[]>>(`${BASE_URL}/users/suggestions`);
};
