import { apiGet } from '@/lib/api';
import type {
    PdvSyncFilters,
    PdvSyncResponse,
    PdvMetricsResponse,
    PdvSyncDebugFilters,
    PdvSyncDebugListResponse,
    PdvSyncDebugDetailResponse,
    PdvSyncDebugFilterOptionsResponse,
} from '@/types/pdv-sync.types';

export const getPdvSyncs = async (filters: PdvSyncFilters): Promise<PdvSyncResponse> => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
        }
    });

    const response = await apiGet<PdvSyncResponse>(`/admin/pdv/syncs?${params.toString()}`);
    return response;
};

export const getPdvMetrics = async (minutesWithoutSync?: number): Promise<PdvMetricsResponse> => {
    const params = new URLSearchParams();
    if (minutesWithoutSync) {
        params.append('minutes_without_sync', minutesWithoutSync.toString());
    }

    const response = await apiGet<PdvMetricsResponse>(`/admin/pdv/syncs/metrics?${params.toString()}`);
    return response;
};

export const getPdvSyncDebugList = async (filters: PdvSyncDebugFilters): Promise<PdvSyncDebugListResponse> => {
    const response = await apiGet<PdvSyncDebugListResponse>('/admin/pdv/syncs/debug', filters);
    return response;
};

export const getPdvSyncDebugFilters = async (
    params?: { from?: string; to?: string }
): Promise<PdvSyncDebugFilterOptionsResponse> => {
    const response = await apiGet<PdvSyncDebugFilterOptionsResponse>('/admin/pdv/syncs/debug/filters', params);
    return response;
};

export const getPdvSyncDebugDetail = async (
    syncId: number,
    params?: { include_raw?: boolean; include_decoded?: boolean }
): Promise<PdvSyncDebugDetailResponse> => {
    const normalizedParams = params
        ? {
            ...params,
            include_raw:
                params.include_raw === undefined ? undefined : params.include_raw ? 1 : 0,
            include_decoded:
                params.include_decoded === undefined ? undefined : params.include_decoded ? 1 : 0,
        }
        : undefined;

    const response = await apiGet<PdvSyncDebugDetailResponse>(
        `/admin/pdv/syncs/${syncId}/debug`,
        normalizedParams
    );
    return response;
};
