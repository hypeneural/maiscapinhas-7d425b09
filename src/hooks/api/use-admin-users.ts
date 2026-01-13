/**
 * Admin Users Hooks
 * 
 * React Query hooks for admin user management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/admin';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    AdminListFilters,
    CreateUserRequest,
    UpdateUserRequest,
    BulkAddStoresRequest,
    BulkUpdateStoresRequest,
    BulkRemoveStoresRequest,
    SyncStoresRequest,
} from '@/types/admin.types';

/**
 * Query key factory for admin users
 */
export const adminUsersKeys = {
    all: ['admin', 'users'] as const,
    lists: () => [...adminUsersKeys.all, 'list'] as const,
    list: (filters?: AdminListFilters) => [...adminUsersKeys.lists(), filters] as const,
    details: () => [...adminUsersKeys.all, 'detail'] as const,
    detail: (id: number) => [...adminUsersKeys.details(), id] as const,
};

/**
 * Hook to list admin users with filters
 */
export function useAdminUsers(filters?: AdminListFilters) {
    return useQuery({
        queryKey: adminUsersKeys.list(filters),
        queryFn: () => usersService.list(filters),
    });
}

/**
 * Hook to get a single user
 */
export function useAdminUser(id: number) {
    return useQuery({
        queryKey: adminUsersKeys.detail(id),
        queryFn: () => usersService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a user
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserRequest) => usersService.create(data),
        onSuccess: (user) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
            toast.success(`Usuário "${user.name}" criado com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
            usersService.update(id, data),
        onSuccess: (user) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(user.id) });
            toast.success(`Usuário "${user.name}" atualizado com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to deactivate a user
 */
export function useDeactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => usersService.deactivate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(id) });
            toast.success('Usuário desativado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to reactivate a user
 */
export function useReactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => usersService.reactivate(id),
        onSuccess: (user) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(user.id) });
            toast.success(`Usuário "${user.name}" reativado com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to upload user avatar
 */
export function useUploadAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: number; file: File }) =>
            usersService.uploadAvatar(id, file),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(result.user_id) });
            toast.success('Avatar atualizado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove user avatar
 */
export function useRemoveAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => usersService.removeAvatar(id),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(result.user_id) });
            toast.success('Avatar removido com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Bulk Store Operations
// ============================================================

/**
 * Hook to add user to multiple stores at once
 */
export function useBulkAddStores(userId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BulkAddStoresRequest) => usersService.bulkAddStores(userId, data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(userId) });
            const count = result.created.length;
            const skipped = result.skipped.length;
            if (skipped > 0) {
                toast.success(`${count} loja(s) adicionada(s), ${skipped} já vinculada(s)`);
            } else {
                toast.success(`${count} loja(s) adicionada(s) com sucesso!`);
            }
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update role in multiple stores at once
 */
export function useBulkUpdateStores(userId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BulkUpdateStoresRequest) => usersService.bulkUpdateStores(userId, data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(userId) });
            toast.success(`${result.updated_count} cargo(s) atualizado(s) com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove user from multiple stores at once
 */
export function useBulkRemoveStores(userId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BulkRemoveStoresRequest) => usersService.bulkRemoveStores(userId, data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(userId) });
            toast.success(`${result.deleted_count} vínculo(s) removido(s) com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to sync user stores (replace all)
 */
export function useSyncStores(userId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SyncStoresRequest) => usersService.syncStores(userId, data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(userId) });
            toast.success(result.message);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

