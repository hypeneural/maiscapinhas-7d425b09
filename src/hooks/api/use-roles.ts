/**
 * useRoles Hook
 *
 * React Query hooks for role management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { rolesService } from '@/services/admin';
import type {
    CreateRoleRequest,
    UpdateRoleRequest,
    AssignRoleRequest
} from '@/types/permissions.types';

// Query keys
export const roleKeys = {
    all: ['roles'] as const,
    list: () => [...roleKeys.all, 'list'] as const,
    detail: (id: number) => [...roleKeys.all, 'detail', id] as const,
    userRoles: (userId: number) => [...roleKeys.all, 'user', userId] as const,
};

/**
 * Hook to list all roles
 */
export function useRoles() {
    return useQuery({
        queryKey: roleKeys.list(),
        queryFn: rolesService.getRoles,
        staleTime: 1000 * 60 * 60, // 1 hour - roles rarely change
    });
}

/**
 * Hook to get role details with permissions
 */
export function useRole(roleId: number) {
    return useQuery({
        queryKey: roleKeys.detail(roleId),
        queryFn: () => rolesService.getRole(roleId),
        enabled: !!roleId,
    });
}

/**
 * Hook to create a new role
 */
export function useCreateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRoleRequest) => rolesService.createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
            toast.success('Role criada com sucesso');
        },
        onError: (error: Error) => {
            toast.error('Erro ao criar role', { description: error.message });
        },
    });
}

/**
 * Hook to update a role
 */
export function useUpdateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roleId, data }: { roleId: number; data: UpdateRoleRequest }) =>
            rolesService.updateRole(roleId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
            queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.roleId) });
            toast.success('Role atualizada');
        },
        onError: (error: Error) => {
            toast.error('Erro ao atualizar role', { description: error.message });
        },
    });
}

/**
 * Hook to delete a role
 */
export function useDeleteRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roleId: number) => rolesService.deleteRole(roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
            toast.success('Role excluída');
        },
        onError: (error: Error) => {
            toast.error('Erro ao excluir role', { description: error.message });
        },
    });
}

/**
 * Hook to get user's role assignments
 */
export function useUserRoles(userId: number) {
    return useQuery({
        queryKey: roleKeys.userRoles(userId),
        queryFn: () => rolesService.getUserRoles(userId),
        enabled: !!userId,
    });
}

/**
 * Hook to assign role to user
 */
export function useAssignUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: number; data: AssignRoleRequest }) =>
            rolesService.assignUserRole(userId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(variables.userId) });
            toast.success('Role atribuída');
        },
        onError: (error: Error) => {
            toast.error('Erro ao atribuir role', { description: error.message });
        },
    });
}

/**
 * Hook to remove role from user
 */
export function useRemoveUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, assignmentId }: { userId: number; assignmentId: number }) =>
            rolesService.removeUserRole(userId, assignmentId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(variables.userId) });
            toast.success('Role removida');
        },
        onError: (error: Error) => {
            toast.error('Erro ao remover role', { description: error.message });
        },
    });
}

/**
 * Hook to sync all user roles
 */
export function useSyncUserRoles() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, roles }: { userId: number; roles: AssignRoleRequest[] }) =>
            rolesService.syncUserRoles(userId, roles),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: roleKeys.userRoles(variables.userId) });
            toast.success('Roles sincronizadas');
        },
        onError: (error: Error) => {
            toast.error('Erro ao sincronizar roles', { description: error.message });
        },
    });
}
