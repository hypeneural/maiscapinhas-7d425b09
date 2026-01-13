/**
 * Admin Types
 * 
 * TypeScript types for admin/configuration API endpoints.
 * Based on backend API specification v2.0 (2026-01-13)
 */

import type { UserRole } from './api';

// ============================================================
// Roles & Permissions
// ============================================================

/** Global roles managed by Spatie (not store-specific) */
export type GlobalRole = 'fabrica';

/** Store-specific roles */
export type StoreRole = UserRole;

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

    // Permissions
    is_super_admin: boolean;
    is_global_admin: boolean;       // super_admin OR admin in any store
    has_fabrica_access: boolean;    // Has 'fabrica' role
    roles: GlobalRole[];            // Global roles from Spatie

    // Profile
    birth_date: string | null;      // "YYYY-MM-DD"
    hire_date: string | null;       // "YYYY-MM-DD"
    whatsapp: string | null;
    avatar_url: string | null;
    instagram: string | null;
    cpf: string | null;             // "123.456.789-00"
    pix_key: string | null;

    // Address
    zip_code: string | null;        // max 8, only digits
    street: string | null;          // max 255
    number: string | null;          // max 20
    complement: string | null;      // max 255
    neighborhood: string | null;    // max 100
    city: string | null;            // max 255
    state: string | null;           // max 2 (UF)

    created_at: string;
    updated_at: string;
    stores: UserStoreBinding[];
}

/**
 * Store binding for a user
 */
export interface UserStoreBinding {
    store_id: number;
    store_name: string;
    store_city: string | null;
    role: UserRole;
}

/**
 * Request to create a new user
 */
export interface CreateUserRequest {
    // Required fields
    name: string;
    email: string;
    password: string;

    // Optional fields
    active?: boolean;
    is_super_admin?: boolean;
    roles?: GlobalRole[];       // Global roles (e.g., ['fabrica'])
    birth_date?: string;        // "YYYY-MM-DD"
    hire_date?: string;         // "YYYY-MM-DD"
    whatsapp?: string;          // max 20
    instagram?: string;         // max 50, "@username"
    cpf?: string;               // max 14, "123.456.789-00"
    pix_key?: string;           // max 255

    // Address
    zip_code?: string;          // max 8
    street?: string;            // max 255
    number?: string;            // max 20
    complement?: string;        // max 255
    neighborhood?: string;      // max 100
    city?: string;              // max 255
    state?: string;             // max 2 (UF)

    // Store bindings (created at same time as user)
    stores?: Array<{
        store_id: number;
        role: StoreRole;
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
    is_super_admin?: boolean;
    roles?: GlobalRole[];           // Update global roles
    birth_date?: string | null;
    hire_date?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
    cpf?: string | null;
    pix_key?: string | null;

    // Address
    zip_code?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
}

/**
 * Avatar upload/remove response
 */
export interface AvatarResponse {
    user_id: number;
    avatar_url: string | null;
}

// ============================================================
// Bulk Store Operations
// ============================================================

/** POST /admin/users/{id}/stores/bulk - Add to multiple stores */
export interface BulkAddStoresRequest {
    stores: Array<{
        store_id: number;
        role: StoreRole;
    }>;
}

export interface BulkAddStoresResponse {
    message: string;
    created: number[];   // store_ids that were added
    skipped: number[];   // store_ids already linked
}

/** PATCH /admin/users/{id}/stores/bulk - Update role in multiple stores */
export interface BulkUpdateStoresRequest {
    role: StoreRole;
    store_ids: number[];
}

export interface BulkUpdateStoresResponse {
    message: string;
    updated_count: number;
}

/** DELETE /admin/users/{id}/stores/bulk - Remove from multiple stores */
export interface BulkRemoveStoresRequest {
    store_ids: number[];
}

export interface BulkRemoveStoresResponse {
    message: string;
    deleted_count: number;
}

/** PUT /admin/users/{id}/stores - Sync all stores (replace) */
export interface SyncStoresRequest {
    stores: Array<{
        store_id: number;
        role: StoreRole;
    }>;
}

export interface SyncStoresResponse {
    message: string;
    user: AdminUserResponse;
}

// ============================================================
// Admin Stores
// ============================================================

/**
 * Time slot for opening hours
 */
export interface TimeSlot {
    start: string;  // HH:MM format
    end: string;    // HH:MM format
}

/**
 * Exception for specific date
 */
export interface HoursException {
    date: string;           // YYYY-MM-DD
    closed?: boolean;       // true = closed this day
    hours?: TimeSlot[];     // special hours (overrides weekly)
    reason?: string;        // ex: "Natal"
}

/**
 * Weekly schedule
 */
export interface WeeklySchedule {
    mon: TimeSlot[];
    tue: TimeSlot[];
    wed: TimeSlot[];
    thu: TimeSlot[];
    fri: TimeSlot[];
    sat: TimeSlot[];
    sun: TimeSlot[];
}

/**
 * Opening hours structure
 */
export interface OpeningHours {
    tz: string;                     // Timezone IANA (ex: America/Sao_Paulo)
    weekly: WeeklySchedule;
    exceptions?: HoursException[];
}

/**
 * Human-readable hours info (from API)
 */
export interface HoursHuman {
    is_open_now: boolean;
    status_label: string;
    today_hours_label: string;
    weekly_label: string;
}

/**
 * Store response from /admin/stores
 */
export interface AdminStoreResponse {
    id: number;
    name: string;
    codigo: string | null;
    city: string;
    active: boolean;
    troco_padrao: number | null;

    // Image
    photo_url: string | null;

    // Address
    address: string | null;
    neighborhood: string | null;
    state: string | null;           // UF (2 chars)
    zip_code: string | null;
    full_address: string | null;    // Calculated by backend

    // GPS
    latitude: number | null;
    longitude: number | null;

    // Contact
    phone: string | null;
    whatsapp: string | null;
    instagram: string | null;

    // Business
    opening_hours: OpeningHours | null;
    cnpj: string | null;
    bio_enabled: boolean;

    created_at: string;
    updated_at: string;

    // Relationships
    users_count?: number;
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
    avatar_url: string | null;
    role: UserRole;
    created_at: string;
}

/**
 * Request to create a store
 */
export interface CreateStoreRequest {
    // Required
    name: string;
    city: string;

    // Optional
    active?: boolean;
    codigo?: string;            // max 20

    // Address
    address?: string;           // max 255
    neighborhood?: string;      // max 100
    state?: string;             // max 2 (UF)
    zip_code?: string;          // max 10

    // GPS
    latitude?: number;          // -90 to 90
    longitude?: number;         // -180 to 180

    // Contact
    phone?: string;             // max 20
    whatsapp?: string;          // max 20
    instagram?: string;         // max 50

    // Business
    opening_hours?: OpeningHours;
    cnpj?: string;              // max 18
    troco_padrao?: number;      // min 0
    bio_enabled?: boolean;
}

/**
 * Request to update a store
 */
export interface UpdateStoreRequest {
    name?: string;
    city?: string;
    active?: boolean;
    codigo?: string | null;
    address?: string | null;
    neighborhood?: string | null;
    state?: string | null;
    zip_code?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string | null;
    whatsapp?: string | null;
    instagram?: string | null;
    opening_hours?: OpeningHours | null;
    cnpj?: string | null;
    troco_padrao?: number | null;
    bio_enabled?: boolean;
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
    has_stores?: boolean;           // true = with stores, false = without stores
    role?: GlobalRole;              // Filter by global role (e.g., 'fabrica')
    is_global_admin?: boolean;      // true = super_admin or admin in any store
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
