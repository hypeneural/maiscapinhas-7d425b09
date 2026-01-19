/**
 * Wheel Module API Service
 * 
 * API service layer for the "Roleta nas TVs" (Wheel) admin module.
 * Base URL: /api/v1/admin/wheel
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client';
import type {
    WheelScreen,
    WheelScreenHealth,
    CreateScreenPayload,
    UpdateScreenPayload,
    ScreenFilters,
    CreateScreenResponse,
    RotateSecretResponse,
    ScreenStatus,
    WheelCampaign,
    CreateCampaignPayload,
    UpdateCampaignPayload,
    CampaignFilters,
    WheelPrize,
    CreatePrizePayload,
    UpdatePrizePayload,
    PrizeFilters,
    WheelSegment,
    SyncSegmentsPayload,
    WheelInventory,
    SyncInventoryPayload,
    AddStockPayload,
    WheelEvent,
    EventFilters,
    WheelAnalyticsSummary,
    WheelAnalyticsDetailed,
    AnalyticsFilters,
    ScreenCampaign,
    SyncScreenCampaignsPayload,
    CampaignPreview,
    DuplicateCampaignPayload,
    ReorderSegmentsPayload,
    HeartbeatPayload,
    WheelApiResponse,
    WheelPaginatedResponse,
    // Player types
    WheelPlayer,
    PlayerFilters,
    PlayersResponse,
    PlayerDetailResponse,
    PlayerLog,
    PlayerLogFilters,
    PlayerSpin,
    PlayerSpinFilters,
    CityStats,
    StorePlayerStats,
    UpdatePlayerPayload,
    // Prize Rules types
    PrizeRule,
    PrizeState,
    PrizeStateResponse,
    CreatePrizeRuleRequest,
    UpdatePrizeRuleRequest,
    PrizeRuleDetailResponse,
    BulkUpdatePrizeRulesRequest,
    BulkUpdatePrizeRulesResponse,
    // Advanced Analytics types
    ByStoreAnalyticsFilters,
    ByStoreAnalyticsData,
    PeakHoursAnalyticsData,
    GeographicAnalyticsData,
    RoiFilters,
    RoiAnalyticsData,
} from '@/types/wheel.types';

const BASE_URL = '/admin/wheel';

// ============================================
// Screens
// ============================================

export async function getScreens(filters?: ScreenFilters): Promise<WheelPaginatedResponse<WheelScreen>> {
    const params = new URLSearchParams();
    if (filters?.store_id) params.append('store_id', String(filters.store_id));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.online_only) params.append('online_only', 'true');
    if (filters?.offline_only) params.append('offline_only', 'true');
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));

    const query = params.toString();
    return apiGet<WheelPaginatedResponse<WheelScreen>>(`${BASE_URL}/screens${query ? `?${query}` : ''}`);
}

export async function getScreen(screenKey: string): Promise<WheelApiResponse<WheelScreen>> {
    return apiGet<WheelApiResponse<WheelScreen>>(`${BASE_URL}/screens/${screenKey}`);
}

export async function createScreen(data: CreateScreenPayload): Promise<WheelApiResponse<CreateScreenResponse>> {
    return apiPost<WheelApiResponse<CreateScreenResponse>>(`${BASE_URL}/screens`, data);
}

export async function updateScreen(screenKey: string, data: UpdateScreenPayload): Promise<WheelApiResponse<WheelScreen>> {
    return apiPut<WheelApiResponse<WheelScreen>>(`${BASE_URL}/screens/${screenKey}`, data);
}

export async function deleteScreen(screenKey: string): Promise<WheelApiResponse<null>> {
    return apiDelete<WheelApiResponse<null>>(`${BASE_URL}/screens/${screenKey}`);
}

export async function rotateScreenSecret(screenKey: string): Promise<WheelApiResponse<RotateSecretResponse>> {
    return apiPost<WheelApiResponse<RotateSecretResponse>>(`${BASE_URL}/screens/${screenKey}/rotate-secret`);
}

export async function setScreenStatus(screenKey: string, status: ScreenStatus): Promise<WheelApiResponse<WheelScreen>> {
    return apiPost<WheelApiResponse<WheelScreen>>(`${BASE_URL}/screens/${screenKey}/set-status`, { status });
}

export async function getScreenHealth(screenKey: string): Promise<WheelApiResponse<WheelScreenHealth>> {
    return apiGet<WheelApiResponse<WheelScreenHealth>>(`${BASE_URL}/screens/${screenKey}/health`);
}

export async function getScreenCampaigns(screenKey: string): Promise<WheelApiResponse<ScreenCampaign[]>> {
    return apiGet<WheelApiResponse<ScreenCampaign[]>>(`${BASE_URL}/screens/${screenKey}/campaigns`);
}

export async function syncScreenCampaigns(screenKey: string, data: SyncScreenCampaignsPayload): Promise<WheelApiResponse<ScreenCampaign[]>> {
    return apiPut<WheelApiResponse<ScreenCampaign[]>>(`${BASE_URL}/screens/${screenKey}/campaigns`, data);
}

export async function activateCampaignOnScreen(screenKey: string, campaignKey: string): Promise<WheelApiResponse<WheelScreen>> {
    return apiPost<WheelApiResponse<WheelScreen>>(`${BASE_URL}/screens/${screenKey}/campaigns/${campaignKey}/activate`);
}

// ============================================
// Campaigns
// ============================================

export async function getCampaigns(filters?: CampaignFilters): Promise<WheelPaginatedResponse<WheelCampaign>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));

    const query = params.toString();
    return apiGet<WheelPaginatedResponse<WheelCampaign>>(`${BASE_URL}/campaigns${query ? `?${query}` : ''}`);
}

export async function getCampaign(campaignKey: string): Promise<WheelApiResponse<WheelCampaign>> {
    return apiGet<WheelApiResponse<WheelCampaign>>(`${BASE_URL}/campaigns/${campaignKey}`);
}

export async function createCampaign(data: CreateCampaignPayload): Promise<WheelApiResponse<WheelCampaign>> {
    return apiPost<WheelApiResponse<WheelCampaign>>(`${BASE_URL}/campaigns`, data);
}

export async function updateCampaign(campaignKey: string, data: UpdateCampaignPayload): Promise<WheelApiResponse<WheelCampaign>> {
    return apiPut<WheelApiResponse<WheelCampaign>>(`${BASE_URL}/campaigns/${campaignKey}`, data);
}

export async function deleteCampaign(campaignKey: string): Promise<WheelApiResponse<null>> {
    return apiDelete<WheelApiResponse<null>>(`${BASE_URL}/campaigns/${campaignKey}`);
}

export async function activateCampaign(campaignKey: string): Promise<WheelApiResponse<WheelCampaign>> {
    return apiPost<WheelApiResponse<WheelCampaign>>(`${BASE_URL}/campaigns/${campaignKey}/activate`);
}

export async function pauseCampaign(campaignKey: string): Promise<WheelApiResponse<WheelCampaign>> {
    return apiPost<WheelApiResponse<WheelCampaign>>(`${BASE_URL}/campaigns/${campaignKey}/pause`);
}

export async function endCampaign(campaignKey: string): Promise<WheelApiResponse<WheelCampaign>> {
    return apiPost<WheelApiResponse<WheelCampaign>>(`${BASE_URL}/campaigns/${campaignKey}/end`);
}

// ============================================
// Segments
// ============================================

export async function getSegments(campaignKey: string): Promise<WheelApiResponse<WheelSegment[]>> {
    return apiGet<WheelApiResponse<WheelSegment[]>>(`${BASE_URL}/campaigns/${campaignKey}/segments`);
}

export async function syncSegments(campaignKey: string, data: SyncSegmentsPayload): Promise<WheelApiResponse<WheelSegment[]>> {
    return apiPut<WheelApiResponse<WheelSegment[]>>(`${BASE_URL}/campaigns/${campaignKey}/segments`, data);
}

export async function createSegment(campaignKey: string, data: Omit<SyncSegmentsPayload['segments'][0], 'id'>): Promise<WheelApiResponse<WheelSegment>> {
    return apiPost<WheelApiResponse<WheelSegment>>(`${BASE_URL}/campaigns/${campaignKey}/segments`, data);
}

export async function deleteSegment(campaignKey: string, segmentId: number): Promise<WheelApiResponse<null>> {
    return apiDelete<WheelApiResponse<null>>(`${BASE_URL}/campaigns/${campaignKey}/segments/${segmentId}`);
}

// ============================================
// Prizes
// ============================================

export async function getPrizes(filters?: PrizeFilters): Promise<WheelPaginatedResponse<WheelPrize>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.active !== undefined) params.append('active', String(filters.active));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));

    const query = params.toString();
    return apiGet<WheelPaginatedResponse<WheelPrize>>(`${BASE_URL}/prizes${query ? `?${query}` : ''}`);
}

export async function getPrize(prizeKey: string): Promise<WheelApiResponse<WheelPrize>> {
    return apiGet<WheelApiResponse<WheelPrize>>(`${BASE_URL}/prizes/${prizeKey}`);
}

export async function createPrize(data: CreatePrizePayload): Promise<WheelApiResponse<WheelPrize>> {
    return apiPost<WheelApiResponse<WheelPrize>>(`${BASE_URL}/prizes`, data);
}

export async function updatePrize(prizeKey: string, data: UpdatePrizePayload): Promise<WheelApiResponse<WheelPrize>> {
    return apiPut<WheelApiResponse<WheelPrize>>(`${BASE_URL}/prizes/${prizeKey}`, data);
}

export async function deletePrize(prizeKey: string): Promise<WheelApiResponse<null>> {
    return apiDelete<WheelApiResponse<null>>(`${BASE_URL}/prizes/${prizeKey}`);
}

export async function togglePrize(prizeKey: string): Promise<WheelApiResponse<WheelPrize>> {
    return apiPost<WheelApiResponse<WheelPrize>>(`${BASE_URL}/prizes/${prizeKey}/toggle`);
}

// ============================================
// Inventory
// ============================================

export async function getInventory(campaignKey: string): Promise<WheelApiResponse<WheelInventory[]>> {
    return apiGet<WheelApiResponse<WheelInventory[]>>(`${BASE_URL}/campaigns/${campaignKey}/inventory`);
}

export async function syncInventory(campaignKey: string, data: SyncInventoryPayload): Promise<WheelApiResponse<WheelInventory[]>> {
    return apiPut<WheelApiResponse<WheelInventory[]>>(`${BASE_URL}/campaigns/${campaignKey}/inventory`, data);
}

export async function addStock(campaignKey: string, prizeKey: string, data: AddStockPayload): Promise<WheelApiResponse<WheelInventory>> {
    return apiPost<WheelApiResponse<WheelInventory>>(`${BASE_URL}/campaigns/${campaignKey}/inventory/${prizeKey}/add`, data);
}

export async function resetDailyInventory(campaignKey: string, prizeKey: string): Promise<WheelApiResponse<WheelInventory>> {
    return apiPost<WheelApiResponse<WheelInventory>>(`${BASE_URL}/campaigns/${campaignKey}/inventory/${prizeKey}/reset-daily`);
}

// ============================================
// Logs / Events
// ============================================

export async function getEvents(filters?: EventFilters): Promise<WheelPaginatedResponse<WheelEvent>> {
    const params = new URLSearchParams();
    if (filters?.screen_key) params.append('screen_key', filters.screen_key);
    if (filters?.campaign_key) params.append('campaign_key', filters.campaign_key);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));

    const query = params.toString();
    return apiGet<WheelPaginatedResponse<WheelEvent>>(`${BASE_URL}/logs/events${query ? `?${query}` : ''}`);
}

// ============================================
// Analytics
// ============================================

export async function getAnalyticsSummary(): Promise<WheelApiResponse<WheelAnalyticsSummary>> {
    return apiGet<WheelApiResponse<WheelAnalyticsSummary>>(`${BASE_URL}/analytics/summary`);
}

export async function getAnalyticsDetailed(filters?: AnalyticsFilters): Promise<WheelApiResponse<WheelAnalyticsDetailed>> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    if (filters?.campaign_key) params.append('campaign_key', filters.campaign_key);
    if (filters?.store_id) params.append('store_id', String(filters.store_id));

    const query = params.toString();
    return apiGet<WheelApiResponse<WheelAnalyticsDetailed>>(`${BASE_URL}/analytics/detailed${query ? `?${query}` : ''}`);
}

export async function getAnalyticsByStore(filters?: ByStoreAnalyticsFilters): Promise<WheelApiResponse<ByStoreAnalyticsData>> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    const query = params.toString();
    return apiGet<WheelApiResponse<ByStoreAnalyticsData>>(`${BASE_URL}/analytics/by-store${query ? `?${query}` : ''}`);
}

export async function getAnalyticsPeakHours(filters?: { period?: string }): Promise<WheelApiResponse<PeakHoursAnalyticsData>> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    const query = params.toString();
    return apiGet<WheelApiResponse<PeakHoursAnalyticsData>>(`${BASE_URL}/analytics/peak-hours${query ? `?${query}` : ''}`);
}

export async function getAnalyticsGeographic(filters?: { period?: string }): Promise<WheelApiResponse<GeographicAnalyticsData>> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    const query = params.toString();
    return apiGet<WheelApiResponse<GeographicAnalyticsData>>(`${BASE_URL}/analytics/geographic${query ? `?${query}` : ''}`);
}

export async function getAnalyticsRoi(filters?: RoiFilters): Promise<WheelApiResponse<RoiAnalyticsData>> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.campaign_key) params.append('campaign_key', filters.campaign_key);
    const query = params.toString();
    return apiGet<WheelApiResponse<RoiAnalyticsData>>(`${BASE_URL}/analytics/roi${query ? `?${query}` : ''}`);
}

// ============================================
// Campaign Actions (New - Backend Confirmed)
// ============================================

export async function duplicateCampaign(campaignKey: string, data: DuplicateCampaignPayload): Promise<WheelApiResponse<WheelCampaign>> {
    return apiPost<WheelApiResponse<WheelCampaign>>(`${BASE_URL}/campaigns/${campaignKey}/duplicate`, data);
}

export async function getCampaignPreview(campaignKey: string): Promise<WheelApiResponse<CampaignPreview>> {
    return apiGet<WheelApiResponse<CampaignPreview>>(`${BASE_URL}/campaigns/${campaignKey}/preview`);
}

export async function reorderSegments(campaignKey: string, data: ReorderSegmentsPayload): Promise<WheelApiResponse<WheelSegment[]>> {
    return apiPost<WheelApiResponse<WheelSegment[]>>(`${BASE_URL}/campaigns/${campaignKey}/segments/reorder`, data);
}

// ============================================
// Screen Heartbeat (TV App)
// ============================================

export async function sendHeartbeat(screenKey: string, data?: HeartbeatPayload): Promise<WheelApiResponse<{ success: boolean }>> {
    return apiPost<WheelApiResponse<{ success: boolean }>>(`${BASE_URL}/screens/${screenKey}/heartbeat`, data);
}

// ============================================
// Players
// ============================================

export async function getPlayers(filters?: PlayerFilters): Promise<PlayersResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.state) params.append('state', filters.state);
    if (filters?.cep) params.append('cep', filters.cep);
    if (filters?.store_id) params.append('store_id', String(filters.store_id));
    if (filters?.campaign_id) params.append('campaign_id', String(filters.campaign_id));
    if (filters?.has_address !== undefined) params.append('has_address', String(filters.has_address));
    if (filters?.verified_only) params.append('verified_only', 'true');
    if (filters?.has_spins !== undefined) params.append('has_spins', String(filters.has_spins));
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_dir) params.append('sort_dir', filters.sort_dir);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.per_page) params.append('per_page', String(filters.per_page));

    const query = params.toString();
    return apiGet<PlayersResponse>(`${BASE_URL}/players${query ? `?${query}` : ''}`);
}

export async function getPlayer(playerKey: string): Promise<PlayerDetailResponse> {
    return apiGet<PlayerDetailResponse>(`${BASE_URL}/players/${playerKey}`);
}

export async function updatePlayer(playerKey: string, data: UpdatePlayerPayload): Promise<WheelApiResponse<WheelPlayer>> {
    return apiPut<WheelApiResponse<WheelPlayer>>(`${BASE_URL}/players/${playerKey}`, data);
}

export async function getPlayerLogs(playerKey: string, filters?: PlayerLogFilters): Promise<WheelPaginatedResponse<PlayerLog>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    if (filters?.page) params.append('page', String(filters.page));

    const query = params.toString();
    return apiGet<WheelPaginatedResponse<PlayerLog>>(`${BASE_URL}/players/${playerKey}/logs${query ? `?${query}` : ''}`);
}

export async function getPlayerSpins(playerKey: string, filters?: PlayerSpinFilters): Promise<WheelPaginatedResponse<PlayerSpin>> {
    const params = new URLSearchParams();
    if (filters?.campaign_id) params.append('campaign_id', String(filters.campaign_id));
    if (filters?.prize_id) params.append('prize_id', String(filters.prize_id));
    if (filters?.winners_only) params.append('winners_only', 'true');
    if (filters?.per_page) params.append('per_page', String(filters.per_page));
    if (filters?.page) params.append('page', String(filters.page));

    const query = params.toString();
    return apiGet<WheelPaginatedResponse<PlayerSpin>>(`${BASE_URL}/players/${playerKey}/spins${query ? `?${query}` : ''}`);
}

export async function getPlayerStatsByCity(): Promise<WheelApiResponse<CityStats[]>> {
    return apiGet<WheelApiResponse<CityStats[]>>(`${BASE_URL}/players/stats/by-city`);
}

export async function getPlayerStatsByStore(): Promise<WheelApiResponse<StorePlayerStats[]>> {
    return apiGet<WheelApiResponse<StorePlayerStats[]>>(`${BASE_URL}/players/stats/by-store`);
}

export async function exportPlayers(filters?: PlayerFilters): Promise<PlayersResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.state) params.append('state', filters.state);
    if (filters?.store_id) params.append('store_id', String(filters.store_id));
    if (filters?.campaign_id) params.append('campaign_id', String(filters.campaign_id));
    if (filters?.has_address !== undefined) params.append('has_address', String(filters.has_address));
    if (filters?.verified_only) params.append('verified_only', 'true');
    if (filters?.has_spins !== undefined) params.append('has_spins', String(filters.has_spins));
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const query = params.toString();
    return apiGet<PlayersResponse>(`${BASE_URL}/players/export${query ? `?${query}` : ''}`);
}

// ============================================
// Prize Rules
// ============================================

export async function getPrizeRules(campaignKey: string): Promise<WheelApiResponse<PrizeRule[]>> {
    return apiGet<WheelApiResponse<PrizeRule[]>>(`${BASE_URL}/campaigns/${campaignKey}/prize-rules`);
}

export async function getPrizeRule(ruleId: number): Promise<PrizeRuleDetailResponse> {
    return apiGet<PrizeRuleDetailResponse>(`${BASE_URL}/prize-rules/${ruleId}`);
}

export async function createPrizeRule(campaignKey: string, data: CreatePrizeRuleRequest): Promise<WheelApiResponse<PrizeRule>> {
    return apiPost<WheelApiResponse<PrizeRule>>(`${BASE_URL}/campaigns/${campaignKey}/prize-rules`, data);
}

export async function updatePrizeRule(ruleId: number, data: UpdatePrizeRuleRequest): Promise<WheelApiResponse<PrizeRule>> {
    return apiPut<WheelApiResponse<PrizeRule>>(`${BASE_URL}/prize-rules/${ruleId}`, data);
}

export async function deletePrizeRule(ruleId: number): Promise<WheelApiResponse<null>> {
    return apiDelete<WheelApiResponse<null>>(`${BASE_URL}/prize-rules/${ruleId}`);
}

export async function bulkUpdatePrizeRules(campaignKey: string, data: BulkUpdatePrizeRulesRequest): Promise<BulkUpdatePrizeRulesResponse> {
    return apiPut<BulkUpdatePrizeRulesResponse>(`${BASE_URL}/campaigns/${campaignKey}/prize-rules/bulk`, data);
}

export async function resetPrizeRuleCooldown(ruleId: number, scopeId?: number): Promise<WheelApiResponse<null>> {
    return apiPost<WheelApiResponse<null>>(`${BASE_URL}/prize-rules/${ruleId}/reset-cooldown`, { scope_id: scopeId });
}

export async function getPrizeState(campaignKey: string, screenId?: number): Promise<PrizeStateResponse> {
    const params = new URLSearchParams();
    if (screenId) params.append('screen_id', String(screenId));
    const query = params.toString();
    return apiGet<PrizeStateResponse>(`${BASE_URL}/campaigns/${campaignKey}/prize-state${query ? `?${query}` : ''}`);
}

// Export all functions as a service object
export const wheelService = {
    // Screens
    getScreens,
    getScreen,
    createScreen,
    updateScreen,
    deleteScreen,
    rotateScreenSecret,
    setScreenStatus,
    getScreenHealth,
    getScreenCampaigns,
    syncScreenCampaigns,
    activateCampaignOnScreen,
    sendHeartbeat,
    // Campaigns
    getCampaigns,
    getCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    activateCampaign,
    pauseCampaign,
    endCampaign,
    duplicateCampaign,
    getCampaignPreview,
    // Segments
    getSegments,
    syncSegments,
    createSegment,
    deleteSegment,
    reorderSegments,
    // Prizes
    getPrizes,
    getPrize,
    createPrize,
    updatePrize,
    deletePrize,
    togglePrize,
    // Inventory
    getInventory,
    syncInventory,
    addStock,
    resetDailyInventory,
    // Logs
    getEvents,
    // Analytics
    getAnalyticsSummary,
    getAnalyticsDetailed,
    getAnalyticsByStore,
    getAnalyticsPeakHours,
    getAnalyticsGeographic,
    getAnalyticsRoi,
    // Players
    getPlayers,
    getPlayer,
    updatePlayer,
    getPlayerLogs,
    getPlayerSpins,
    getPlayerStatsByCity,
    getPlayerStatsByStore,
    exportPlayers,
    // Prize Rules
    getPrizeRules,
    getPrizeRule,
    createPrizeRule,
    updatePrizeRule,
    deletePrizeRule,
    bulkUpdatePrizeRules,
    resetPrizeRuleCooldown,
    getPrizeState,
};

export default wheelService;
