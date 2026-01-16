/**
 * Phone Catalog Hooks
 * 
 * React Query hooks for phone brands and models management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneCatalogService } from '@/services/phone-catalog.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    PhoneBrandFilters,
    PhoneModelFilters,
    CreatePhoneBrandRequest,
    UpdatePhoneBrandRequest,
    CreatePhoneModelRequest,
    UpdatePhoneModelRequest,
} from '@/types/customers.types';

// ============================================================
// Query Keys
// ============================================================

export const phoneCatalogKeys = {
    brands: {
        all: ['phone-catalog', 'brands'] as const,
        lists: () => [...phoneCatalogKeys.brands.all, 'list'] as const,
        list: (filters?: PhoneBrandFilters) => [...phoneCatalogKeys.brands.lists(), filters] as const,
        details: () => [...phoneCatalogKeys.brands.all, 'detail'] as const,
        detail: (id: number) => [...phoneCatalogKeys.brands.details(), id] as const,
    },
    models: {
        all: ['phone-catalog', 'models'] as const,
        lists: () => [...phoneCatalogKeys.models.all, 'list'] as const,
        list: (filters?: PhoneModelFilters) => [...phoneCatalogKeys.models.lists(), filters] as const,
        details: () => [...phoneCatalogKeys.models.all, 'detail'] as const,
        detail: (id: number) => [...phoneCatalogKeys.models.details(), id] as const,
    },
};

// ============================================================
// Brand Hooks
// ============================================================

/**
 * Hook to list phone brands with filters
 */
export function usePhoneBrands(filters?: PhoneBrandFilters) {
    return useQuery({
        queryKey: phoneCatalogKeys.brands.list(filters),
        queryFn: () => phoneCatalogService.listBrands(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
}

/**
 * Hook to get a single phone brand
 */
export function usePhoneBrand(id: number) {
    return useQuery({
        queryKey: phoneCatalogKeys.brands.detail(id),
        queryFn: () => phoneCatalogService.getBrand(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a phone brand
 */
export function useCreateBrand() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePhoneBrandRequest) => phoneCatalogService.createBrand(data),
        onSuccess: (brand) => {
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.brands.lists() });
            toast.success(`Marca "${brand.brand_name}" criada com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a phone brand
 */
export function useUpdateBrand() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePhoneBrandRequest }) =>
            phoneCatalogService.updateBrand(id, data),
        onSuccess: (brand) => {
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.brands.lists() });
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.brands.detail(brand.id) });
            toast.success(`Marca "${brand.brand_name}" atualizada com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a phone brand
 */
export function useDeleteBrand() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => phoneCatalogService.deleteBrand(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.brands.lists() });
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.brands.detail(id) });
            toast.success('Marca excluída com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Model Hooks
// ============================================================

/**
 * Hook to list phone models with filters
 */
export function usePhoneModels(filters?: PhoneModelFilters) {
    return useQuery({
        queryKey: phoneCatalogKeys.models.list(filters),
        queryFn: () => phoneCatalogService.listModels(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
}

/**
 * Hook to get a single phone model
 */
export function usePhoneModel(id: number) {
    return useQuery({
        queryKey: phoneCatalogKeys.models.detail(id),
        queryFn: () => phoneCatalogService.getModel(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a phone model
 */
export function useCreateModel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePhoneModelRequest) => phoneCatalogService.createModel(data),
        onSuccess: (model) => {
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.models.lists() });
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.brands.lists() }); // Update models_count
            toast.success(`Modelo "${model.marketing_name}" criado com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a phone model
 */
export function useUpdateModel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePhoneModelRequest }) =>
            phoneCatalogService.updateModel(id, data),
        onSuccess: (model) => {
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.models.lists() });
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.models.detail(model.id) });
            toast.success(`Modelo "${model.marketing_name}" atualizado com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a phone model
 */
export function useDeleteModel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => phoneCatalogService.deleteModel(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.models.lists() });
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.models.detail(id) });
            queryClient.invalidateQueries({ queryKey: phoneCatalogKeys.brands.lists() }); // Update models_count
            toast.success('Modelo excluído com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
