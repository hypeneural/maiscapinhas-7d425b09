/**
 * Graph Hooks
 * 
 * React Query hooks for Permission Graph visualization.
 */

import { useQuery } from '@tanstack/react-query';
import {
    getGraphOverview,
    getRoleGraph,
    getUserGraph,
    getStoreGraph,
    getModuleGraph,
} from '@/services/admin/graph.service';
import type {
    OverviewParams,
    RoleGraphParams,
    UserGraphParams,
    StoreGraphParams,
} from '@/types/graph.types';

// ============================================================
// Overview
// ============================================================

export function useGraphOverview(params?: OverviewParams) {
    return useQuery({
        queryKey: ['graph', 'overview', params],
        queryFn: () => getGraphOverview(params),
    });
}

// ============================================================
// Role Graph
// ============================================================

export function useRoleGraph(roleName: string, params?: RoleGraphParams) {
    return useQuery({
        queryKey: ['graph', 'role', roleName, params],
        queryFn: () => getRoleGraph(roleName, params),
        enabled: !!roleName,
    });
}

// ============================================================
// User Graph
// ============================================================

export function useUserGraph(userId: number, params?: UserGraphParams) {
    return useQuery({
        queryKey: ['graph', 'user', userId, params],
        queryFn: () => getUserGraph(userId, params),
        enabled: !!userId,
    });
}

// ============================================================
// Store Graph
// ============================================================

export function useStoreGraph(storeId: number, params?: StoreGraphParams) {
    return useQuery({
        queryKey: ['graph', 'store', storeId, params],
        queryFn: () => getStoreGraph(storeId, params),
        enabled: !!storeId,
    });
}

// ============================================================
// Module Graph
// ============================================================

export function useModuleGraph(moduleId: string) {
    return useQuery({
        queryKey: ['graph', 'module', moduleId],
        queryFn: () => getModuleGraph(moduleId),
        enabled: !!moduleId,
    });
}
