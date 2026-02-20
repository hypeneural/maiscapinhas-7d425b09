/**
 * Cash Closings Service
 * 
 * API service for cash closing workflow operations.
 */

import { apiGet, apiPost, apiPut } from '@/lib/api';
import type {
    CashClosing,
    CashClosingDetailResponse,
    CreateClosingRequest,
    UpdateClosingRequest,
    RejectClosingRequest,
    CashIntegrityReportResponse,
    SmartFiltersResponse,
} from '@/types/conference.types';

const BASE_URL = '/cash/closings';

/**
 * Get closing details for a shift
 */
export async function getClosing(shiftId: number): Promise<CashClosingDetailResponse> {
    return apiGet<CashClosingDetailResponse>(`${BASE_URL}/${shiftId}`);
}

/**
 * Create a new closing for a shift (with lines)
 */
export async function createClosing(
    shiftId: number,
    data: CreateClosingRequest
): Promise<CashClosingDetailResponse> {
    return apiPost<CashClosingDetailResponse>(`${BASE_URL}/${shiftId}`, data);
}

/**
 * Update an existing closing (draft/rejected status only)
 */
export async function updateClosing(
    shiftId: number,
    data: UpdateClosingRequest
): Promise<CashClosingDetailResponse> {
    return apiPut<CashClosingDetailResponse>(`${BASE_URL}/${shiftId}`, data);
}

/**
 * Submit closing for approval
 */
export async function submitClosing(shiftId: number): Promise<CashClosingDetailResponse> {
    return apiPost<CashClosingDetailResponse>(`${BASE_URL}/${shiftId}/submit`, {});
}

/**
 * Approve a submitted closing (conferente/gerente/admin)
 */
export async function approveClosing(shiftId: number): Promise<CashClosingDetailResponse> {
    return apiPost<CashClosingDetailResponse>(`${BASE_URL}/${shiftId}/approve`, {});
}

/**
 * Reject a submitted closing with reason
 */
export async function rejectClosing(
    shiftId: number,
    data: RejectClosingRequest
): Promise<CashClosingDetailResponse> {
    return apiPost<CashClosingDetailResponse>(`${BASE_URL}/${shiftId}/reject`, data);
}

/**
 * Get cash integrity report for a store/month
 */
export async function getCashIntegrityReport(
    storeId: number,
    month: string
): Promise<CashIntegrityReportResponse> {
    return apiGet<CashIntegrityReportResponse>('/reports/cash-integrity', {
        store_id: storeId,
        month,
    });
}

/**
 * Get PDV closure data (real-time integration)
 */
export async function getPdvClosureData(
    storeId: number,
    date: string,
    shiftCode: string
): Promise<any> { // Using any for now or specific response type if imported
    return apiGet<any>('/cash/pdv-closure-data', {
        store_id: storeId,
        date,
        shift_code: shiftCode,
    });
}



/**
 * Get closure filters (stores -> dates -> shifts -> sellers)
 */
export async function getClosureFilters(
    storeId?: number,
    date?: string,
    shiftCode?: string
): Promise<SmartFiltersResponse> {
    const params: Record<string, any> = {};
    if (storeId) params.store_id = storeId;
    if (date) params.date = date;
    if (shiftCode) params.shift_code = shiftCode;

    return apiGet<SmartFiltersResponse>('/cash/closure-filters', params);
}

export const cashClosingsService = {
    get: getClosing,
    create: createClosing,
    update: updateClosing,
    submit: submitClosing,
    approve: approveClosing,
    reject: rejectClosing,
    getReport: getCashIntegrityReport,

    getPdvClosureData: getPdvClosureData,
    getFilters: getClosureFilters,
};
