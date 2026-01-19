/**
 * usePermissions Hook (API)
 *
 * React Query hooks for permission management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { permissionsService } from '@/services/admin';
import type { AddPermissionOverrideRequest, CreateStorePermissionOverrideRequest } from '@/types/permissions.types';

// Query keys
export const permissionKeys = {
    all: ['permissions'] as const,
    list: () => [...permissionKeys.all, 'list'] as const,
    grouped: () => [...permissionKeys.all, 'grouped'] as const,
    byType: () => [...permissionKeys.all, 'by-type'] as const,
    user: (userId: number) => [...permissionKeys.all, 'user', userId] as const,
    userEffective: (userId: number) => [...permissionKeys.all, 'user', userId, 'effective'] as const,
    store: (storeId: number) => [...permissionKeys.all, 'store', storeId] as const,
};

/**
 * Hook to list all permissions
 */
export function usePermissionsList() {
    return useQuery({
        queryKey: permissionKeys.list(),
        queryFn: permissionsService.getPermissions,
        staleTime: 1000 * 60 * 60, // 1 hour - permissions rarely change
    });
}

/**
 * Hook to get permissions grouped by module
 */
export function usePermissionsGrouped() {
    return useQuery({
        queryKey: permissionKeys.grouped(),
        queryFn: permissionsService.getPermissionsGrouped,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

/**
 * Hook to get permissions separated by type
 */
export function usePermissionsByType() {
    return useQuery({
        queryKey: permissionKeys.byType(),
        queryFn: permissionsService.getPermissionsByType,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

/**
 * Hook to get user permissions and overrides
 */
export function useUserPermissions(userId: number) {
    return useQuery({
        queryKey: permissionKeys.user(userId),
        queryFn: () => permissionsService.getUserPermissions(userId),
        enabled: !!userId,
    });
}

/**
 * Hook to get user effective permissions with source
 */
export function useUserEffectivePermissions(userId: number) {
    return useQuery({
        queryKey: permissionKeys.userEffective(userId),
        queryFn: () => permissionsService.getUserEffectivePermissions(userId),
        enabled: !!userId,
    });
}

/**
 * Hook to add permission override to user
 */
export function useAddUserPermissionOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: number; data: AddPermissionOverrideRequest }) =>
            permissionsService.addUserPermissionOverride(userId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.user(variables.userId) });
            queryClient.invalidateQueries({ queryKey: permissionKeys.userEffective(variables.userId) });
            toast.success('Permissão concedida');
        },
        onError: (error: Error) => {
            toast.error('Erro ao conceder permissão', { description: error.message });
        },
    });
}

/**
 * Hook to remove permission override from user
 */
export function useRemoveUserPermissionOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, overrideId }: { userId: number; overrideId: number }) =>
            permissionsService.removeUserPermissionOverride(userId, overrideId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.user(variables.userId) });
            queryClient.invalidateQueries({ queryKey: permissionKeys.userEffective(variables.userId) });
            toast.success('Permissão revogada');
        },
        onError: (error: Error) => {
            toast.error('Erro ao revogar permissão', { description: error.message });
        },
    });
}

/**
 * Hook to get store permission overrides
 */
export function useStorePermissions(storeId: number) {
    return useQuery({
        queryKey: permissionKeys.store(storeId),
        queryFn: () => permissionsService.getStorePermissions(storeId),
        enabled: !!storeId,
    });
}

/**
 * Hook to add permission override to store
 */
export function useAddStorePermissionOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ storeId, data }: { storeId: number; data: CreateStorePermissionOverrideRequest }) =>
            permissionsService.addStorePermissionOverride(storeId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.store(variables.storeId) });
            toast.success('Permissão concedida para loja');
        },
        onError: (error: Error) => {
            toast.error('Erro ao conceder permissão', { description: error.message });
        },
    });
}

/**
 * Hook to remove permission override from store
 */
export function useRemoveStorePermissionOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ storeId, overrideId }: { storeId: number; overrideId: number }) =>
            permissionsService.removeStorePermissionOverride(storeId, overrideId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.store(variables.storeId) });
            toast.success('Permissão revogada da loja');
        },
        onError: (error: Error) => {
            toast.error('Erro ao revogar permissão', { description: error.message });
        },
    });
}

// ============================================================
// New Hooks (v2.0)
// ============================================================

import type {
    PermissionPreviewRequest,
    BulkGrantPermissionsRequest,
    CopyPermissionsRequest,
} from '@/types/permissions.types';

/**
 * Hook to clear all user permission overrides
 */
export function useClearUserPermissionOverrides() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, storeId }: { userId: number; storeId?: number }) =>
            permissionsService.clearUserPermissionOverrides(userId, storeId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.user(variables.userId) });
            queryClient.invalidateQueries({ queryKey: permissionKeys.userEffective(variables.userId) });
            toast.success('Overrides removidos');
        },
        onError: (error: Error) => {
            toast.error('Erro ao limpar overrides', { description: error.message });
        },
    });
}

/**
 * Hook to preview permission changes before applying
 */
export function usePreviewPermissionChanges() {
    return useMutation({
        mutationFn: (data: PermissionPreviewRequest) =>
            permissionsService.previewPermissionChanges(data),
        onError: (error: Error) => {
            toast.error('Erro ao prever mudanças', { description: error.message });
        },
    });
}

/**
 * Hook to bulk grant permissions to multiple users
 */
export function useBulkGrantPermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BulkGrantPermissionsRequest) =>
            permissionsService.bulkGrantPermissions(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.all });
            toast.success('Permissões concedidas em lote');
        },
        onError: (error: Error) => {
            toast.error('Erro ao conceder permissões', { description: error.message });
        },
    });
}

/**
 * Hook to copy permissions from one user to another
 */
export function useCopyUserPermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ targetUserId, sourceUserId, data }: {
            targetUserId: number;
            sourceUserId: number;
            data?: CopyPermissionsRequest;
        }) => permissionsService.copyUserPermissions(targetUserId, sourceUserId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.user(variables.targetUserId) });
            queryClient.invalidateQueries({ queryKey: permissionKeys.userEffective(variables.targetUserId) });
            toast.success('Permissões copiadas');
        },
        onError: (error: Error) => {
            toast.error('Erro ao copiar permissões', { description: error.message });
        },
    });
}

/**
 * Hook to get user permission audit log
 */
export function useUserPermissionsAuditLog(userId: number) {
    return useQuery({
        queryKey: [...permissionKeys.user(userId), 'audit-log'],
        queryFn: () => permissionsService.getUserPermissionAuditLog(userId),
        enabled: !!userId,
    });
}

/**
 * Hook to update user permission override
 */
export function useUpdateUserPermissionOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, overrideId, data }: {
            userId: number;
            overrideId: number;
            data: Partial<AddPermissionOverrideRequest>;
        }) => permissionsService.updateUserPermissionOverride(userId, overrideId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.user(variables.userId) });
            queryClient.invalidateQueries({ queryKey: permissionKeys.userEffective(variables.userId) });
            toast.success('Override atualizado');
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar override', { description: error.message });
        },
    });
}

/**
 * Hook to update store permission override
 */
export function useUpdateStorePermissionOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ storeId, overrideId, data }: {
            storeId: number;
            overrideId: number;
            data: Partial<CreateStorePermissionOverrideRequest>;
        }) => permissionsService.updateStorePermissionOverride(storeId, overrideId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.store(variables.storeId) });
            toast.success('Override de loja atualizado');
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar override', { description: error.message });
        },
    });
}

/**
 * Hook to clear all store permission overrides
 */
export function useClearStorePermissionOverrides() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (storeId: number) =>
            permissionsService.clearStorePermissionOverrides(storeId),
        onSuccess: (_, storeId) => {
            queryClient.invalidateQueries({ queryKey: permissionKeys.store(storeId) });
            toast.success('Overrides da loja removidos');
        },
        onError: (error: Error) => {
            toast.error('Erro ao limpar overrides', { description: error.message });
        },
    });
}
