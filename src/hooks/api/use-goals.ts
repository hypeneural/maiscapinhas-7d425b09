/**
 * Goals Hooks
 * 
 * React Query hooks for monthly goals management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalsService } from '@/services/admin';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    GoalListFilters,
    CreateGoalRequest,
    UpdateGoalRequest,
    SetSplitsRequest,
} from '@/types/admin.types';

/**
 * Query key factory for goals
 */
export const goalsKeys = {
    all: ['goals'] as const,
    lists: () => [...goalsKeys.all, 'list'] as const,
    list: (filters?: GoalListFilters) => [...goalsKeys.lists(), filters] as const,
    details: () => [...goalsKeys.all, 'detail'] as const,
    detail: (id: number) => [...goalsKeys.details(), id] as const,
};

/**
 * Hook to list goals with filters
 */
export function useGoals(filters?: GoalListFilters) {
    return useQuery({
        queryKey: goalsKeys.list(filters),
        queryFn: () => goalsService.list(filters),
    });
}

/**
 * Hook to get a single goal
 */
export function useGoal(id: number) {
    return useQuery({
        queryKey: goalsKeys.detail(id),
        queryFn: () => goalsService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a goal
 */
export function useCreateGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateGoalRequest) => goalsService.create(data),
        onSuccess: (goal) => {
            queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
            toast.success(`Meta de R$ ${goal.goal_amount.toLocaleString('pt-BR')} criada!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a goal
 */
export function useUpdateGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateGoalRequest }) =>
            goalsService.update(id, data),
        onSuccess: (goal) => {
            queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goal.id) });
            toast.success('Meta atualizada com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a goal
 */
export function useDeleteGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => goalsService.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
            queryClient.removeQueries({ queryKey: goalsKeys.detail(id) });
            toast.success('Meta excluída com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to set goal splits
 */
export function useSetGoalSplits() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, splits }: { id: number; splits: SetSplitsRequest['splits'] }) =>
            goalsService.setSplits(id, splits),
        onSuccess: (goal) => {
            queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goal.id) });
            toast.success('Distribuição de meta atualizada!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
