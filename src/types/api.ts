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
export type UserRole = 'admin' | 'gerente' | 'conferente' | 'vendedor' | 'fabrica';

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
 * Store role assignment for a user (from /me endpoint)
 */
export interface UserStore {
    id: number;
    name: string;
    city: string;
    role: UserRole;
}

/**
 * User entity (core user data)
 * Matches the /me endpoint response
 */
export interface User {
    id: number;
    name: string;
    email: string;
    active: boolean;
    is_super_admin?: boolean;       // Super Administrator flag - has access to everything
    is_global_admin?: boolean;      // True if is_super_admin OR admin in any store
    has_fabrica_access?: boolean;   // True if has 'fabrica' role (Spatie)
    roles?: string[];               // Global roles from Spatie (e.g., ['fabrica'])
    whatsapp?: string | null;
    avatar_url?: string | null;
    instagram?: string | null;
    birth_date?: string | null;     // YYYY-MM-DD
    hire_date?: string | null;      // YYYY-MM-DD (data de admissão)
    created_at?: string;            // ISO 8601
    // Legacy field (some older code uses phone)
    phone?: string;
}

/**
 * User with stores (full user context)
 */
export interface UserWithStores extends User {
    stores: UserStore[];
}

/**
 * Login request body
 */
export interface LoginRequest {
    email: string;
    password: string;
    device_name?: string;
}

/**
 * Auth login response
 */
export interface LoginResponse {
    token: string;
    token_type: 'Bearer';
    user: User;
}

/**
 * Current store context (from /me)
 */
export interface CurrentStore {
    id: number;
    name: string;
    slug: string;
}

/**
 * Temporary permission (from /me)
 */
export interface TemporaryPermission {
    permission: string;
    expires_at: string;
    granted_by: string;
}

/**
 * Expiring soon permission (from /me)
 */
export interface ExpiringPermission {
    permission: string;
    expires_in_hours: number;
}

/**
 * Dashboard layout configuration (from /me)
 */
export interface DashboardLayout {
    widgets: string[];
}

/**
 * Current user response (GET /me) - Backend returns user and stores separately
 */
export interface CurrentUserResponse {
    user: User;
    stores: UserStore[];

    /** Current store context */
    current_store?: CurrentStore;

    /** All roles assigned to user */
    roles?: string[];

    /** All resolved permissions (abilities + screens + features) */
    permissions?: string[];

    /** Temporary permissions with expiration */
    temporary_permissions?: TemporaryPermission[];

    /** Permissions expiring soon (< 7 days) */
    expiring_soon?: ExpiringPermission[];

    /** Dashboard layout configuration */
    dashboard_layout?: DashboardLayout;
}

// ============================================================
// Store
// ============================================================

/**
 * Store entity
 */
export interface Store {
    id: number;
    guid?: string | null;
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
 * Bonus gamification data (from /dashboard/vendedor)
 */
export interface BonusGamification {
    current_amount: number;
    next_bonus_goal: number;
    gap_to_bonus: number;
    next_bonus_value: number;
    current_bonus_earned: number;
    message: string;
}

/**
 * Monthly commission data (from /dashboard/vendedor)
 */
export interface MonthlyCommission {
    sales_mtd: number;
    goal_amount: number;
    achievement_rate: number;
    current_tier: number;
    current_commission_value: number;
    next_tier: number;
    potential_commission: number;
}

/**
 * Daily pace status (from /dashboard/vendedor)
 */
export interface DailyPace {
    today_sales: number;
    average_daily_sales: number;
    today_vs_average: number;
    status: 'AHEAD' | 'BEHIND' | 'ON_TRACK';
}

/**
 * Seller dashboard response (GET /dashboard/vendedor)
 */
export interface SellerDashboard {
    date: string;
    my_sales: { count: number; total: number };
    store_sales: { count: number; total: number };
    bonus_gamification: BonusGamification;
    monthly_commission: MonthlyCommission;
    daily_pace: DailyPace;
    my_shifts: CashShift[];
}

/**
 * Conferente dashboard response (GET /dashboard/conferente)
 */
export interface ConferenteDashboard {
    date: string;
    pending_closings: CashClosing[];
    pending_count: number;
    store_sales: { count: number; total: number };
    shifts_today: Record<string, number>;
    top_sellers: Array<{ seller_id: number; name: string; total: number }>;
}

/**
 * Admin dashboard sales by store
 */
export interface SalesByStore {
    store_id: number;
    store_name: string;
    count: number;
    total: number;
}

/**
 * Admin dashboard response (GET /dashboard/admin)
 */
export interface AdminDashboard {
    month: string;
    total_sales: { count: number; total: number };
    sales_by_store: SalesByStore[];
    closings_summary: Record<string, number>;
    top_sellers: Array<{
        seller_id: number;
        name: string;
        total: number;
        count: number;
    }>;
}

/**
 * @deprecated Use SellerDashboard instead
 */
export interface GamificationData {
    next_bonus_tier: BonusTier;
    gap_to_next: number;
    message: string;
}

/**
 * @deprecated Use ConferenteDashboard instead
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
        avatar_url: string | null;
        store_name: string;
    };
    total_sold: number;
    sale_count: number;           // Quantidade de vendas
    goal: number;
    achievement_rate: number;
    bonus_accumulated: number;
}

/**
 * Ranking response
 */
export interface RankingResponse {
    period: string;
    store_id: number | null;      // null = todas as lojas
    podium: RankingEntry[];       // Top 3
    ranking: RankingEntry[];      // Posição 4+
    stats: {
        total_sellers: number;
        above_goal: number;
        below_goal: number;
        average_achievement: number;
    };
}

/**
 * Ranking filters
 */
export interface RankingFilters {
    month?: string;
    date?: string;
    from?: string;
    to?: string;
    period?: ReportPeriodPreset;
    store_id?: number | string;
    limit?: number;
    order?: 'asc' | 'desc';
}

export type ReportPeriodPreset =
    | 'today'
    | 'yesterday'
    | 'last_7_days'
    | 'last_30_days'
    | 'this_month'
    | 'last_month';

export interface ConsolidatedPerformanceFilters {
    month?: string;
    date?: string;
    from?: string;
    to?: string;
    period?: ReportPeriodPreset;
    store_id?: number | string;
}

// ============================================================
// Store Performance & Consolidated Reports
// ============================================================

/**
 * Store performance data from /reports/store-performance
 */
export interface StorePerformance {
    store_id: number;
    period: string;              // "YYYY-MM"
    days_elapsed: number;        // Dias corridos
    days_total: number;          // Total de dias no mês

    sales: {
        current_amount: number;    // Vendas até agora
        goal_amount: number;       // Meta mensal
        achievement_rate: number;  // % atingimento
        remaining_to_goal: number; // Falta para meta
    };

    comparison: {
        same_period_last_year: number;  // Mesmo período ano passado
        total_last_year_month: number;  // Total mês ano passado
        yoy_growth: number;             // % crescimento YoY
    };

    forecast: {
        linear_projection: number;   // Run rate
        trend_projection: number;    // Baseado em YoY
        status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND';
    };
}

/**
 * Consolidated totals for all stores
 */
export interface ConsolidatedTotals {
    total_sales: number;
    total_goal: number;
    total_achievement_rate: number;
    total_linear_projection: number;
}

/**
 * Consolidated performance response from /reports/consolidated
 */
export interface ConsolidatedPerformanceResponse {
    period: string;
    stores: StorePerformance[];
    consolidated: ConsolidatedTotals;
}

// ============================================================
// Cash Integrity Reports
// ============================================================

/**
 * Cash integrity alert
 */
export interface CashAlert {
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    code: string;
    message: string;
}

/**
 * Cash integrity report data from /reports/cash-integrity
 */
export interface CashIntegrityData {
    store_id: number;
    period: string;

    cash_integrity: {
        total_system_value: number;     // Esperado pelo sistema
        total_real_value: number;       // Valor real contado
        total_divergence: number;       // Diferença (negativo = falta)
        cash_break_percentage: number;  // % quebra
        status: 'GREEN' | 'YELLOW' | 'RED';
    };

    divergence_analysis: {
        total_lines_with_divergence: number;
        justified_count: number;
        unjustified_count: number;
        justified_rate: number;  // % justificadas
    };

    workflow_status: {
        total_shifts: number;       // Turnos no período
        closed_count: number;       // Aprovados
        pending_approval: number;   // Aguardando aprovação
        completion_rate: number;    // % concluídos
    };

    alerts: CashAlert[];
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

// ============================================================
// User KPIs
// ============================================================

/**
 * User KPIs filter parameters
 */
export interface UserKpisFilters {
    active?: '0' | '1' | 'all';
    state?: string;
    city?: string;
    date_from?: string;  // YYYY-MM-DD
    date_to?: string;    // YYYY-MM-DD
}

/**
 * User KPIs response from /api/v1/users/kpis
 */
export interface UserKpisResponse {
    filters: {
        active: number | 'all';
        state: string | null;
        city: string | null;
        date_from: string | null;
        date_to: string | null;
    };

    totals: {
        users_total: number;
        active_total: number;
        inactive_total: number;
        with_birth_date_total: number;
        with_hire_date_total: number;
        without_city_total: number;
    };

    age: {
        avg_age_years: number | null;
        youngest_age_years: number | null;
        youngest_birth_date: string | null;
        oldest_age_years: number | null;
        oldest_birth_date: string | null;
        age_population_total: number;
    };

    tenure: {
        avg_tenure_days: number | null;
        avg_tenure_months: number | null;
        longest_tenure_days: number | null;
        longest_hire_date: string | null;
        newest_tenure_days: number | null;
        newest_hire_date: string | null;
        tenure_population_total: number;
    };

    distribution: {
        cities_total_distinct: number;
        top_city: {
            city: string;
            qty: number;
            pct: number;
        } | null;
        by_city: Array<{
            city: string;
            qty: number;
            pct: number;
        }>;
    };
}

