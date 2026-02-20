import { apiGet } from '@/lib/api';
import type { PdvSyncFilters, PdvSyncResponse, PdvMetrics, PdvMetricsResponse } from '@/types/pdv-sync.types';

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
