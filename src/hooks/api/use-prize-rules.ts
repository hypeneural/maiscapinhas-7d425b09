/**
 * Prize Rules React Query Hooks
 * 
 * Hooks for Prize Rules CRUD and eligibility state monitoring.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wheelService } from '@/services/admin/wheel.service';
import type {
    CreatePrizeRuleRequest,
    UpdatePrizeRuleRequest,
} from '@/types/wheel.types';

// ============================================
// Query Keys
// ============================================

export const prizeRulesKeys = {
    all: ['wheel', 'prize-rules'] as const,

    // Rules for a campaign
    rules: (campaignKey: string) => [...prizeRulesKeys.all, 'campaigns', campaignKey, 'rules'] as const,

    // Single rule detail
    rule: (ruleId: number) => [...prizeRulesKeys.all, 'rule', ruleId] as const,

    // Prize state (eligibility)
    state: (campaignKey: string, screenId?: number) =>
        [...prizeRulesKeys.all, 'campaigns', campaignKey, 'state', screenId] as const,
};

// ============================================
// Query Hooks
// ============================================

/**
 * List all prize rules for a campaign
 */
export function usePrizeRules(campaignKey: string) {
    return useQuery({
        queryKey: prizeRulesKeys.rules(campaignKey),
        queryFn: () => wheelService.getPrizeRules(campaignKey),
        enabled: !!campaignKey,
        staleTime: 30_000, // 30 seconds
    });
}

/**
 * Get single prize rule with current state
 */
export function usePrizeRule(ruleId: number) {
    return useQuery({
        queryKey: prizeRulesKeys.rule(ruleId),
        queryFn: () => wheelService.getPrizeRule(ruleId),
        enabled: !!ruleId && ruleId > 0,
    });
}

/**
 * Get prize eligibility state with auto-refresh
 */
export function usePrizeState(
    campaignKey: string,
    options?: {
        screenId?: number;
        refetchInterval?: number;
        enabled?: boolean;
    }
) {
    return useQuery({
        queryKey: prizeRulesKeys.state(campaignKey, options?.screenId),
        queryFn: () => wheelService.getPrizeState(campaignKey, options?.screenId),
        enabled: (options?.enabled ?? true) && !!campaignKey,
        refetchInterval: options?.refetchInterval ?? 10_000, // 10 seconds default
        staleTime: 5_000, // 5 seconds
    });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create a new prize rule
 */
export function useCreatePrizeRule(campaignKey: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePrizeRuleRequest) =>
            wheelService.createPrizeRule(campaignKey, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.rules(campaignKey) });
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.state(campaignKey) });
        },
    });
}

/**
 * Update an existing prize rule
 */
export function useUpdatePrizeRule(campaignKey: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ruleId, data }: { ruleId: number; data: UpdatePrizeRuleRequest }) =>
            wheelService.updatePrizeRule(ruleId, data),
        onSuccess: (_, { ruleId }) => {
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.rules(campaignKey) });
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.rule(ruleId) });
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.state(campaignKey) });
        },
    });
}

/**
 * Delete a prize rule
 */
export function useDeletePrizeRule(campaignKey: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ruleId: number) => wheelService.deletePrizeRule(ruleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.rules(campaignKey) });
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.state(campaignKey) });
        },
    });
}

/**
 * Bulk update prize rules
 */
export function useBulkUpdatePrizeRules(campaignKey: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (rules: CreatePrizeRuleRequest[]) =>
            wheelService.bulkUpdatePrizeRules(campaignKey, { rules }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.rules(campaignKey) });
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.state(campaignKey) });
        },
    });
}

/**
 * Reset cooldown for a prize rule
 */
export function useResetPrizeRuleCooldown(campaignKey: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ruleId, scopeId }: { ruleId: number; scopeId?: number }) =>
            wheelService.resetPrizeRuleCooldown(ruleId, scopeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: prizeRulesKeys.state(campaignKey) });
        },
    });
}
