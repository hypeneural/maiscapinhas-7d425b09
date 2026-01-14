/**
 * WhatsApp Instances Hooks
 * 
 * React Query hooks for WhatsApp instance management.
 * Super Admin only - requires is_super_admin = true.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { whatsAppInstancesService } from '@/services/admin';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    WhatsAppInstanceFilters,
    CreateWhatsAppInstanceRequest,
    UpdateWhatsAppInstanceRequest,
} from '@/types/whatsapp-instances.types';

// ============================================================
// Query Keys
// ============================================================

/**
 * Query key factory for WhatsApp instances
 */
export const whatsAppInstancesKeys = {
    all: ['whatsapp', 'instances'] as const,
    lists: () => [...whatsAppInstancesKeys.all, 'list'] as const,
    list: (filters?: WhatsAppInstanceFilters) => [...whatsAppInstancesKeys.lists(), filters] as const,
    details: () => [...whatsAppInstancesKeys.all, 'detail'] as const,
    detail: (id: number) => [...whatsAppInstancesKeys.details(), id] as const,
    state: (id: number) => [...whatsAppInstancesKeys.all, 'state', id] as const,
    connect: (id: number) => [...whatsAppInstancesKeys.all, 'connect', id] as const,
};

// ============================================================
// List & Detail Queries
// ============================================================

/**
 * Hook to list WhatsApp instances with filters
 */
export function useWhatsAppInstances(filters?: WhatsAppInstanceFilters) {
    return useQuery({
        queryKey: whatsAppInstancesKeys.list(filters),
        queryFn: () => whatsAppInstancesService.list(filters),
    });
}

/**
 * Hook to get a single WhatsApp instance
 */
export function useWhatsAppInstance(id: number) {
    return useQuery({
        queryKey: whatsAppInstancesKeys.detail(id),
        queryFn: () => whatsAppInstancesService.get(id),
        enabled: !!id,
    });
}

// ============================================================
// CRUD Mutations
// ============================================================

/**
 * Hook to create a WhatsApp instance
 */
export function useCreateWhatsAppInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateWhatsAppInstanceRequest) =>
            whatsAppInstancesService.create(data),
        onSuccess: (instance) => {
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.lists() });
            toast.success(`Instância "${instance.name}" criada com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a WhatsApp instance
 */
export function useUpdateWhatsAppInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateWhatsAppInstanceRequest }) =>
            whatsAppInstancesService.update(id, data),
        onSuccess: (instance) => {
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.detail(instance.id) });
            toast.success(`Instância "${instance.name}" atualizada com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a WhatsApp instance
 */
export function useDeleteWhatsAppInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => whatsAppInstancesService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.lists() });
            toast.success('Instância excluída com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Action Mutations
// ============================================================

/**
 * Hook to set an instance as default/favorite
 */
export function useSetDefaultInstance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => whatsAppInstancesService.setDefault(id),
        onSuccess: (instance) => {
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.detail(instance.id) });
            toast.success(`"${instance.name}" definida como favorita!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to clear API key from an instance
 */
export function useClearApiKey() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => whatsAppInstancesService.clearApiKey(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.lists() });
            toast.success('API Key removida com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to clear token from an instance
 */
export function useClearToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => whatsAppInstancesService.clearToken(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: whatsAppInstancesKeys.lists() });
            toast.success('Token removido com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Connection Queries & Mutations
// ============================================================

/**
 * Hook to check instance connection state
 * Uses manual refetch pattern - not auto-fetched
 */
export function useCheckInstanceState(id: number) {
    return useQuery({
        queryKey: whatsAppInstancesKeys.state(id),
        queryFn: () => whatsAppInstancesService.checkState(id),
        enabled: false, // Manual trigger only
        staleTime: 0, // Always refetch
    });
}

/**
 * Hook to get QR code for connecting WhatsApp
 * Uses manual refetch pattern - not auto-fetched
 */
export function useConnectInstance(id: number) {
    return useQuery({
        queryKey: whatsAppInstancesKeys.connect(id),
        queryFn: () => whatsAppInstancesService.getConnectQR(id),
        enabled: false, // Manual trigger only
        staleTime: 0, // Always refetch
    });
}

/**
 * Hook to test connection to Evolution API server
 */
export function useTestConnection() {
    return useMutation({
        mutationFn: (id: number) => whatsAppInstancesService.testConnection(id),
        onSuccess: (result) => {
            if (result.ok) {
                if (result.status === 'connected') {
                    toast.success('✅ Conexão OK - WhatsApp conectado!');
                } else {
                    toast.warning(`⚠️ Servidor OK - WhatsApp ${result.status}`);
                }
            } else {
                toast.error('❌ Falha ao conectar com o servidor');
            }
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
