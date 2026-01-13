/**
 * Announcements Service
 * 
 * API client methods for the Internal Communication System (Comunicados).
 * Follows existing service patterns in the project.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    AnnouncementSummary,
    AnnouncementDetail,
    ActiveAnnouncementsResponse,
    ActiveAnnouncementsParams,
    AnnouncementFilters,
    CreateAnnouncementPayload,
    UpdateAnnouncementPayload,
    AnnouncementActionResponse,
    PublishAnnouncementResponse,
    ArchiveAnnouncementResponse,
    RepublishAnnouncementResponse,
    AnnouncementStats,
    AnnouncementReceiptItem,
    AnnouncementReceiptsFilters,
} from '@/types/announcements.types';

// ============================================================
// User Endpoints (for receiving announcements)
// ============================================================

/**
 * Get active announcements for the current user (dashboard)
 * Separated into critical (modals) and banners (carousel)
 */
export async function getActiveAnnouncements(
    params?: ActiveAnnouncementsParams
): Promise<ActiveAnnouncementsResponse> {
    const response = await apiGet<ApiResponse<ActiveAnnouncementsResponse>>(
        '/me/announcements/active',
        params || {}
    );
    return response.data;
}

/**
 * Get user's announcement history
 */
export async function getAnnouncementHistory(
    filters?: AnnouncementFilters
): Promise<PaginatedResponse<AnnouncementSummary>> {
    const response = await apiGet<PaginatedResponse<AnnouncementSummary>>(
        '/me/announcements',
        filters || {}
    );
    return response;
}

/**
 * Mark announcement as seen (called when user opens modal/reads)
 */
export async function markAnnouncementSeen(
    id: number,
    storeId?: number
): Promise<AnnouncementActionResponse> {
    const response = await apiPost<ApiResponse<AnnouncementActionResponse>>(
        `/announcements/${id}/seen`,
        { store_id: storeId }
    );
    return response.data;
}

/**
 * Acknowledge announcement (required for advertências)
 */
export async function acknowledgeAnnouncement(
    id: number,
    storeId?: number
): Promise<AnnouncementActionResponse> {
    const response = await apiPost<ApiResponse<AnnouncementActionResponse>>(
        `/announcements/${id}/ack`,
        { store_id: storeId }
    );
    return response.data;
}

/**
 * Dismiss announcement (removes from carousel, only if require_ack=false)
 */
export async function dismissAnnouncement(
    id: number,
    storeId?: number
): Promise<AnnouncementActionResponse> {
    const response = await apiPost<ApiResponse<AnnouncementActionResponse>>(
        `/announcements/${id}/dismiss`,
        { store_id: storeId }
    );
    return response.data;
}

// ============================================================
// Admin Endpoints (for managing announcements)
// ============================================================

/**
 * List all announcements (admin view)
 */
export async function listAnnouncements(
    filters?: AnnouncementFilters
): Promise<PaginatedResponse<AnnouncementDetail>> {
    const response = await apiGet<PaginatedResponse<AnnouncementDetail>>(
        '/announcements',
        filters || {}
    );
    return response;
}

/**
 * Get single announcement details
 */
export async function getAnnouncement(id: number): Promise<AnnouncementDetail> {
    const response = await apiGet<ApiResponse<AnnouncementDetail>>(
        `/announcements/${id}`
    );
    return response.data;
}

/**
 * Create new announcement (starts as draft)
 */
export async function createAnnouncement(
    data: CreateAnnouncementPayload
): Promise<AnnouncementDetail> {
    const response = await apiPost<ApiResponse<AnnouncementDetail>>(
        '/announcements',
        data
    );
    return response.data;
}

/**
 * Update announcement
 */
export async function updateAnnouncement(
    id: number,
    data: UpdateAnnouncementPayload
): Promise<AnnouncementDetail> {
    const response = await apiPut<ApiResponse<AnnouncementDetail>>(
        `/announcements/${id}`,
        data
    );
    return response.data;
}

/**
 * Delete announcement (soft delete)
 */
export async function deleteAnnouncement(id: number): Promise<void> {
    await apiDelete(`/announcements/${id}`);
}

/**
 * Publish announcement (draft -> active/scheduled)
 */
export async function publishAnnouncement(
    id: number
): Promise<PublishAnnouncementResponse> {
    const response = await apiPost<ApiResponse<PublishAnnouncementResponse>>(
        `/announcements/${id}/publish`,
        {}
    );
    return response.data;
}

/**
 * Archive announcement (removes from all views)
 */
export async function archiveAnnouncement(
    id: number
): Promise<ArchiveAnnouncementResponse> {
    const response = await apiPost<ApiResponse<ArchiveAnnouncementResponse>>(
        `/announcements/${id}/archive`,
        {}
    );
    return response.data;
}

/**
 * Republish an archived/expired announcement
 */
export async function republishAnnouncement(
    id: number
): Promise<RepublishAnnouncementResponse> {
    const response = await apiPost<ApiResponse<RepublishAnnouncementResponse>>(
        `/announcements/${id}/republish`,
        {}
    );
    return response.data;
}

/**
 * Duplicate an announcement (creates new draft copy)
 */
export async function duplicateAnnouncement(
    id: number
): Promise<AnnouncementDetail> {
    const response = await apiPost<ApiResponse<{ announcement: AnnouncementDetail }>>(
        `/announcements/${id}/duplicate`,
        {}
    );
    return response.data.announcement;
}

/**
 * Get announcement statistics
 */
export async function getAnnouncementStats(
    id: number
): Promise<AnnouncementStats> {
    const response = await apiGet<ApiResponse<AnnouncementStats>>(
        `/announcements/${id}/stats`
    );
    return response.data;
}

/**
 * Get announcement receipts (who received/read)
 */
export async function getAnnouncementReceipts(
    id: number,
    filters?: AnnouncementReceiptsFilters
): Promise<PaginatedResponse<AnnouncementReceiptItem>> {
    return apiGet<PaginatedResponse<AnnouncementReceiptItem>>(
        `/announcements/${id}/receipts`,
        filters || {}
    );
}

// ============================================================
// Export all
// ============================================================

export const announcementsService = {
    // User endpoints
    getActive: getActiveAnnouncements,
    getHistory: getAnnouncementHistory,
    markSeen: markAnnouncementSeen,
    acknowledge: acknowledgeAnnouncement,
    dismiss: dismissAnnouncement,
    // Admin endpoints
    list: listAnnouncements,
    get: getAnnouncement,
    create: createAnnouncement,
    update: updateAnnouncement,
    delete: deleteAnnouncement,
    publish: publishAnnouncement,
    archive: archiveAnnouncement,
    republish: republishAnnouncement,
    duplicate: duplicateAnnouncement,
    getStats: getAnnouncementStats,
    getReceipts: getAnnouncementReceipts,
};
