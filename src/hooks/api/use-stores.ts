/**
 * Stores Hooks
 * 
 * React Query hooks for store operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getStores,
    getStore,
    getStoreSellers,
    updateStorePhoto
} from '@/services/stores.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Query key factory for stores queries
 */
export const storesKeys = {
    all: ['stores'] as const,
    list: () => [...storesKeys.all, 'list'] as const,
    detail: (id: number) => [...storesKeys.all, 'detail', id] as const,
    sellers: (storeId: number) => [...storesKeys.all, storeId, 'sellers'] as const,
};

/**
 * Hook to get all accessible stores
 */
export function useStores() {
    return useQuery({
        queryKey: storesKeys.list(),
        queryFn: getStores,
        staleTime: 1000 * 60 * 10, // Stores don't change often
    });
}

/**
 * Hook to get a single store
 */
export function useStore(id: number) {
    return useQuery({
        queryKey: storesKeys.detail(id),
        queryFn: () => getStore(id),
        enabled: !!id,
    });
}

/**
 * Hook to get store sellers
 */
export function useStoreSellers(storeId: number) {
    return useQuery({
        queryKey: storesKeys.sellers(storeId),
        queryFn: () => getStoreSellers(storeId),
        enabled: !!storeId,
        staleTime: 1000 * 60 * 10,
    });
}

/**
 * Hook to update store photo
 */
export function useUpdateStorePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ storeId, photo }: { storeId: number; photo: File }) =>
            updateStorePhoto(storeId, photo),
        onSuccess: (_, { storeId }) => {
            queryClient.invalidateQueries({ queryKey: storesKeys.detail(storeId) });
            queryClient.invalidateQueries({ queryKey: storesKeys.list() });
            toast.success('Foto da loja atualizada!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
