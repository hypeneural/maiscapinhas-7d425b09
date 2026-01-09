/**
 * Goals Service
 * 
 * API service for monthly goals management.
 * Includes CRUD operations and split management.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    MonthlyGoalResponse,
    CreateGoalRequest,
    UpdateGoalRequest,
    SetSplitsRequest,
    GoalListFilters,
} from '@/types/admin.types';

/**
 * List monthly goals with optional filters
 */
export async function listGoals(
    filters?: GoalListFilters
): Promise<PaginatedResponse<MonthlyGoalResponse>> {
    const params: Record<string, unknown> = {};

    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.page) params.page = filters.page;

    return apiGet<PaginatedResponse<MonthlyGoalResponse>>('/goals/monthly', params);
}

/**
 * Get a single goal by ID
 */
export async function getGoal(id: number): Promise<MonthlyGoalResponse> {
    const response = await apiGet<ApiResponse<MonthlyGoalResponse>>(`/goals/monthly/${id}`);
    return response.data;
}

/**
 * Create a new monthly goal
 * NOTE: Cannot duplicate store_id + month (returns 409)
 */
export async function createGoal(data: CreateGoalRequest): Promise<MonthlyGoalResponse> {
    const response = await apiPost<ApiResponse<MonthlyGoalResponse>>('/goals/monthly', data);
    return response.data;
}

/**
 * Update an existing goal
 */
export async function updateGoal(
    id: number,
    data: UpdateGoalRequest
): Promise<MonthlyGoalResponse> {
    const response = await apiPut<ApiResponse<MonthlyGoalResponse>>(`/goals/monthly/${id}`, data);
    return response.data;
}

/**
 * Delete a goal
 */
export async function deleteGoal(id: number): Promise<void> {
    await apiDelete(`/goals/monthly/${id}`);
}

/**
 * Set goal splits (% distribution per seller)
 * NOTE: Backend validates that sum of percent = 100
 * 
 * @param id Goal ID
 * @param splits Array of { user_id, percent } - must sum to 100
 */
export async function setSplits(
    id: number,
    splits: SetSplitsRequest['splits']
): Promise<MonthlyGoalResponse> {
    const response = await apiPut<ApiResponse<MonthlyGoalResponse>>(
        `/goals/monthly/${id}/splits`,
        { splits }
    );
    return response.data;
}

/**
 * Goals Service object for easy importing
 */
export const goalsService = {
    list: listGoals,
    get: getGoal,
    create: createGoal,
    update: updateGoal,
    delete: deleteGoal,
    setSplits,
};

export default goalsService;
