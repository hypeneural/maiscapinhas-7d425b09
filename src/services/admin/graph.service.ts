/**
 * Graph Service
 * 
 * API calls for Permission Graph visualization endpoints.
 */

import { api } from '@/lib/api';
import type {
    GraphResponse,
    OverviewParams,
    RoleGraphParams,
    UserGraphParams,
    StoreGraphParams,
} from '@/types/graph.types';

const BASE_URL = '/admin/graph';

// ============================================================
// Overview
// ============================================================

export async function getGraphOverview(params?: OverviewParams): Promise<GraphResponse> {
    const response = await api.get<GraphResponse>(`${BASE_URL}/overview`, { params });
    return response.data;
}

// ============================================================
// Role Graph
// ============================================================

export async function getRoleGraph(
    roleName: string,
    params?: RoleGraphParams
): Promise<GraphResponse> {
    const response = await api.get<GraphResponse>(`${BASE_URL}/role/${roleName}`, { params });
    return response.data;
}

// ============================================================
// User Graph
// ============================================================

export async function getUserGraph(
    userId: number,
    params?: UserGraphParams
): Promise<GraphResponse> {
    const response = await api.get<GraphResponse>(`${BASE_URL}/user/${userId}`, { params });
    return response.data;
}

// ============================================================
// Store Graph
// ============================================================

export async function getStoreGraph(
    storeId: number,
    params?: StoreGraphParams
): Promise<GraphResponse> {
    const response = await api.get<GraphResponse>(`${BASE_URL}/store/${storeId}`, { params });
    return response.data;
}

// ============================================================
// Module Graph
// ============================================================

export async function getModuleGraph(moduleId: string): Promise<GraphResponse> {
    const response = await api.get<GraphResponse>(`${BASE_URL}/module/${moduleId}`);
    return response.data;
}

// ============================================================
// Service Export
// ============================================================

export const graphService = {
    getOverview: getGraphOverview,
    getRoleGraph,
    getUserGraph,
    getStoreGraph,
    getModuleGraph,
};
