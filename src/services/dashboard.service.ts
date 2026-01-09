/**
 * Dashboard Service
 * 
 * Fetches dashboard data for different user roles.
 * Each role has its own endpoint as per backend specification.
 */

import { apiGet } from '@/lib/api';
import type {
    ApiResponse,
    SellerDashboard,
    ConferenteDashboard,
    AdminDashboard
} from '@/types/api';

/**
 * Get seller's personal dashboard
 * Requires store_id as the backend needs context
 */
export async function getSellerDashboard(
    storeId?: number,
    date?: string
): Promise<SellerDashboard> {
    const params: Record<string, unknown> = {};
    if (storeId) params.store_id = storeId;
    if (date) params.date = date;

    const response = await apiGet<ApiResponse<SellerDashboard>>('/dashboard/vendedor', params);
    return response.data;
}

/**
 * Get conferente dashboard
 * Requires store_id as the backend needs context
 */
export async function getConferenteDashboard(
    storeId?: number,
    date?: string
): Promise<ConferenteDashboard> {
    const params: Record<string, unknown> = {};
    if (storeId) params.store_id = storeId;
    if (date) params.date = date;

    const response = await apiGet<ApiResponse<ConferenteDashboard>>('/dashboard/conferente', params);
    return response.data;
}

/**
 * Get admin consolidated dashboard
 * Shows all stores the admin/gerente has access to
 */
export async function getAdminDashboard(month?: string): Promise<AdminDashboard> {
    const params: Record<string, unknown> = {};
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<AdminDashboard>>('/dashboard/admin', params);
    return response.data;
}
