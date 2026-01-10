/**
 * Dashboard Types
 * 
 * Types for dashboard endpoints based on backend API specification.
 * Each role has its own dashboard structure with optimized data.
 */

// ============================================================
// Common Types
// ============================================================

export type ShiftCode = 'M' | 'T' | 'N';
export type PaceStatus = 'AHEAD' | 'ON_TRACK' | 'BEHIND';
export type ForecastStatus = 'ON_TRACK' | 'AT_RISK' | 'BEHIND';
export type StoreStatusColor = 'green' | 'yellow' | 'red';
export type ClosingStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type AlertType = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SalesCount {
    count: number;
    total: number;
}

// ============================================================
// Vendedor Dashboard Types
// ============================================================

export interface BonusGamification {
    current_amount: number;
    next_bonus_goal: number | null;
    gap_to_bonus: number | null;
    next_bonus_value: number | null;
    current_bonus_earned: number;
    message: string;
}

export interface MonthlyCommission {
    month: string;
    sales_mtd: number;
    goal_amount: number;
    achievement_rate: number;
    days_elapsed: number;
    days_total: number;
    current_tier: number;
    current_commission_value: number;
    next_tier: number | null;
    next_tier_goal: number | null;
    next_tier_goal_percent: number | null;
    gap_to_next_tier: number;
    projected_sales: number;
    projected_achievement: number;
    projected_tier: number;
    potential_commission: number;
}

export interface DailyPace {
    today_sales: number;
    average_daily_sales: number;
    today_vs_average: number;
    days_worked_this_month: number;
    status: PaceStatus;
}

export interface MyShift {
    id: number;
    date: string;
    shift_code: ShiftCode;
    status: string;
    cash_closing: {
        id: number;
        status: ClosingStatus;
    } | null;
}

export interface SellerDashboard {
    date: string;
    my_sales: SalesCount;
    store_sales: SalesCount;
    bonus_gamification: BonusGamification;
    monthly_commission: MonthlyCommission;
    daily_pace: DailyPace;
    my_shifts: MyShift[];
}

// ============================================================
// Conferente Dashboard Types
// ============================================================

export interface PendingClosing {
    id: number;
    status: ClosingStatus;
    cash_shift: {
        id: number;
        date: string;
        shift_code: ShiftCode;
        seller: {
            id: number;
            name: string;
        };
    };
}

export interface PendingShift {
    id: number;
    date: string;
    shift_code: ShiftCode;
    priority: 'high' | 'medium' | 'low';
    store_name: string;
    seller_name: string;
    system_total: number;
    days_pending: number;
}

export interface DivergentShift {
    id: number;
    date: string;
    shift_code: ShiftCode;
    seller_name: string;
    divergence: number;
    has_justification: boolean;
    days_pending: number;
}

export interface TopSeller {
    seller_id: number;
    name: string;
    total: number;
}

export interface ConferenteDashboard {
    date: string;
    pending_closings: PendingClosing[];
    pending_count: number;
    store_sales: SalesCount;
    shifts_today: {
        open: number;
        closed: number;
    };
    top_sellers: TopSeller[];
}

// ============================================================
// Cash Integrity Report (Conferente)
// ============================================================

export interface CashIntegrity {
    total_system_value: number;
    total_real_value: number;
    total_divergence: number;
    cash_break_percentage: number;
    status: StoreStatusColor;
}

export interface DivergenceAnalysis {
    total_lines_with_divergence: number;
    justified_count: number;
    unjustified_count: number;
    justified_rate: number;
}

export interface WorkflowStatus {
    total_shifts: number;
    closed_count: number;
    pending_approval: number;
    completion_rate: number;
}

export interface Alert {
    type: AlertType;
    code: string;
    message: string;
}

export interface CashIntegrityReport {
    store_id: number;
    period: string;
    cash_integrity: CashIntegrity;
    divergence_analysis: DivergenceAnalysis;
    workflow_status: WorkflowStatus;
    alerts: Alert[];
}

// ============================================================
// Admin/Gerente Dashboard Types
// ============================================================

export interface StoreSales {
    store_id: number;
    store_name: string;
    count: number;
    total: number;
}

export interface TopSellerWithCount extends TopSeller {
    count: number;
}

export interface AdminDashboard {
    month: string;
    total_sales: SalesCount;
    sales_by_store: StoreSales[];
    closings_summary: {
        approved: number;
        submitted: number;
        draft: number;
    };
    top_sellers: TopSellerWithCount[];
}

// ============================================================
// Ranking Types
// ============================================================

export interface RankingEntry {
    position: number;
    seller: {
        id: number;
        name: string;
        avatar_url: string | null;
        store_name: string;
    };
    total_sold: number;
    goal: number;
    achievement_rate: number;
    bonus_accumulated: number;
    previous_position?: number;
}

export interface RankingData {
    period: string;
    podium: RankingEntry[];
    ranking: RankingEntry[];
    stats: {
        total_sellers: number;
        above_goal: number;
        average_achievement: number;
    };
}

// ============================================================
// Store Performance (Gerente/Admin)
// ============================================================

export interface StorePerformance {
    store_id: number;
    period: string;
    days_elapsed: number;
    days_total: number;
    sales: {
        current_amount: number;
        goal_amount: number;
        achievement_rate: number;
        remaining_to_goal: number;
    };
    comparison: {
        same_period_last_year: number;
        total_last_year_month: number;
        yoy_growth: number;
    };
    forecast: {
        linear_projection: number;
        trend_projection: number;
        status: ForecastStatus;
    };
}

// ============================================================
// Consolidated Report (Admin)
// ============================================================

export interface ConsolidatedStore {
    store_id: number;
    store_name: string;
    sales: {
        current_amount: number;
        goal_amount: number;
        achievement_rate: number;
    };
    forecast: {
        status: ForecastStatus;
        projection: number;
    };
}

export interface ConsolidatedReport {
    period: string;
    stores: ConsolidatedStore[];
    consolidated: {
        total_sales: number;
        total_goal: number;
        total_achievement_rate: number;
        total_linear_projection: number;
    };
}

// ============================================================
// Finance Types (Passivo de Bônus/Comissão)
// ============================================================

export interface BonusSummary {
    period: {
        from: string;
        to: string;
    };
    summary: {
        total_bonus: number;
        approved_bonus: number;
        pending_bonus: number;
    };
}

export interface CommissionSummary {
    month: string;
    summary: {
        total_sales: number;
        total_commission: number;
        by_tier: Record<string, {
            count: number;
            value: number;
        }>;
    };
}

// ============================================================
// Dashboard Params
// ============================================================

export interface VendedorDashboardParams {
    store_id: number;
    date?: string;
}

export interface ConferenteDashboardParams {
    store_id: number;
    date?: string;
}

export interface AdminDashboardParams {
    month?: string;
}

export interface RankingParams {
    month?: string;
    store_id?: number;
    limit?: number;
    order?: 'asc' | 'desc';
}

export interface StorePerformanceParams {
    store_id: number;
    month?: string;
}

export interface CashIntegrityParams {
    store_id: number;
    month?: string;
}
