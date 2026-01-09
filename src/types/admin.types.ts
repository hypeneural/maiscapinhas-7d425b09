/**
 * Admin Types
 * 
 * TypeScript types for admin/configuration API endpoints.
 * Based on backend API specification v1.0 (2026-01-08)
 */

import type { UserRole } from './api';

// ============================================================
// Admin Users
// ============================================================

/**
 * User with store bindings - response from /admin/users
 */
export interface AdminUserResponse {
    id: number;
    name: string;
    email: string;
    active: boolean;
    created_at: string;
    stores: UserStoreBinding[];
}

/**
 * Store binding for a user
 */
export interface UserStoreBinding {
    store_id: number;
    store_name: string;
    role: UserRole;
}

/**
 * Request to create a new user
 */
export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    active?: boolean;
    stores?: Array<{
        store_id: number;
        role: UserRole;
    }>;
}

/**
 * Request to update a user
 */
export interface UpdateUserRequest {
    name?: string;
    email?: string;
    password?: string;
    active?: boolean;
}

/**
 * Avatar upload/remove response
 */
export interface AvatarResponse {
    user_id: number;
    avatar_url: string | null;
}

// ============================================================
// Admin Stores
// ============================================================

/**
 * Store response from /admin/stores
 */
export interface AdminStoreResponse {
    id: number;
    name: string;
    city: string;
    active: boolean;
    users_count?: number;
    created_at: string;
    users?: StoreUserBinding[];
}

/**
 * User binding within a store
 */
export interface StoreUserBinding {
    user_id: number;
    user_name: string;
    user_email: string;
    user_active: boolean;
    role: UserRole;
    created_at: string;
}

/**
 * Request to create a store
 */
export interface CreateStoreRequest {
    name: string;
    city: string;
    active?: boolean;
}

/**
 * Request to update a store
 */
export interface UpdateStoreRequest {
    name?: string;
    city?: string;
    active?: boolean;
}

/**
 * Store photo upload/remove response
 */
export interface StorePhotoResponse {
    store_id: number;
    photo_url: string | null;
}

/**
 * Request to add user to store
 */
export interface CreateStoreUserRequest {
    user_id: number;
    role: UserRole;
}

/**
 * Request to update user role in store
 */
export interface UpdateStoreUserRequest {
    role: UserRole;
}

// ============================================================
// Monthly Goals
// ============================================================

/**
 * Monthly goal with splits
 */
export interface MonthlyGoalResponse {
    id: number;
    store_id: number;
    month: string; // YYYY-MM
    goal_amount: number;
    active: boolean;
    store: {
        id: number;
        name: string;
    };
    splits: GoalSplit[];
}

/**
 * Goal split for a single user
 */
export interface GoalSplit {
    user_id: number;
    percent: number;
    user: {
        id: number;
        name: string;
    };
}

/**
 * Request to create a goal
 */
export interface CreateGoalRequest {
    store_id: number;
    month: string; // YYYY-MM
    goal_amount: number;
    active?: boolean;
}

/**
 * Request to update a goal
 */
export interface UpdateGoalRequest {
    goal_amount?: number;
    active?: boolean;
}

/**
 * Request to set goal splits
 * NOTE: Backend validates that sum of percent = 100
 */
export interface SetSplitsRequest {
    splits: Array<{
        user_id: number;
        percent: number;
    }>;
}

// ============================================================
// Bonus Rules
// ============================================================

/**
 * Bonus tier configuration
 */
export interface BonusTier {
    min_sales: number;
    bonus: number;
}

/**
 * Bonus rule response
 */
export interface BonusRuleResponse {
    id: number;
    store_id: number | null;
    name: string;
    config_json: BonusTier[];
    effective_from: string;
    effective_to: string | null;
    version: number;
    active: boolean;
    store: {
        id: number;
        name: string;
    } | null;
}

/**
 * Request to create/update bonus rule
 */
export interface CreateBonusRuleRequest {
    store_id?: number | null;
    name: string;
    config_json: BonusTier[];
    effective_from: string;
    effective_to?: string | null;
    active?: boolean;
}

export type UpdateBonusRuleRequest = Partial<CreateBonusRuleRequest>;

// ============================================================
// Commission Rules
// ============================================================

/**
 * Commission tier configuration
 * min_rate: % achievement of monthly goal
 * commission_rate: % commission on sales
 */
export interface CommissionTier {
    min_rate: number;
    commission_rate: number;
}

/**
 * Commission rule response
 */
export interface CommissionRuleResponse {
    id: number;
    store_id: number | null;
    name: string;
    config_json: CommissionTier[];
    effective_from: string;
    effective_to: string | null;
    version: number;
    active: boolean;
    store: {
        id: number;
        name: string;
    } | null;
}

/**
 * Request to create/update commission rule
 */
export interface CreateCommissionRuleRequest {
    store_id?: number | null;
    name: string;
    config_json: CommissionTier[];
    effective_from: string;
    effective_to?: string | null;
    active?: boolean;
}

export type UpdateCommissionRuleRequest = Partial<CreateCommissionRuleRequest>;

// ============================================================
// Audit Logs
// ============================================================

/**
 * Audit log entry
 */
export interface AuditLogEntry {
    id: number;
    event: string;
    action: string;
    log_name: string;
    created_at: string;
    causer: {
        id: number;
        name: string;
        email: string;
    } | null;
    subject: {
        type: string;
        id: number;
    } | null;
    store: {
        id: number;
        name: string;
    } | null;
    context: Record<string, unknown>;
    properties: Record<string, unknown>;
}

/**
 * Audit log statistics
 */
export interface AuditStats {
    total_logs: number;
    by_log_name: Record<string, number>;
    by_action: Record<string, number>;
    unique_users: number;
    period: {
        from: string | null;
        to: string | null;
    };
}

/**
 * Audit log filters
 */
export interface AuditLogFilters {
    from?: string;
    to?: string;
    causer_id?: number;
    event?: string;
    log_name?: string;
    store_id?: number;
    subject_type?: string;
    subject_id?: number;
    per_page?: number;
    page?: number;
}

// ============================================================
// List Filters
// ============================================================

/**
 * Common list filters for admin endpoints
 */
export interface AdminListFilters {
    search?: string;
    active?: boolean;
    store_id?: number;
    per_page?: number;
    page?: number;
}

/**
 * Goal list filters
 */
export interface GoalListFilters {
    store_id?: number;
    per_page?: number;
    page?: number;
}

/**
 * Rule list filters
 */
export interface RuleListFilters {
    store_id?: number;
    per_page?: number;
    page?: number;
}
