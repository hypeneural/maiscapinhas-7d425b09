/**
 * TV Signage & Ads TypeScript Definitions
 *
 * RECONSTRUCTION NOTE (Forensic Recovery - 2026-11-19):
 * TypeScript-only declaration files emit zero runtime JavaScript and are therefore
 * omitted from production Vite/SWC source maps (.js.map). These interfaces and union
 * types were faithfully reconstructed from all type imports and property accesses in
 * the 9 original production source files recovered from hidden source maps, cross-checked
 * against the recovered Laravel controllers (TvAdController, TvRuntimeController).
 */

export type TvMediaType = 'image' | 'video';

export type TvOrientation = 'all' | 'horizontal' | 'vertical' | 'auto';

export type TvAdStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

export type TvOverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type TvOverlayStyle = 'glass' | 'solid' | 'neon' | 'minimal';

export type TvClockFormat = '24h' | '24h_seconds' | '12h' | 'full_date_time';

export interface TvAdTargetStore {
    id: number;
    name: string;
}

export interface TvAdCreator {
    id: number;
    name: string;
}

export interface TvAd {
    id: number;
    title: string;
    media_type: TvMediaType;
    media_url: string;
    media_path?: string | null;
    thumbnail_url?: string | null;
    duration_seconds: number;
    target_orientation: TvOrientation;
    is_global: boolean;
    status: TvAdStatus;
    starts_at?: string | null;
    ends_at?: string | null;
    days_of_week?: number[] | null;
    order_priority: number;
    created_by_user_id?: number | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    target_stores?: TvAdTargetStore[];
    creator?: TvAdCreator | null;
    store_targets_count?: number;
    impressions_count?: number;
    total_airtime_minutes?: number;
    media_exists?: boolean;
}

export interface CreateTvAdPayload {
    title: string;
    file?: File | null;
    media_url?: string | null;
    media_path?: string | null;
    media_type?: TvMediaType;
    thumbnail_url?: string | null;
    duration_seconds?: number;
    target_orientation?: TvOrientation;
    is_global?: boolean;
    status?: TvAdStatus;
    starts_at?: string | null;
    ends_at?: string | null;
    days_of_week?: number[] | null;
    store_ids?: number[];
    order_priority?: number;
}

export type UpdateTvAdPayload = Partial<CreateTvAdPayload>;

export interface TvScreenItem {
    store_id: number;
    store_name: string;
    screen_id: number;
    slug: string;
    screen_key: string;
    access_token?: string | null;
    orientation: TvOrientation;
    is_online: boolean;
    is_blackout: boolean;
    current_ad_title?: string | null;
    current_ad_id?: number | null;
    fps?: number | null;
    uptime_seconds?: number;
    last_ping_at?: string | null;
    public_url: string;
}

export interface TvPlaylistItem {
    id: number;
    title: string;
    type: TvMediaType;
    url: string;
    thumbnail_url?: string | null;
    duration: number;
    orientation: TvOrientation;
    is_global: boolean;
}

export interface TvDesignTemplate {
    clock: {
        enabled: boolean;
        position: TvOverlayPosition;
        format: TvClockFormat;
        show_seconds: boolean;
        show_date: boolean;
        style: TvOverlayStyle;
        size: 'sm' | 'md' | 'lg';
        color: string;
    };
    store_badge: {
        enabled: boolean;
        position: TvOverlayPosition;
        custom_name?: string | null;
        tagline?: string | null;
        style: TvOverlayStyle;
        accent_color: string;
        pulse_dot: boolean;
    };
    ticker_banner: {
        enabled: boolean;
        text: string;
        tag_prefix?: string;
        font_family: string;
        font_size: number;
        font_weight: 'normal' | 'semibold' | 'bold' | 'black';
        speed: 'slow' | 'normal' | 'fast';
        bg_color: string;
        bg_opacity: number;
        text_color: string;
        padding_y: 'sm' | 'md' | 'lg';
    };
    branding_logo: {
        enabled: boolean;
        logo_url?: string | null;
        position: TvOverlayPosition;
        height_px: number;
        opacity: number;
    };
    qr_code: {
        enabled: boolean;
        type?: string;
        custom_url?: string | null;
        title?: string;
        title_color: string;
        fg_color: string;
        bg_color: string;
        position: TvOverlayPosition;
        size: 'sm' | 'md' | 'lg';
        style: TvOverlayStyle;
    };
}

export interface TvDesignStoreOverride {
    has_custom_template: boolean;
    template: TvDesignTemplate | null;
}

export interface TvDesignSettingsResponse {
    global: TvDesignTemplate;
    store_overrides: Record<string, TvDesignStoreOverride>;
}

export interface TvPlaylistResponse {
    screen: {
        name: string;
        store_id: number | null;
        store_name: string;
        orientation: TvOrientation;
        slug: string;
        is_blackout: boolean;
    };
    design_template?: TvDesignTemplate;
    realtime: {
        provider: string;
        channel: string;
    };
    playlist_count: number;
    playlist: TvPlaylistItem[];
    server_time: string;
}

export interface TvAnalyticsSession {
    id: number;
    store_name: string;
    screen_slug: string;
    started_at: string;
    ended_at?: string | null;
    last_ping_at: string;
    duration_minutes: number;
    duration_human: string;
    is_active_now: boolean;
    ended_reason?: string | null;
    ended_reason_pt: string;
}

export interface TvAnalyticsAdPerformance {
    ad_id: number;
    title: string;
    media_type: TvMediaType;
    thumbnail_url?: string | null;
    impressions_count: number;
    airtime_minutes: number;
    percentage: number;
    last_displayed_at?: string | null;
}

export interface TvAnalyticsResponse {
    period: string;
    store_id: number | null;
    summary: {
        total_impressions: number;
        total_hours_online: number;
        avg_hours_per_day: number;
        total_sessions_count: number;
        uptime_score: number;
    };
    sessions: TvAnalyticsSession[];
    weekday_distribution: Array<{
        day_num: number;
        day_name: string;
        impressions: number;
        airtime_minutes: number;
    }>;
    hourly_distribution: Array<{
        hour: string;
        impressions: number;
    }>;
    media_type_distribution: Array<{
        name: string;
        media_type: TvMediaType;
        count: number;
        minutes: number;
        fill: string;
    }>;
    ads_performance: TvAnalyticsAdPerformance[];
}
