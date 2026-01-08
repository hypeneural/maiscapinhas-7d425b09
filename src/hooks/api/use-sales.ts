/**
 * Sales Hooks
 * 
 * React Query hooks for sales operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getSales,
    getSale,
    createSale,
    updateSale,
    deleteSale
} from '@/services/sales.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type { SalesFilters, CreateSaleRequest } from '@/types/api';
import { dashboardKeys } from './use-dashboard';

/**
 * Query key factory for sales queries
 */
export const salesKeys = {
    all: ['sales'] as const,
    lists: () => [...salesKeys.all, 'list'] as const,
    list: (filters: SalesFilters) => [...salesKeys.lists(), filters] as const,
    details: () => [...salesKeys.all, 'detail'] as const,
    detail: (id: number) => [...salesKeys.details(), id] as const,
};

/**
 * Hook to list sales with filters
 */
export function useSales(filters: SalesFilters = {}) {
    return useQuery({
        queryKey: salesKeys.list(filters),
        queryFn: () => getSales(filters),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to get a single sale
 */
export function useSale(id: number) {
    return useQuery({
        queryKey: salesKeys.detail(id),
        queryFn: () => getSale(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a new sale
 */
export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSaleRequest) => createSale(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Venda registrada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update sale
 */
export function useUpdateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateSaleRequest> }) =>
            updateSale(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: salesKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Venda atualizada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete sale
 */
export function useDeleteSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSale,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Venda excluída com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
