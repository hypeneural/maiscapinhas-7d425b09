/**
 * MaisCapinhas ERP API Types
 * 
 * TypeScript interfaces aligned with the API responses.
 * All types use English naming to match API conventions.
 */

// ============================================================
// Base Types
// ============================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    data: T;
    meta: {
        request_id: string;
        timestamp: string;
    };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
        request_id?: string;
        timestamp?: string;
    };
}

/**
 * Payment methods accepted by the system
 */
export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito';

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'gerente' | 'conferente' | 'vendedor';

/**
 * Cash shift codes (time periods)
 */
export type ShiftCode = 'M' | 'T' | 'N';

/**
 * Cash shift status
 */
export type ShiftStatus = 'open' | 'submitted' | 'approved' | 'rejected';

/**
 * Bonus eligibility status
 */
export type BonusStatus = 'provisional' | 'confirmed' | 'zeroed';

// ============================================================
// User & Auth
// ============================================================

/**
 * Store role assignment for a user
 */
export interface StoreRole {
    id: number;
    name: string;
    role: UserRole;
}

/**
 * User entity
 */
export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    birth_date?: string;
    active: boolean;
    stores: StoreRole[];
}

/**
 * Auth login response
 */
export interface LoginResponse {
    token: string;
    token_type: string;
    user: User;
}

/**
 * Current user response (GET /me)
 */
export interface CurrentUserResponse {
    user: User;
}

// ============================================================
// Store
// ============================================================

/**
 * Store entity
 */
export interface Store {
    id: number;
    name: string;
    codigo: string;
    address: string;
    phone: string;
    troco_padrao: number;
    photo_url: string | null;
    active: boolean;
}

/**
 * Seller info within a store
 */
export interface StoreSeller {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    role: UserRole;
}

// ============================================================
// Sales
// ============================================================

/**
 * Sale entity
 */
export interface Sale {
    id: number;
    store_id: number;
    seller_id: number;
    amount: number;
    payment_method: PaymentMethod;
    sold_at: string;
    created_at: string;
    seller?: {
        id: number;
        name: string;
    };
    store?: {
        id: number;
        name: string;
    };
}

/**
 * Create sale request body
 */
export interface CreateSaleRequest {
    store_id: number;
    amount: number;
    payment_method: PaymentMethod;
    sold_at?: string;
}

/**
 * Sales filter parameters
 */
export interface SalesFilters {
    store_id?: number;
    seller_id?: number;
    from?: string;
    to?: string;
    per_page?: number;
    page?: number;
}

// ============================================================
// Cash Shifts & Closings
// ============================================================

/**
 * Cash closing line (per payment method)
 */
export interface CashClosingLine {
    payment_method: PaymentMethod;
    system_amount: number;
    real_amount: number;
    divergence: number;
    justification?: string;
}

/**
 * Cash closing entity
 */
export interface CashClosing {
    id: number;
    lines: CashClosingLine[];
    submitted_at?: string;
    approved_at?: string;
    reviewer_id?: number;
}

/**
 * Cash shift entity
 */
export interface CashShift {
    id: number;
    store_id: number;
    seller_id: number;
    date: string;
    shift_code: ShiftCode;
    status: ShiftStatus;
    system_total: number;
    real_total?: number;
    divergence?: number;
    closing?: CashClosing;
    seller?: {
        id: number;
        name: string;
    };
    store?: {
        id: number;
        name: string;
    };
}

/**
 * Pending shift summary
 */
export interface PendingShift {
    id: number;
    store_id: number;
    store_name: string;
    seller_id: number;
    seller_name: string;
    date: string;
    shift_code: ShiftCode;
    days_pending: number;
    priority: 'low' | 'medium' | 'high';
}

/**
 * Pending shifts response
 */
export interface PendingShiftsResponse {
    total_pending: number;
    shifts: PendingShift[];
}

/**
 * Submit closing request body
 */
export interface SubmitClosingRequest {
    lines: Array<{
        payment_method: PaymentMethod;
        system_amount: number;
        real_amount: number;
        justification?: string;
    }>;
}

/**
 * Cash shifts filter parameters
 */
export interface CashShiftsFilters {
    store_id?: number;
    seller_id?: number;
    from?: string;
    to?: string;
    status?: ShiftStatus;
    per_page?: number;
    page?: number;
}

// ============================================================
// Finance - Bonus & Commission
// ============================================================

/**
 * Seller bonus entry
 */
export interface SellerBonus {
    date: string;
    sales_total: number;
    bonus_amount: number;
    status: BonusStatus;
    eligible: boolean;
}

/**
 * Bonus tier configuration
 */
export interface BonusTier {
    min_sales: number;
    bonus: number;
}

/**
 * Bonus calculation result
 */
export interface BonusCalculation {
    sales_amount: number;
    bonus_value: number;
    tier_applied: BonusTier;
    next_tier?: BonusTier & { gap: number };
}

/**
 * Commission projection scenario
 */
export interface CommissionScenario {
    sales: number;
    rate: number;
    commission: number;
}

/**
 * Commission projection response
 */
export interface CommissionProjection {
    seller: {
        id: number;
        name: string;
    };
    current: {
        sales_mtd: number;
        goal: number;
        achievement_rate: number;
        current_tier: number;
    };
    projection: {
        optimistic: CommissionScenario;
        realistic: CommissionScenario;
        pessimistic: CommissionScenario;
    };
    days_remaining: number;
}

// ============================================================
// Dashboard
// ============================================================

/**
 * Seller dashboard gamification data
 */
export interface GamificationData {
    next_bonus_tier: BonusTier;
    gap_to_next: number;
    message: string;
}

/**
 * Seller dashboard response
 */
export interface SellerDashboard {
    today: {
        total_sold: number;
        daily_goal: number;
        achievement_rate: number;
        current_bonus: number;
    };
    month: {
        total_sold: number;
        goal: number;
        achievement_rate: number;
    };
    gamification: GamificationData;
    shift?: {
        end_time: string;
        shift_code: ShiftCode;
    };
}

/**
 * Store dashboard response
 */
export interface StoreDashboard {
    today: {
        total_sold: number;
        daily_goal: number;
        achievement_rate: number;
    };
    month: {
        total_sold: number;
        goal: number;
        achievement_rate: number;
    };
    pending_shifts: number;
    divergent_shifts: number;
    top_sellers: Array<{
        seller: { id: number; name: string; avatar_url?: string };
        total_sold: number;
        achievement_rate: number;
    }>;
}

/**
 * Admin dashboard store status
 */
export interface StoreStatus {
    store: Store;
    percentual_meta: number;
    status: 'verde' | 'amarelo' | 'vermelho';
}

/**
 * Admin dashboard response
 */
export interface AdminDashboard {
    stores_overview: StoreStatus[];
    total_sales_mtd: number;
    total_goal: number;
    achievement_rate: number;
    pending_closings: number;
    divergent_closings: number;
}

// ============================================================
// Reports & Ranking
// ============================================================

/**
 * Ranking entry for a seller
 */
export interface RankingEntry {
    position: number;
    seller: {
        id: number;
        name: string;
        avatar_url?: string;
        store_name: string;
    };
    total_sold: number;
    goal: number;
    achievement_rate: number;
    bonus_accumulated: number;
}

/**
 * Ranking response
 */
export interface RankingResponse {
    period: string;
    podium: RankingEntry[];
    ranking: RankingEntry[];
    stats: {
        total_sellers: number;
        above_goal: number;
        average_achievement: number;
    };
}

/**
 * Ranking filters
 */
export interface RankingFilters {
    month?: string;
    store_id?: number;
    limit?: number;
}

/**
 * Birthday entry
 */
export interface BirthdayEntry {
    id: number;
    name: string;
    avatar_url?: string;
    birth_date: string;
    store_name: string;
}

// ============================================================
// Rules Configuration
// ============================================================

/**
 * Bonus rule configuration
 */
export interface BonusRule {
    id: number;
    store_id: number | null;
    name: string;
    config_json: BonusTier[];
    valid_from: string;
    valid_to: string | null;
    active: boolean;
}

/**
 * Commission rule configuration
 */
export interface CommissionRule {
    id: number;
    store_id: number | null;
    name: string;
    tiers: Array<{
        min_rate: number;
        commission_rate: number;
    }>;
    valid_from: string;
    valid_to: string | null;
    active: boolean;
}

// ============================================================
// Goals
// ============================================================

/**
 * Monthly goal entity
 */
export interface MonthlyGoal {
    id: number;
    store_id: number;
    month: string;
    amount: number;
    splits: Array<{
        user_id: number;
        percentage: number;
        user?: {
            id: number;
            name: string;
        };
    }>;
}

/**
 * Goal splits update request
 */
export interface UpdateGoalSplitsRequest {
    splits: Array<{
        user_id: number;
        percentage: number;
    }>;
}

// ============================================================
// Admin
// ============================================================

/**
 * Create user request
 */
export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    birth_date?: string;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
    name?: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    active?: boolean;
}

/**
 * Assign user to store request
 */
export interface AssignUserToStoreRequest {
    user_id: number;
    role: UserRole;
}

/**
 * Audit log entry
 */
export interface AuditLog {
    id: number;
    user_id: number;
    user_name: string;
    action: string;
    entity_type: string;
    entity_id: number;
    changes: Record<string, unknown>;
    ip_address: string;
    created_at: string;
}
