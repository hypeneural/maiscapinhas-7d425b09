/**
 * Cash Service
 * 
 * Manages cash shifts and closings operations.
 */

import { apiGet, apiPost } from '@/lib/api';
import type {
    ApiResponse,
    PaginatedResponse,
    CashShift,
    CashShiftsFilters,
    PendingShiftsResponse,
    CashClosing,
    SubmitClosingRequest
} from '@/types/api';

/**
 * List cash shifts with filters
 */
export async function getCashShifts(filters: CashShiftsFilters = {}): Promise<PaginatedResponse<CashShift>> {
    return apiGet<PaginatedResponse<CashShift>>('/cash/shifts', filters);
}

/**
 * Get a single cash shift by ID
 */
export async function getCashShift(id: number): Promise<CashShift> {
    const response = await apiGet<ApiResponse<CashShift>>(`/cash/shifts/${id}`);
    return response.data;
}

/**
 * Create a new cash shift
 */
export async function createCashShift(data: {
    store_id: number;
    seller_id: number;
    date: string;
    shift_code: 'M' | 'T' | 'N';
}): Promise<CashShift> {
    const response = await apiPost<ApiResponse<CashShift>>('/cash/shifts', data);
    return response.data;
}

/**
 * Get pending shifts for conference
 */
export async function getPendingShifts(storeId?: number): Promise<PendingShiftsResponse> {
    const params = storeId ? { store_id: storeId } : {};
    const response = await apiGet<ApiResponse<PendingShiftsResponse>>('/cash/shifts/pending', params);
    return response.data;
}

/**
 * Get shifts with divergence
 */
export async function getDivergentShifts(storeId?: number): Promise<CashShift[]> {
    const params = storeId ? { store_id: storeId } : {};
    const response = await apiGet<ApiResponse<CashShift[]>>('/cash/shifts/divergent', params);
    return response.data;
}

/**
 * Get closing details for a shift
 */
export async function getCashClosing(shiftId: number): Promise<CashClosing> {
    const response = await apiGet<ApiResponse<CashClosing>>(`/cash/closings/${shiftId}`);
    return response.data;
}

/**
 * Submit a closing for review
 */
export async function submitClosing(shiftId: number, data: SubmitClosingRequest): Promise<CashClosing> {
    const response = await apiPost<ApiResponse<CashClosing>>(`/cash/closings/${shiftId}/submit`, data);
    return response.data;
}

/**
 * Approve a closing (conferente/gerente)
 */
export async function approveClosing(shiftId: number, notes?: string): Promise<CashClosing> {
    const response = await apiPost<ApiResponse<CashClosing>>(`/cash/closings/${shiftId}/approve`, { notes });
    return response.data;
}

/**
 * Reject a closing with reason
 */
export async function rejectClosing(shiftId: number, reason: string): Promise<CashClosing> {
    const response = await apiPost<ApiResponse<CashClosing>>(`/cash/closings/${shiftId}/reject`, { reason });
    return response.data;
}
