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

export type TvHealthStatus = 'online' | 'degraded' | 'standby' | 'offline' | 'never_connected';

export interface TvScreenStoreHours {
    is_open_now: boolean;
    status: string;
    status_label: string;
    today_hours_label?: string | null;
    opens_at?: string | null;
    closes_at?: string | null;
    timezone?: string;
}

export interface TvScreenTiming {
    last_ping_at?: string | null;
    last_ping_local?: string | null;
    seconds_since_last_ping?: number | null;
    online_since?: string | null;
    online_for_seconds?: number;
    online_for_human?: string | null;
    offline_since?: string | null;
    offline_for_seconds?: number;
    offline_for_human?: string | null;
    uptime_seconds?: number;
    uptime_24h_pct?: number;
    uptime_7d_pct?: number;
    last_status_change_at?: string | null;
}

export interface TvScreenDisplay {
    viewport_width?: number | null;
    viewport_height?: number | null;
    physical_width?: number | null;
    physical_height?: number | null;
    display_screen_width?: number | null;
    display_screen_height?: number | null;
    device_pixel_ratio?: number | null;
    orientation_detected?: 'portrait' | 'landscape' | null;
    orientation_angle?: number | null;
    orientation_config?: TvOrientation;
    aspect_ratio?: string | null;
}

export interface TvScreenClient {
    launch_mode?: string | null;
    launch_path?: string | null;
    referrer?: string | null;
    is_webview?: boolean;
    is_pwa?: boolean;
    device_id?: string | null;
    device_label?: string | null;
    os?: string | null;
    browser?: string | null;
    player_state?: string | null;
    visibility_state?: string | null;
    network_online?: boolean | null;
    app_version?: string | null;
    playlist_version?: string | null;
}

export interface TvScreenPlayback {
    current_ad_id?: number | null;
    current_ad_title?: string | null;
    playlist_count?: number | null;
    fps?: number | null;
    offline_cached?: boolean;
    impressions_today?: number;
    impressions_24h?: number;
    errors_last_1h?: number;
    errors_last_24h?: number;
    last_error_at?: string | null;
    last_error_message?: string | null;
}

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
    health_status?: TvHealthStatus;
    status_label?: string;
    severity?: 'ok' | 'warning' | 'critical' | 'info';
    monitoring_enabled?: boolean;
    current_ad_title?: string | null;
    current_ad_id?: number | null;
    fps?: number | null;
    uptime_seconds?: number;
    last_ping_at?: string | null;
    public_url: string;
    public_status_url?: string;
    store_hours?: TvScreenStoreHours | null;
    timing?: TvScreenTiming | null;
    display?: TvScreenDisplay | null;
    client?: TvScreenClient | null;
    playback?: TvScreenPlayback | null;
}

export interface TvPingPayload {
    width?: number;
    height?: number;
    screen_width?: number;
    screen_height?: number;
    dpr?: number;
    orientation_angle?: number;
    orientation_type?: string;
    launch_mode?: string;
    launch_path?: string;
    referrer?: string | null;
    device_id?: string;
    player_state?: string;
    visibility_state?: string;
    network_online?: boolean;
    app_version?: string;
    playlist_version?: string | null;
    playlist_count?: number;
    current_ad_id?: number;
    current_ad_title?: string;
    fps?: number;
    uptime_seconds?: number;
    offline_cached?: boolean;
    preview?: boolean;
}

export interface TvPingResponse {
    success: boolean;
    status?: string;
    health_status?: TvHealthStatus;
    is_blackout?: boolean;
    playlist_version?: string;
    recommended_ping_seconds?: number;
    server_time?: string;
    ignored_preview?: boolean;
}

export interface TvWebhookItem {
    id: number;
    name: string;
    url: string;
    is_active: boolean;
    events: string[];
    store_ids: number[] | null;
    only_during_business_hours: boolean;
    cooldown_seconds: number;
    custom_headers?: Record<string, string> | null;
    last_triggered_at?: string | null;
    last_status_code?: number | null;
    failure_count: number;
    deliveries_count?: number;
    creator?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
}

export interface CreateTvWebhookPayload {
    name: string;
    url: string;
    is_active?: boolean;
    events: string[];
    store_ids?: number[] | null;
    only_during_business_hours?: boolean;
    cooldown_seconds?: number;
}

export type UpdateTvWebhookPayload = Partial<CreateTvWebhookPayload>;

export interface TvWebhooksMeta {
    supported_events: Record<string, string>;
    default_env_webhook_configured: boolean;
    public_endpoints: {
        fleet_status: string;
        screen_status_template: string;
        history_feed: string;
    };
    thresholds: {
        heartbeat_interval_seconds: number;
        online_threshold_seconds: number;
        offline_threshold_seconds: number;
    };
}

export interface TvWebhookDeliveryItem {
    id: number;
    delivery_uuid: string;
    tv_webhook_id?: number | null;
    target_url: string;
    event_type: string;
    screen_slug?: string | null;
    store_id?: number | null;
    status: 'pending' | 'delivered' | 'failed' | 'skipped_cooldown';
    attempt: number;
    http_status?: number | null;
    duration_ms?: number | null;
    response_excerpt?: string | null;
    error_message?: string | null;
    dispatched_at: string;
    webhook?: { id: number; name: string } | null;
    store?: { id: number; name: string } | null;
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
    playlist_version?: string;
    recommended_ping_seconds?: number;
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
