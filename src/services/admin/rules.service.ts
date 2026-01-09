/**
 * Rules Service
 * 
 * API service for bonus and commission rules management.
 * Includes CRUD operations for both rule types.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    BonusRuleResponse,
    CreateBonusRuleRequest,
    UpdateBonusRuleRequest,
    CommissionRuleResponse,
    CreateCommissionRuleRequest,
    UpdateCommissionRuleRequest,
    RuleListFilters,
} from '@/types/admin.types';

// ============================================================
// Bonus Rules
// ============================================================

/**
 * List bonus rules with optional filters
 */
export async function listBonusRules(
    filters?: RuleListFilters
): Promise<PaginatedResponse<BonusRuleResponse>> {
    const params: Record<string, unknown> = {};

    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.page) params.page = filters.page;

    return apiGet<PaginatedResponse<BonusRuleResponse>>('/rules/bonus', params);
}

/**
 * Get a single bonus rule by ID
 */
export async function getBonusRule(id: number): Promise<BonusRuleResponse> {
    const response = await apiGet<ApiResponse<BonusRuleResponse>>(`/rules/bonus/${id}`);
    return response.data;
}

/**
 * Create a new bonus rule
 * store_id: null = global rule for all stores
 */
export async function createBonusRule(
    data: CreateBonusRuleRequest
): Promise<BonusRuleResponse> {
    const response = await apiPost<ApiResponse<BonusRuleResponse>>('/rules/bonus', data);
    return response.data;
}

/**
 * Update an existing bonus rule
 */
export async function updateBonusRule(
    id: number,
    data: UpdateBonusRuleRequest
): Promise<BonusRuleResponse> {
    const response = await apiPut<ApiResponse<BonusRuleResponse>>(`/rules/bonus/${id}`, data);
    return response.data;
}

/**
 * Delete a bonus rule
 */
export async function deleteBonusRule(id: number): Promise<void> {
    await apiDelete(`/rules/bonus/${id}`);
}

// ============================================================
// Commission Rules
// ============================================================

/**
 * List commission rules with optional filters
 */
export async function listCommissionRules(
    filters?: RuleListFilters
): Promise<PaginatedResponse<CommissionRuleResponse>> {
    const params: Record<string, unknown> = {};

    if (filters?.store_id) params.store_id = filters.store_id;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.page) params.page = filters.page;

    return apiGet<PaginatedResponse<CommissionRuleResponse>>('/rules/commission', params);
}

/**
 * Get a single commission rule by ID
 */
export async function getCommissionRule(id: number): Promise<CommissionRuleResponse> {
    const response = await apiGet<ApiResponse<CommissionRuleResponse>>(`/rules/commission/${id}`);
    return response.data;
}

/**
 * Create a new commission rule
 * store_id: null = global rule for all stores
 */
export async function createCommissionRule(
    data: CreateCommissionRuleRequest
): Promise<CommissionRuleResponse> {
    const response = await apiPost<ApiResponse<CommissionRuleResponse>>('/rules/commission', data);
    return response.data;
}

/**
 * Update an existing commission rule
 */
export async function updateCommissionRule(
    id: number,
    data: UpdateCommissionRuleRequest
): Promise<CommissionRuleResponse> {
    const response = await apiPut<ApiResponse<CommissionRuleResponse>>(`/rules/commission/${id}`, data);
    return response.data;
}

/**
 * Delete a commission rule
 */
export async function deleteCommissionRule(id: number): Promise<void> {
    await apiDelete(`/rules/commission/${id}`);
}

// ============================================================
// Service Objects
// ============================================================

/**
 * Bonus Rules Service object
 */
export const bonusRulesService = {
    list: listBonusRules,
    get: getBonusRule,
    create: createBonusRule,
    update: updateBonusRule,
    delete: deleteBonusRule,
};

/**
 * Commission Rules Service object
 */
export const commissionRulesService = {
    list: listCommissionRules,
    get: getCommissionRule,
    create: createCommissionRule,
    update: updateCommissionRule,
    delete: deleteCommissionRule,
};

/**
 * Combined rules service
 */
export const rulesService = {
    bonus: bonusRulesService,
    commission: commissionRulesService,
};

export default rulesService;
