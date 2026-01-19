/**
 * Celebrations Service
 * 
 * API calls for the celebrations module.
 */

import { apiGet } from '@/lib/api';
import type {
    CelebrationsResponse,
    CelebrationsParams,
    CelebrationsMonthResponse,
    CelebrationsMonthParams,
    CelebrationsUpcomingResponse,
    CelebrationsUpcomingParams,
    CelebrationsTodayResponse,
} from '@/types/celebrations.types';

const BASE_URL = '/celebrations';

// ============================================================
// List with filters (for table)
// ============================================================

/**
 * Get celebrations list with filters, pagination, and sorting
 */
export async function getCelebrations(
    params: CelebrationsParams = {}
): Promise<CelebrationsResponse> {
    const queryParams: Record<string, unknown> = {};

    if (params.store_id) queryParams.store_id = params.store_id;
    if (params.type) queryParams.type = params.type;
    if (params.month) queryParams.month = params.month;
    if (params.status) queryParams.status = params.status;
    if (params.keyword) queryParams.keyword = params.keyword;
    if (params.sort) queryParams.sort = params.sort;
    if (params.direction) queryParams.direction = params.direction;
    if (params.per_page) queryParams.per_page = params.per_page;
    if (params.page) queryParams.page = params.page;

    const response = await apiGet<CelebrationsResponse>(BASE_URL, queryParams);
    return response;
}

// ============================================================
// Month view
// ============================================================

/**
 * Get celebrations for a specific month
 */
export async function getCelebrationsMonth(
    params: CelebrationsMonthParams = {}
): Promise<CelebrationsMonthResponse> {
    const queryParams: Record<string, unknown> = {};

    if (params.month) queryParams.month = params.month;
    if (params.year) queryParams.year = params.year;
    if (params.store_id) queryParams.store_id = params.store_id;
    if (params.type) queryParams.type = params.type;

    const response = await apiGet<CelebrationsMonthResponse>(
        `${BASE_URL}/month`,
        queryParams
    );
    return response;
}

// ============================================================
// Upcoming (widget)
// ============================================================

/**
 * Get upcoming celebrations for dashboard widget
 */
export async function getCelebrationsUpcoming(
    params: CelebrationsUpcomingParams = {}
): Promise<CelebrationsUpcomingResponse> {
    const queryParams: Record<string, unknown> = {};

    if (params.limit) queryParams.limit = params.limit;
    if (params.days) queryParams.days = params.days;
    if (params.store_id) queryParams.store_id = params.store_id;

    const response = await apiGet<CelebrationsUpcomingResponse>(
        `${BASE_URL}/upcoming`,
        queryParams
    );
    return response;
}

// ============================================================
// Today (highlights)
// ============================================================

/**
 * Get today's celebrations with messages
 */
export async function getCelebrationsToday(): Promise<CelebrationsTodayResponse> {
    const response = await apiGet<CelebrationsTodayResponse>(`${BASE_URL}/today`);
    return response;
}
