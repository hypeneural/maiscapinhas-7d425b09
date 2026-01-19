/**
 * Wheel Module Types
 * 
 * TypeScript interfaces for the "Roleta nas TVs" (Wheel) admin module.
 * Super Admin only access.
 */

// ============================================
// Enums
// ============================================

export type ScreenStatus = 'active' | 'inactive' | 'maintenance';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';
export type PrizeType = 'product' | 'coupon' | 'nothing' | 'try_again';
export type PerPhoneLimit = '1_per_campaign' | '1_per_day' | 'unlimited';

// ============================================
// Screen
// ============================================

export interface WheelScreen {
    id: number;
    screen_key: string;
    name: string;
    status: ScreenStatus;
    status_label: string;
    status_color: string;
    store: {
        id: number;
        name: string;
        city: string;
    } | null;
    store_id: number;
    device_info: Record<string, unknown> | null;
    is_online: boolean;
    last_seen_at: string | null;
    last_seen_ago: string | null;
    active_campaign: {
        id: number;
        campaign_key: string;
        name: string;
        status: CampaignStatus;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface WheelScreenHealth {
    screen_key: string;
    name: string;
    store: string;
    status: ScreenStatus;
    status_label: string;
    is_online: boolean;
    last_seen_at: string | null;
    last_seen_ago: string | null;
    device_info: {
        user_agent?: string;
        resolution?: string;
    } | null;
    active_campaign: {
        campaign_key: string;
        name: string;
        status: CampaignStatus;
    } | null;
}

export interface CreateScreenPayload {
    store_id: number;
    name: string;
    screen_key?: string;
    status?: ScreenStatus;
}

export interface UpdateScreenPayload {
    store_id?: number;
    name?: string;
    status?: ScreenStatus;
}

export interface ScreenFilters {
    store_id?: number;
    status?: ScreenStatus;
    search?: string;
    online_only?: boolean;
    offline_only?: boolean;
    page?: number;
    per_page?: number;
}

export interface CreateScreenResponse {
    screen: WheelScreen;
    token: string;
}

export interface RotateSecretResponse {
    token: string;
}

// ============================================
// Campaign
// ============================================

export interface CampaignSettings {
    qr_ttl_seconds: number;
    spin_duration_ms: number;
    min_rotations: number;
    max_rotations: number;
    max_queue_size: number;
    per_phone_limit: PerPhoneLimit;
}

export interface WheelCampaign {
    id: number;
    campaign_key: string;
    name: string;
    status: CampaignStatus;
    status_label: string;
    status_color: string;
    status_icon: string;
    can_activate: boolean;
    can_pause: boolean;
    can_end: boolean;
    starts_at: string | null;
    ends_at: string | null;
    is_within_period: boolean;
    terms_version: string | null;
    settings: CampaignSettings;
    screens_count?: number;
    active_segments_count?: number;
    total_weight?: number;
    segments?: WheelSegment[];
    inventory?: WheelInventory[];
    created_at: string;
    updated_at: string;
}

export interface CreateCampaignPayload {
    name: string;
    campaign_key?: string;
    starts_at?: string;
    ends_at?: string;
    terms_version?: string;
    settings?: Partial<CampaignSettings>;
}

export interface UpdateCampaignPayload {
    name?: string;
    starts_at?: string | null;
    ends_at?: string | null;
    terms_version?: string;
    settings?: Partial<CampaignSettings>;
}

export interface CampaignFilters {
    status?: CampaignStatus;
    search?: string;
    page?: number;
    per_page?: number;
}

// ============================================
// Prize
// ============================================

export interface WheelPrize {
    id: number;
    prize_key: string;
    name: string;
    type: PrizeType;
    type_label: string;
    type_icon: string;
    type_color: string;
    icon: string | null;
    description: string | null;
    redeem_instructions: string | null;
    code_prefix: string | null;
    requires_redeem: boolean;
    consumes_inventory: boolean;
    active: boolean;
    segments_count?: number;
    created_at: string;
    updated_at: string;
}

export interface CreatePrizePayload {
    name: string;
    type: PrizeType;
    prize_key?: string;
    icon?: string;
    description?: string;
    redeem_instructions?: string;
    code_prefix?: string;
    active?: boolean;
}

export interface UpdatePrizePayload {
    name?: string;
    type?: PrizeType;
    icon?: string;
    description?: string;
    redeem_instructions?: string;
    code_prefix?: string;
    active?: boolean;
}

export interface PrizeFilters {
    type?: PrizeType;
    active?: boolean;
    search?: string;
    page?: number;
    per_page?: number;
}

// ============================================
// Segment
// ============================================

export interface WheelSegment {
    id: number;
    segment_key: string;
    label: string;
    color: string;
    prize_id: number;
    prize: {
        id: number;
        prize_key: string;
        name: string;
        type: PrizeType;
        icon: string;
        active: boolean;
    } | null;
    probability_weight: number;
    probability_percentage: number;
    sort_order: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SegmentInput {
    id?: number;
    segment_key?: string;
    label: string;
    color: string;
    prize_id: number;
    probability_weight: number;
    active?: boolean;
}

export interface SyncSegmentsPayload {
    segments: SegmentInput[];
}

// ============================================
// Inventory
// ============================================

export interface WheelInventory {
    id: number;
    campaign_id: number;
    prize_id: number;
    prize: {
        id: number;
        prize_key: string;
        name: string;
        type: PrizeType;
        icon: string;
    } | null;
    total_limit: number | null;
    remaining: number | null;
    remaining_percentage: number | null;
    daily_limit: number | null;
    daily_remaining: number | null;
    reset_daily_at: string | null;
    has_stock: boolean;
    needs_daily_reset: boolean;
    created_at: string;
    updated_at: string;
}

export interface InventoryInput {
    prize_id: number;
    total_limit?: number | null;
    remaining?: number | null;
    daily_limit?: number | null;
    daily_remaining?: number | null;
}

export interface SyncInventoryPayload {
    inventory: InventoryInput[];
}

export interface AddStockPayload {
    quantity: number;
}

// ============================================
// Event / Logs
// ============================================

export type WheelEventType =
    | 'screen_connected'
    | 'screen_disconnected'
    | 'campaign_activated'
    | 'campaign_paused'
    | 'campaign_ended'
    | 'spin_started'
    | 'spin_completed'
    | 'prize_won'
    | 'inventory_depleted'
    | 'config_changed';

export interface WheelEvent {
    id: number;
    event_id: string;
    type: WheelEventType;
    screen: {
        screen_key: string;
        name: string;
    } | null;
    campaign: {
        campaign_key: string;
        name: string;
    } | null;
    payload: Record<string, unknown>;
    created_at: string;
    created_at_human: string;
}

export interface EventFilters {
    screen_key?: string;
    campaign_key?: string;
    type?: WheelEventType;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
}

// ============================================
// Analytics
// ============================================

export interface WheelAnalyticsSummary {
    screens: {
        total: number;
        online: number;
        offline: number;
    };
    campaigns: {
        active: number;
        draft: number;
    };
    today: {
        spins: number;
        prizes_won: number;
    };
    events_24h: number;
}

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'custom';

export interface AnalyticsFilters {
    period?: AnalyticsPeriod;
    from?: string;
    to?: string;
    campaign_key?: string;
    store_id?: number;
}

export interface WheelAnalyticsDetailed {
    period: {
        from: string;
        to: string;
    };
    totals: {
        spins: number;
        prizes_won: number;
        unique_phones: number;
        conversion_rate: number;
    };
    by_day: Array<{
        date: string;
        spins: number;
        prizes: number;
    }>;
    by_campaign: Array<{
        campaign_key: string;
        name: string;
        spins: number;
        prizes: number;
    }>;
    by_store: Array<{
        store_id: number;
        store_name: string;
        spins: number;
        prizes: number;
    }>;
    by_prize: Array<{
        prize_key: string;
        name: string;
        count: number;
        percentage: number;
    }>;
    hourly_distribution: Array<{
        hour: number;
        spins: number;
    }>;
    inventory_alerts: Array<{
        campaign_key: string;
        prize_key: string;
        prize_name: string;
        remaining: number;
        alert_level: 'low' | 'critical';
    }>;
    screens_needing_attention: Array<{
        screen_key: string;
        name: string;
        issue: string;
        last_seen: string;
    }>;
}

export interface StatCardData {
    value: number;
    label: string;
    total?: number;
    breakdown?: Record<string, number>;
}

// ============================================
// Campaign Preview
// ============================================

export interface CampaignPreview {
    segments: Array<{
        label: string;
        color: string;
        percentage: number;
    }>;
    settings: {
        spin_duration_ms: number;
    };
}

export interface DuplicateCampaignPayload {
    new_name: string;
}

export interface ReorderSegmentsPayload {
    order: number[];  // Array of segment IDs in new order
}

// ============================================
// Heartbeat
// ============================================

export interface HeartbeatPayload {
    device_info?: {
        user_agent?: string;
        resolution?: string;
    };
}

// ============================================
// Screen Campaigns
// ============================================

export interface ScreenCampaign {
    id: number;
    campaign_key: string;
    name: string;
    status: CampaignStatus;
    is_active_on_screen: boolean;
}

export interface SyncScreenCampaignsPayload {
    campaign_ids: number[];
}

// ============================================
// API Response Wrappers
// ============================================

export interface WheelApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface WheelPaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
        from: number;
        to: number;
    };
}

// ============================================
// Player
// ============================================

export interface PlayerAddress {
    cep: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    ibge: string | null;
    full: string | null;
}

export interface WheelPlayer {
    id: number;
    player_key: string;
    full_name: string | null;
    phone_masked: string;
    whatsapp_confirmed: boolean;
    whatsapp_confirmed_at: string | null;
    address: PlayerAddress;
    has_address: boolean;
    sessions_count: number;
    spins_count: number;
    last_session?: {
        session_key: string;
        store: string;
        campaign: string;
        joined_at: string;
    };
    last_seen_at: string | null;
    created_at: string;
}

export interface PlayerFilters {
    search?: string;
    city?: string;
    state?: string;
    cep?: string;
    store_id?: number;
    campaign_id?: number;
    has_address?: boolean;
    verified_only?: boolean;
    has_spins?: boolean;
    date_from?: string;
    date_to?: string;
    sort_by?: 'created_at' | 'full_name' | 'city' | 'state' | 'last_seen_at';
    sort_dir?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface PlayersStats {
    total: number;
    verified: number;
    with_address: number;
    cities: number;
}

export interface PlayersResponse {
    success: boolean;
    data: WheelPlayer[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    stats: PlayersStats;
    filters_applied: Record<string, unknown>;
}

export interface PlayerDetailStats {
    total_sessions: number;
    total_spins: number;
    prizes_won: number;
    stores_visited: number;
    campaigns_participated: number;
}

export interface PlayerTimelineEntry {
    session_player_key: string;
    session_key: string;
    campaign: string;
    store: string;
    status: string;
    spins: {
        spin_key: string;
        prize: string;
        code: string | null;
        created_at: string;
    }[];
    joined_at: string;
    left_at: string | null;
}

export interface PlayerDetailResponse {
    success: boolean;
    data: {
        player: WheelPlayer;
        stats: PlayerDetailStats;
        timeline: PlayerTimelineEntry[];
    };
}

export interface PlayerLog {
    id: number;
    type: string;
    payload: Record<string, unknown>;
    screen_id: number | null;
    campaign_id: number | null;
    created_at: string;
}

export interface PlayerLogFilters {
    type?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
}

export interface PlayerSpin {
    spin_key: string;
    campaign: string;
    store: string;
    prize: {
        name: string;
        type: string;
        icon: string;
    };
    prize_code: string | null;
    status: string;
    created_at: string;
}

export interface PlayerSpinFilters {
    campaign_id?: number;
    prize_id?: number;
    winners_only?: boolean;
    per_page?: number;
    page?: number;
}

export interface CityStats {
    city: string;
    state: string;
    players_count: number;
}

export interface StorePlayerStats {
    store_id: number;
    store_name: string;
    unique_players: number;
    total_participations: number;
}

export interface UpdatePlayerPayload {
    full_name?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
}

// ============================================
// Prize Rules
// ============================================

export type CooldownScope = 'screen' | 'campaign';

export interface PrizeRuleSummary {
    cooldown: string;   // "10 spins + 5 min"
    limits: string;     // "5/hora, 20/dia"
    scope: string;      // "Global" | "Por tela"
    pacing: string;     // "Ativo (1.3x)" | "Desativado"
}

export interface PrizeRulePrize {
    prize_key: string;
    name: string;
    type: 'nothing' | 'try_again' | 'coupon' | 'voucher' | 'physical' | 'experience';
    icon: string | null;
}

/**
 * Prize Rule - Controls when and how often a prize can be awarded
 */
export interface PrizeRule {
    id: number;
    campaign_id: number;
    prize_id: number;
    prize: PrizeRulePrize;

    // Cooldown
    min_gap_spins: number;
    cooldown_seconds: number;
    cooldown_scope: CooldownScope;

    // Limits
    max_per_hour: number | null;
    max_per_day: number | null;

    // Pacing
    pacing_enabled: boolean;
    pacing_buffer: number;

    // Other
    priority: number;
    active: boolean;
    summary: PrizeRuleSummary;

    created_at: string;
    updated_at: string;
}

export interface PrizeRuleState {
    last_awarded_at: string | null;
    last_awarded_spin_seq: number | null;
    awarded_count_hour: number;
    awarded_count_day: number;
    awarded_count_total: number;
    spins_until_eligible: number;
    seconds_until_eligible: number;
    next_eligible_at: string | null;
}

export interface PrizeInventoryState {
    total: number;
    remaining: number;
    daily_limit: number | null;
    daily_remaining: number | null;
}

/**
 * Prize State - Current eligibility status of a prize
 */
export interface PrizeState {
    prize_key: string;
    prize_name: string;
    segment_label: string;
    probability_weight: number;
    is_eligible: boolean;
    reason: string | null;
    rule: PrizeRuleSummary | null;
    state: PrizeRuleState;
    inventory: PrizeInventoryState | null;
}

export interface PrizeStateResponse {
    success: boolean;
    data: PrizeState[];
    meta: {
        campaign_key: string;
        screen_id: number | null;
        current_spin_seq: number;
        timestamp: string;
    };
}

export interface CreatePrizeRuleRequest {
    prize_id: number;
    min_gap_spins?: number;
    cooldown_seconds?: number;
    max_per_hour?: number | null;
    max_per_day?: number | null;
    cooldown_scope?: CooldownScope;
    pacing_enabled?: boolean;
    pacing_buffer?: number;
    priority?: number;
    active?: boolean;
}

export interface UpdatePrizeRuleRequest {
    min_gap_spins?: number;
    cooldown_seconds?: number;
    max_per_hour?: number | null;
    max_per_day?: number | null;
    cooldown_scope?: CooldownScope;
    pacing_enabled?: boolean;
    pacing_buffer?: number;
    priority?: number;
    active?: boolean;
}

export interface PrizeRuleDetailResponse {
    success: boolean;
    data: {
        rule: PrizeRule;
        state: PrizeRuleState;
    };
}

export interface BulkUpdatePrizeRulesRequest {
    rules: CreatePrizeRuleRequest[];
}

export interface BulkUpdatePrizeRulesResponse {
    success: boolean;
    message: string;
    data: {
        created: number;
        updated: number;
    };
}

// ============================================
// Advanced Analytics
// ============================================

// By-Store Analytics
export interface ByStoreAnalyticsFilters {
    period?: AnalyticsPeriod;
    from?: string;
    to?: string;
}

export interface ScreenPerformance {
    screen_key: string;
    screen_name: string;
    store_id: number;
    store_name: string;
    metrics: {
        spins: number;
        prizes_won: number;
        players_joined: number;
        redeemed: number;
        conversion_rate: number;
        redemption_rate: number;
    };
}

export interface StorePerformance {
    store_id: number;
    store_name: string;
    screens_count: number;
    totals: {
        spins: number;
        prizes_won: number;
        players_joined: number;
        redeemed: number;
    };
    screens: ScreenPerformance[];
}

export interface ByStoreAnalyticsData {
    period: { from: string; to: string };
    by_store: StorePerformance[];
}

// Peak Hours Analytics
export interface HourData {
    hour: number;
    label: string;
    spins: number;
}

export interface DayData {
    name: string;
    spins: number;
}

export interface PeakHoursAnalyticsData {
    period: string;
    total_spins: number;
    peak_hour: { hour: number; label: string; spins: number };
    peak_day: { day: number; name: string; spins: number };
    by_hour: HourData[];
    by_day_of_week: DayData[];
}

// Geographic Analytics
export interface StateData {
    state: string;
    players: number;
}

export interface CityData {
    city_state: string;
    players: number;
}

export interface GeographicAnalyticsData {
    period: string;
    total_players: number;
    coverage: { states: number; cities: number };
    by_state: StateData[];
    by_city: CityData[];
}

// ROI Analytics
export interface RoiFilters {
    period?: AnalyticsPeriod;
    campaign_key?: string;
}

export interface PrizeTypeBreakdown {
    type: string;
    count: number;
    value: number;
    redeemed: number;
}

export interface RoiAnalyticsData {
    period: { from: string; to: string };
    campaign: { campaign_key: string; name: string } | null;
    totals: {
        spins: number;
        unique_players: number;
        prizes_distributed: number;
        prizes_redeemed: number;
        total_value_distributed: number;
        total_value_redeemed: number;
    };
    metrics: {
        avg_value_per_player: number;
        cost_per_engagement: number;
        cost_per_redemption: number;
        redemption_rate: number;
    };
    by_prize_type: PrizeTypeBreakdown[];
}
