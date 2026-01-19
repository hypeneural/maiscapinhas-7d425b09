/**
 * Celebrations Types
 * 
 * TypeScript interfaces for the celebrations API endpoints.
 */

// ============================================================
// Base Types
// ============================================================

export type CelebrationType = 'birthday' | 'work_anniversary';
export type CelebrationStatus = 'today' | 'this_week' | 'this_month' | 'upcoming';

// ============================================================
// List Response (GET /celebrations)
// ============================================================

export interface Celebration {
    /** Composite ID: "42_birthday" or "42_work" */
    id: string;
    user_id: number;
    user_name: string;
    avatar_url: string | null;
    store_id: number | null;
    store_name: string;
    type: CelebrationType;
    /** "Aniversário" or "Aniversário de Empresa" */
    type_label: string;
    /** Original birth/hire date: "1990-01-20" */
    original_date: string;
    /** Next occurrence: "2026-01-20" */
    next_date: string;
    day: number;
    month: number;
    days_until: number;
    is_today: boolean;
    is_this_week: boolean;
    is_this_month: boolean;
    status: CelebrationStatus;
    /** "Hoje", "Amanhã", "Em 4 dias" */
    status_label: string;
    /** Years at company (null for birthday) */
    years: number | null;
    /** "3 anos" */
    years_label?: string;
}

export interface CelebrationFilters {
    types: FilterOption[];
    statuses: FilterOption[];
    stores: StoreOption[];
    months: MonthOption[];
}

export interface FilterOption {
    value: string;
    label: string;
}

export interface StoreOption {
    id: number;
    name: string;
}

export interface MonthOption {
    value: number;
    label: string;
}

export interface CelebrationsSummary {
    total: number;
    today: number;
    this_week: number;
    birthdays: number;
    work_anniversaries: number;
}

export interface CelebrationsResponse {
    data: Celebration[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    filters: CelebrationFilters;
    summary: CelebrationsSummary;
}

export interface CelebrationsParams {
    store_id?: number;
    type?: CelebrationType;
    month?: number;
    status?: CelebrationStatus;
    keyword?: string;
    sort?: 'name' | 'date' | 'days_until' | 'store_name' | 'years';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

// ============================================================
// Month Response (GET /celebrations/month)
// ============================================================

export interface MonthCelebration {
    id: string;
    user_id: number;
    user_name: string;
    avatar_url: string | null;
    store_id: number | null;
    store_name: string;
    type: CelebrationType;
    date: string;
    day_of_month: number;
    days_until: number;
    is_today: boolean;
    is_past: boolean;
    years: number | null;
}

export interface CelebrationsMonthResponse {
    data: {
        month: number;
        year: number;
        celebrations: MonthCelebration[];
        summary: {
            total: number;
            birthdays: number;
            work_anniversaries: number;
            today: number;
            upcoming_this_week: number;
        };
    };
}

export interface CelebrationsMonthParams {
    month?: number;
    year?: number;
    store_id?: number;
    type?: CelebrationType;
}

// ============================================================
// Upcoming Response (GET /celebrations/upcoming)
// ============================================================

export interface UpcomingCelebration {
    user_id: number;
    user_name: string;
    avatar_url: string | null;
    store_name: string;
    type: CelebrationType;
    date: string;
    days_until: number;
    years?: number;
}

export interface CelebrationsUpcomingResponse {
    data: UpcomingCelebration[];
}

export interface CelebrationsUpcomingParams {
    limit?: number;
    days?: number;
    store_id?: number;
}

// ============================================================
// Today Response (GET /celebrations/today)
// ============================================================

export interface TodayCelebration {
    user_id: number;
    user_name: string;
    avatar_url: string | null;
    store_name: string;
    type: CelebrationType;
    years: number | null;
    /** "🎂 Hoje é aniversário de Maria!" */
    message: string;
}

export interface CelebrationsTodayResponse {
    data: TodayCelebration[];
}
