/**
 * Rules Hooks
 * 
 * React Query hooks for bonus and commission rules management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bonusRulesService, commissionRulesService } from '@/services/admin';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    RuleListFilters,
    CreateBonusRuleRequest,
    UpdateBonusRuleRequest,
    CreateCommissionRuleRequest,
    UpdateCommissionRuleRequest,
} from '@/types/admin.types';

// ============================================================
// Query Keys
// ============================================================

export const bonusRulesKeys = {
    all: ['rules', 'bonus'] as const,
    lists: () => [...bonusRulesKeys.all, 'list'] as const,
    list: (filters?: RuleListFilters) => [...bonusRulesKeys.lists(), filters] as const,
    details: () => [...bonusRulesKeys.all, 'detail'] as const,
    detail: (id: number) => [...bonusRulesKeys.details(), id] as const,
};

export const commissionRulesKeys = {
    all: ['rules', 'commission'] as const,
    lists: () => [...commissionRulesKeys.all, 'list'] as const,
    list: (filters?: RuleListFilters) => [...commissionRulesKeys.lists(), filters] as const,
    details: () => [...commissionRulesKeys.all, 'detail'] as const,
    detail: (id: number) => [...commissionRulesKeys.details(), id] as const,
};

// ============================================================
// Bonus Rules Hooks
// ============================================================

/**
 * Hook to list bonus rules
 */
export function useBonusRules(filters?: RuleListFilters) {
    return useQuery({
        queryKey: bonusRulesKeys.list(filters),
        queryFn: () => bonusRulesService.list(filters),
    });
}

/**
 * Hook to get a single bonus rule
 */
export function useBonusRule(id: number) {
    return useQuery({
        queryKey: bonusRulesKeys.detail(id),
        queryFn: () => bonusRulesService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a bonus rule
 */
export function useCreateBonusRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateBonusRuleRequest) => bonusRulesService.create(data),
        onSuccess: (rule) => {
            queryClient.invalidateQueries({ queryKey: bonusRulesKeys.lists() });
            toast.success(`Regra "${rule.name}" criada com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a bonus rule
 */
export function useUpdateBonusRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateBonusRuleRequest }) =>
            bonusRulesService.update(id, data),
        onSuccess: (rule) => {
            queryClient.invalidateQueries({ queryKey: bonusRulesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: bonusRulesKeys.detail(rule.id) });
            toast.success(`Regra "${rule.name}" atualizada!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a bonus rule
 */
export function useDeleteBonusRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => bonusRulesService.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: bonusRulesKeys.lists() });
            queryClient.removeQueries({ queryKey: bonusRulesKeys.detail(id) });
            toast.success('Regra de bônus excluída!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Commission Rules Hooks
// ============================================================

/**
 * Hook to list commission rules
 */
export function useCommissionRules(filters?: RuleListFilters) {
    return useQuery({
        queryKey: commissionRulesKeys.list(filters),
        queryFn: () => commissionRulesService.list(filters),
    });
}

/**
 * Hook to get a single commission rule
 */
export function useCommissionRule(id: number) {
    return useQuery({
        queryKey: commissionRulesKeys.detail(id),
        queryFn: () => commissionRulesService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a commission rule
 */
export function useCreateCommissionRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCommissionRuleRequest) => commissionRulesService.create(data),
        onSuccess: (rule) => {
            queryClient.invalidateQueries({ queryKey: commissionRulesKeys.lists() });
            toast.success(`Regra "${rule.name}" criada com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a commission rule
 */
export function useUpdateCommissionRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCommissionRuleRequest }) =>
            commissionRulesService.update(id, data),
        onSuccess: (rule) => {
            queryClient.invalidateQueries({ queryKey: commissionRulesKeys.lists() });
            queryClient.invalidateQueries({ queryKey: commissionRulesKeys.detail(rule.id) });
            toast.success(`Regra "${rule.name}" atualizada!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a commission rule
 */
export function useDeleteCommissionRule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => commissionRulesService.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: commissionRulesKeys.lists() });
            queryClient.removeQueries({ queryKey: commissionRulesKeys.detail(id) });
            toast.success('Regra de comissão excluída!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
