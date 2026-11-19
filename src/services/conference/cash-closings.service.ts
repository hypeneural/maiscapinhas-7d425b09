/**
 * Cash Closings Service
 * 
 * API service for cash closing workflow operations.
 */

import { apiGet, apiPost, apiPut } from '@/lib/api';
import { apiUpload, apiDelete } from '@/lib/api/client';
import type {
    CashClosing,
    CashClosingDetailResponse,
    CashClosingAttachment,
    CreateClosingRequest,
    UpdateClosingRequest,
    RejectClosingRequest,
    CashIntegrityReportResponse,
    SmartFiltersResponse,
    ConferencePendingTurnsResponse,
    PdvClosureDataResponse,
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
): Promise<PdvClosureDataResponse> {
    return apiGet<PdvClosureDataResponse>('/cash/pdv-closure-data', {
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
    const params: Record<string, string | number> = {};
    if (storeId) params.store_id = storeId;
    if (date) params.date = date;
    if (shiftCode) params.shift_code = shiftCode;

    return apiGet<SmartFiltersResponse>('/cash/closure-filters', params);
}

interface ConferencePendingFilters {
    store_id?: number;
    date?: string;
    shift_code?: string;
    limit?: number;
}

/**
 * Get pending conference turns (closed/unified and not yet conferenced)
 */
export async function getConferencePendingTurns(
    filters?: ConferencePendingFilters
): Promise<ConferencePendingTurnsResponse> {
    const params: Record<string, string | number> = {};
    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.date) params.date = filters.date;
    if (filters?.shift_code) params.shift_code = filters.shift_code;
    if (filters?.limit) params.limit = filters.limit;

    return apiGet<ConferencePendingTurnsResponse>('/cash/conference-pending-turns', params);
}

/**
 * Upload attachment to a closing
 */
export async function uploadAttachment(
    shiftId: number,
    file: File
): Promise<{ data: CashClosingAttachment }> {
    return apiUpload<{ data: CashClosingAttachment }>(`${BASE_URL}/${shiftId}/attachments`, file, 'file');
}

/**
 * Delete attachment from a closing
 */
export async function deleteClosingAttachment(
    shiftId: number,
    attachmentId: number
): Promise<{ data: { message: string } }> {
    return apiDelete<{ data: { message: string } }>(`${BASE_URL}/${shiftId}/attachments/${attachmentId}`);
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
    getConferencePendingTurns: getConferencePendingTurns,

    uploadAttachment,
    deleteAttachment: deleteClosingAttachment,
};
