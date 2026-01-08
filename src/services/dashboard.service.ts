/**
 * Dashboard Service
 * 
 * Fetches dashboard data for different user roles.
 */

import { apiGet } from '@/lib/api';
import type {
    ApiResponse,
    SellerDashboard,
    StoreDashboard,
    AdminDashboard
} from '@/types/api';

/**
 * Get seller's personal dashboard
 */
export async function getSellerDashboard(storeId?: number): Promise<SellerDashboard> {
    const params = storeId ? { store_id: storeId } : {};
    const response = await apiGet<ApiResponse<SellerDashboard>>('/dashboard/seller', params);
    return response.data;
}

/**
 * Get store dashboard (for conferentes/gerentes)
 */
export async function getStoreDashboard(storeId?: number): Promise<StoreDashboard> {
    const params = storeId ? { store_id: storeId } : {};
    const response = await apiGet<ApiResponse<StoreDashboard>>('/dashboard/store', params);
    return response.data;
}

/**
 * Get admin consolidated dashboard
 */
export async function getAdminDashboard(): Promise<AdminDashboard> {
    const response = await apiGet<ApiResponse<AdminDashboard>>('/dashboard/admin');
    return response.data;
}
