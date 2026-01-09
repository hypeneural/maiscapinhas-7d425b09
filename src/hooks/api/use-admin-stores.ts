/**
 * Admin Stores Hooks
 * 
 * React Query hooks for admin store management and user bindings.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storesService } from '@/services/admin';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    AdminListFilters,
    CreateStoreRequest,
    UpdateStoreRequest,
    CreateStoreUserRequest,
    UpdateStoreUserRequest,
} from '@/types/admin.types';

/**
 * Query key factory for admin stores
 */
export const adminStoresKeys = {
    all: ['admin', 'stores'] as const,
    lists: () => [...adminStoresKeys.all, 'list'] as const,
    list: (filters?: AdminListFilters) => [...adminStoresKeys.lists(), filters] as const,
    details: () => [...adminStoresKeys.all, 'detail'] as const,
    detail: (id: number) => [...adminStoresKeys.details(), id] as const,
    users: (storeId: number) => [...adminStoresKeys.all, 'users', storeId] as const,
};

// ============================================================
// Store CRUD Hooks
// ============================================================

/**
 * Hook to list admin stores with filters
 */
export function useAdminStores(filters?: AdminListFilters) {
    return useQuery({
        queryKey: adminStoresKeys.list(filters),
        queryFn: () => storesService.list(filters),
    });
}

/**
 * Hook to get a single store
 */
export function useAdminStore(id: number) {
    return useQuery({
        queryKey: adminStoresKeys.detail(id),
        queryFn: () => storesService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a store
 */
export function useCreateStore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateStoreRequest) => storesService.create(data),
        onSuccess: (store) => {
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.lists() });
            toast.success(`Loja "${store.name}" criada com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a store
 */
export function useUpdateStore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateStoreRequest }) =>
            storesService.update(id, data),
        onSuccess: (store) => {
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.detail(store.id) });
            toast.success(`Loja "${store.name}" atualizada com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to deactivate a store
 */
export function useDeactivateStore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => storesService.deactivate(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.detail(id) });
            toast.success('Loja desativada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to upload store photo
 */
export function useUploadStorePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, file }: { id: number; file: File }) =>
            storesService.uploadPhoto(id, file),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.detail(result.store_id) });
            toast.success('Foto atualizada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove store photo
 */
export function useRemoveStorePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => storesService.removePhoto(id),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.detail(result.store_id) });
            toast.success('Foto removida com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Store-User Binding Hooks
// ============================================================

/**
 * Hook to list users in a store
 */
export function useStoreUsers(storeId: number) {
    return useQuery({
        queryKey: adminStoresKeys.users(storeId),
        queryFn: () => storesService.listUsers(storeId),
        enabled: !!storeId,
    });
}

/**
 * Hook to add user to store
 */
export function useAddUserToStore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ storeId, data }: { storeId: number; data: CreateStoreUserRequest }) =>
            storesService.addUser(storeId, data),
        onSuccess: (_, { storeId }) => {
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.users(storeId) });
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.detail(storeId) });
            toast.success('Usuário vinculado à loja com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update user role in store
 */
export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ storeId, userId, data }: { storeId: number; userId: number; data: UpdateStoreUserRequest }) =>
            storesService.updateUserRole(storeId, userId, data),
        onSuccess: (_, { storeId }) => {
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.users(storeId) });
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.detail(storeId) });
            toast.success('Role atualizada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove user from store
 */
export function useRemoveUserFromStore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ storeId, userId }: { storeId: number; userId: number }) =>
            storesService.removeUser(storeId, userId),
        onSuccess: (_, { storeId }) => {
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.users(storeId) });
            queryClient.invalidateQueries({ queryKey: adminStoresKeys.detail(storeId) });
            toast.success('Usuário removido da loja com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
