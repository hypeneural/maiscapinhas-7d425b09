/**
 * useModules Hook
 *
 * React Query hooks for module management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { modulesService } from '@/services/admin';
import type {
    UpdateTransitionsRequest,
    UpdateStatusRequest,
    CreateStatusRequest,
    PreviewImpactRequest,
    ModuleTexts,
} from '@/types/modules.types';

// Query keys
export const moduleKeys = {
    all: ['modules'] as const,
    list: () => [...moduleKeys.all, 'list'] as const,
    detail: (id: string) => [...moduleKeys.all, 'detail', id] as const,
    full: (id: string) => [...moduleKeys.all, 'full', id] as const,
    transitions: (id: string) => [...moduleKeys.all, 'transitions', id] as const,
    stores: (id: string) => [...moduleKeys.all, 'stores', id] as const,
    schema: (id: string) => [...moduleKeys.all, 'schema', id] as const,
    auditLog: (id: string) => [...moduleKeys.all, 'audit-log', id] as const,
};

/**
 * Hook to list all modules
 */
export function useModules() {
    return useQuery({
        queryKey: moduleKeys.list(),
        queryFn: modulesService.getModules,
    });
}

/**
 * Hook to get a module's basic details
 */
export function useModule(moduleId: string) {
    return useQuery({
        queryKey: moduleKeys.detail(moduleId),
        queryFn: () => modulesService.getModule(moduleId),
        enabled: !!moduleId,
    });
}

/**
 * Hook to get full module configuration
 * Uses aggressive caching since module config rarely changes
 */
export function useModuleFull(moduleId: string) {
    return useQuery({
        queryKey: moduleKeys.full(moduleId),
        queryFn: () => modulesService.getModuleFull(moduleId),
        enabled: !!moduleId,
        staleTime: Infinity, // Never automatically refetch
        gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
    });
}

/**
 * Hook to get module transitions
 */
export function useModuleTransitions(moduleId: string) {
    return useQuery({
        queryKey: moduleKeys.transitions(moduleId),
        queryFn: () => modulesService.getModuleTransitions(moduleId),
        enabled: !!moduleId,
    });
}

/**
 * Hook to install a module
 */
export function useInstallModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (moduleId: string) => modulesService.installModule(moduleId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.all });
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao instalar módulo', { description: error.message });
        },
    });
}

/**
 * Hook to activate a module
 */
export function useActivateModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (moduleId: string) => modulesService.activateModule(moduleId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.all });
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao ativar módulo', { description: error.message });
        },
    });
}

/**
 * Hook to deactivate a module
 */
export function useDeactivateModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (moduleId: string) => modulesService.deactivateModule(moduleId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.all });
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao desativar módulo', { description: error.message });
        },
    });
}

/**
 * Hook to get stores for a module
 */
export function useModuleStores(moduleId: string) {
    return useQuery({
        queryKey: moduleKeys.stores(moduleId),
        queryFn: () => modulesService.getModuleStores(moduleId),
        enabled: !!moduleId,
    });
}

/**
 * Hook to activate module for a specific store
 */
export function useActivateModuleForStore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ moduleId, storeId }: { moduleId: string; storeId: number }) =>
            modulesService.activateModuleForStore(moduleId, storeId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.all });
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao ativar módulo para loja', { description: error.message });
        },
    });
}

/**
 * Hook to deactivate module for a specific store
 */
export function useDeactivateModuleForStore() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ moduleId, storeId }: { moduleId: string; storeId: number }) =>
            modulesService.deactivateModuleForStore(moduleId, storeId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.all });
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao desativar módulo para loja', { description: error.message });
        },
    });
}

/**
 * Hook to update module transitions
 */
export function useUpdateModuleTransitions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ moduleId, data }: { moduleId: string; data: UpdateTransitionsRequest }) =>
            modulesService.updateModuleTransitions(moduleId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.transitions(variables.moduleId) });
            toast.success('Matriz de transições atualizada');
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar transições', { description: error.message });
        },
    });
}

/**
 * Helper to prefetch module on hover
 */
export function usePrefetchModule() {
    const queryClient = useQueryClient();

    return (moduleId: string) => {
        queryClient.prefetchQuery({
            queryKey: moduleKeys.full(moduleId),
            queryFn: () => modulesService.getModuleFull(moduleId),
            staleTime: Infinity,
        });
    };
}

// ============================================================
// Schema & Validation
// ============================================================

/**
 * Hook to get module schema for validation
 */
export function useModuleSchema(moduleId: string) {
    return useQuery({
        queryKey: moduleKeys.schema(moduleId),
        queryFn: () => modulesService.getModuleSchema(moduleId),
        enabled: !!moduleId,
        staleTime: Infinity, // Schema rarely changes
    });
}

// ============================================================
// Audit Log
// ============================================================

/**
 * Hook to get module audit log
 */
export function useModuleAuditLog(moduleId: string, limit = 50) {
    return useQuery({
        queryKey: moduleKeys.auditLog(moduleId),
        queryFn: () => modulesService.getModuleAuditLog(moduleId, limit),
        enabled: !!moduleId,
    });
}

// ============================================================
// Status CRUD Mutations
// ============================================================

/**
 * Hook to update a module status
 */
export function useUpdateModuleStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ moduleId, statusKey, data }: { moduleId: string; statusKey: string; data: UpdateStatusRequest }) =>
            modulesService.updateModuleStatus(moduleId, statusKey, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.full(variables.moduleId) });
            queryClient.invalidateQueries({ queryKey: moduleKeys.auditLog(variables.moduleId) });
            toast.success(response.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar status', { description: error.message });
        },
    });
}

/**
 * Hook to create a new module status
 */
export function useCreateModuleStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ moduleId, data }: { moduleId: string; data: CreateStatusRequest }) =>
            modulesService.createModuleStatus(moduleId, data),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.full(variables.moduleId) });
            queryClient.invalidateQueries({ queryKey: moduleKeys.auditLog(variables.moduleId) });
            toast.success(response.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao criar status', { description: error.message });
        },
    });
}

/**
 * Hook to delete a module status
 */
export function useDeleteModuleStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ moduleId, statusKey, force }: { moduleId: string; statusKey: string; force?: boolean }) =>
            modulesService.deleteModuleStatus(moduleId, statusKey, { force }),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: moduleKeys.full(variables.moduleId) });
            queryClient.invalidateQueries({ queryKey: moduleKeys.auditLog(variables.moduleId) });
            toast.success(response.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao deletar status', { description: error.message });
        },
    });
}

/**
 * Hook to preview impact of destructive actions
 */
export function usePreviewImpact() {
    return useMutation({
        mutationFn: ({ moduleId, data }: { moduleId: string; data: PreviewImpactRequest }) =>
            modulesService.previewImpact(moduleId, data),
    });
}

// ============================================================
// Texts Mutation
// ============================================================

/**
 * Hook to update module texts
 */
export function useUpdateModuleTexts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ moduleId, texts }: { moduleId: string; texts: Record<string, string> }) =>
            modulesService.updateModuleTexts(moduleId, texts),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: [...moduleKeys.all, 'texts', variables.moduleId] });
            queryClient.invalidateQueries({ queryKey: moduleKeys.full(variables.moduleId) });
            queryClient.invalidateQueries({ queryKey: moduleKeys.auditLog(variables.moduleId) });
            toast.success(response.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar textos', { description: error.message });
        },
    });
}

// ============================================================
// Module Configuration
// ============================================================

/**
 * Hook to get module configuration with schema
 */
export function useModuleConfig(moduleId: string) {
    return useQuery({
        queryKey: [...moduleKeys.all, 'config', moduleId],
        queryFn: () => modulesService.getModuleConfig(moduleId),
        enabled: !!moduleId,
    });
}

/**
 * Hook to update module configuration
 */
export function useUpdateModuleConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ moduleId, config }: { moduleId: string; config: Record<string, unknown> }) =>
            modulesService.updateModuleConfig(moduleId, config),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: [...moduleKeys.all, 'config', variables.moduleId] });
            queryClient.invalidateQueries({ queryKey: moduleKeys.auditLog(variables.moduleId) });
            toast.success(response.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar configurações', { description: error.message });
        },
    });
}

/**
 * Hook to reset module configuration to defaults
 */
export function useResetModuleConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (moduleId: string) => modulesService.resetModuleConfig(moduleId),
        onSuccess: (response, moduleId) => {
            queryClient.invalidateQueries({ queryKey: [...moduleKeys.all, 'config', moduleId] });
            queryClient.invalidateQueries({ queryKey: moduleKeys.auditLog(moduleId) });
            toast.success(response.message);
        },
        onError: (error: Error) => {
            toast.error('Erro ao restaurar configurações', { description: error.message });
        },
    });
}

// ============================================================
// Module Texts Hooks
// ============================================================

/**
 * Hook to get module texts with schema and defaults
 */
export function useModuleTexts(moduleId: string) {
    return useQuery({
        queryKey: [...moduleKeys.all, 'texts', moduleId],
        queryFn: () => modulesService.getModuleTexts(moduleId),
        enabled: !!moduleId,
    });
}
