/**
 * Cash Shifts Service
 * 
 * API service for cash shift operations.
 */

import { apiGet, apiPost } from '@/lib/api';
import type {
    CashShift,
    CashShiftFilters,
    CashShiftListResponse,
    CashShiftDetailResponse,
    CreateCashShiftRequest,
    PendingShiftsResponse,
    DivergentShiftsResponse,
} from '@/types/conference.types';

const BASE_URL = '/cash/shifts';

/**
 * List cash shifts with optional filters
 */
export async function listCashShifts(
    filters?: CashShiftFilters
): Promise<CashShiftListResponse> {
    const params: Record<string, string | number> = {};

    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.date) params.date = filters.date;
    if (filters?.status) params.status = filters.status;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.page) params.page = filters.page;

    return apiGet<CashShiftListResponse>(BASE_URL, params);
}

/**
 * Get a single cash shift by ID
 */
export async function getCashShift(id: number): Promise<CashShiftDetailResponse> {
    return apiGet<CashShiftDetailResponse>(`${BASE_URL}/${id}`);
}

/**
 * Create a new cash shift
 */
export async function createCashShift(
    data: CreateCashShiftRequest
): Promise<CashShiftDetailResponse> {
    return apiPost<CashShiftDetailResponse>(BASE_URL, data);
}

/**
 * Get pending shifts (for conferentes)
 */
export async function getPendingShifts(
    storeId?: number
): Promise<{ data: PendingShiftsResponse }> {
    const params: Record<string, number> = {};
    if (storeId) params.store_id = storeId;

    return apiGet<{ data: PendingShiftsResponse }>(`${BASE_URL}/pending`, params);
}

/**
 * Get divergent shifts (for conferentes)
 */
export async function getDivergentShifts(
    storeId?: number
): Promise<{ data: DivergentShiftsResponse }> {
    const params: Record<string, number> = {};
    if (storeId) params.store_id = storeId;

    return apiGet<{ data: DivergentShiftsResponse }>(`${BASE_URL}/divergent`, params);
}

export const cashShiftsService = {
    list: listCashShifts,
    get: getCashShift,
    create: createCashShift,
    getPending: getPendingShifts,
    getDivergent: getDivergentShifts,
};
