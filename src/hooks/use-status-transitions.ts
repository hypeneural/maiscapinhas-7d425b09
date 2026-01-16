/**
 * useStatusTransitions Hook
 * 
 * Hook for checking allowed status transitions based on module's transition_role_matrix.
 * Uses the module configuration from /admin/modules/{id}/full endpoint.
 */

import { useMemo } from 'react';
import { useModuleFull } from './api/use-modules';
import { usePermissions } from './usePermissions';
import type { TransitionRoleMatrix } from '@/types/modules.types';

interface UseStatusTransitionsOptions {
    /** Module ID (e.g. 'pedidos-simples', 'capas-personalizadas') */
    moduleId: string;
    /** Current status ID */
    currentStatus: number;
}

interface UseStatusTransitionsReturn {
    /** List of status IDs user can transition to */
    allowedTransitions: number[];
    /** Check if a specific transition is allowed */
    canTransitionTo: (targetStatus: number) => boolean;
    /** Check if any transition is available */
    hasAnyTransition: boolean;
    /** Loading state */
    isLoading: boolean;
    /** Error if module failed to load */
    error: Error | null;
}

/**
 * Hook to get allowed status transitions for current user based on module configuration
 * 
 * @example
 * const { canTransitionTo, allowedTransitions } = useStatusTransitions({
 *     moduleId: 'pedidos-simples',
 *     currentStatus: pedido.status,
 * });
 * 
 * // Only show status buttons that user can transition to
 * {allowedTransitions.map(statusId => (
 *     <StatusButton key={statusId} status={statusId} />
 * ))}
 */
export function useStatusTransitions({
    moduleId,
    currentStatus,
}: UseStatusTransitionsOptions): UseStatusTransitionsReturn {
    const { data: moduleFull, isLoading, error } = useModuleFull(moduleId);
    const { currentRole, isSuperAdmin } = usePermissions();

    const allowedTransitions = useMemo(() => {
        // Super admin can do any transition
        if (isSuperAdmin && moduleFull?.transitions) {
            const statusKey = String(currentStatus);
            return moduleFull.transitions[statusKey] || [];
        }

        if (!moduleFull?.transition_role_matrix || !currentRole) {
            return [];
        }

        const roleMatrix = moduleFull.transition_role_matrix;
        const fromStatusKey = String(currentStatus);

        // Get transitions from this status
        const transitionsFromCurrent = roleMatrix[fromStatusKey];
        if (!transitionsFromCurrent) {
            return [];
        }

        // Filter to only transitions allowed for current user's role
        const allowed: number[] = [];
        for (const [toStatus, roles] of Object.entries(transitionsFromCurrent)) {
            if (roles.includes(currentRole) || roles.includes('*')) {
                allowed.push(parseInt(toStatus, 10));
            }
        }

        return allowed;
    }, [moduleFull, currentStatus, currentRole, isSuperAdmin]);

    const canTransitionTo = useMemo(() => {
        return (targetStatus: number): boolean => {
            return allowedTransitions.includes(targetStatus);
        };
    }, [allowedTransitions]);

    return {
        allowedTransitions,
        canTransitionTo,
        hasAnyTransition: allowedTransitions.length > 0,
        isLoading,
        error: error as Error | null,
    };
}

/**
 * Get all available statuses from a module
 */
export function useModuleStatuses(moduleId: string) {
    const { data: moduleFull, isLoading, error } = useModuleFull(moduleId);

    const statuses = useMemo(() => {
        if (!moduleFull?.statuses) return [];
        return Object.entries(moduleFull.statuses).map(([key, status]) => ({
            id: parseInt(key, 10),
            ...status,
        }));
    }, [moduleFull]);

    return { statuses, isLoading, error };
}
