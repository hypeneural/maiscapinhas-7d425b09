/**
 * Wheel Module React Query Hooks
 * 
 * React Query hooks for the "Roleta nas TVs" (Wheel) admin module.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wheelService } from '@/services/admin/wheel.service';
import type {
    ScreenFilters,
    CampaignFilters,
    PrizeFilters,
    EventFilters,
    AnalyticsFilters,
    CreateScreenPayload,
    UpdateScreenPayload,
    ScreenStatus,
    CreateCampaignPayload,
    UpdateCampaignPayload,
    CreatePrizePayload,
    UpdatePrizePayload,
    SegmentInput,
    InventoryInput,
    SyncScreenCampaignsPayload,
    DuplicateCampaignPayload,
    HeartbeatPayload,
    // Player types
    PlayerFilters,
    PlayerLogFilters,
    PlayerSpinFilters,
    UpdatePlayerPayload,
    // Advanced Analytics types
    ByStoreAnalyticsFilters,
    RoiFilters,
    AnalyticsPeriod,
} from '@/types/wheel.types';

// ============================================
// Query Keys
// ============================================

export const wheelKeys = {
    all: ['wheel'] as const,

    // Screens
    screens: () => [...wheelKeys.all, 'screens'] as const,
    screenList: (filters?: ScreenFilters) => [...wheelKeys.screens(), 'list', filters] as const,
    screenDetail: (key: string) => [...wheelKeys.screens(), 'detail', key] as const,
    screenHealth: (key: string) => [...wheelKeys.screens(), 'health', key] as const,
    screenCampaigns: (key: string) => [...wheelKeys.screens(), 'campaigns', key] as const,

    // Campaigns
    campaigns: () => [...wheelKeys.all, 'campaigns'] as const,
    campaignList: (filters?: CampaignFilters) => [...wheelKeys.campaigns(), 'list', filters] as const,
    campaignDetail: (key: string) => [...wheelKeys.campaigns(), 'detail', key] as const,
    campaignPreview: (key: string) => [...wheelKeys.campaigns(), 'preview', key] as const,

    // Segments
    segments: (campaignKey: string) => [...wheelKeys.campaigns(), campaignKey, 'segments'] as const,

    // Prizes
    prizes: () => [...wheelKeys.all, 'prizes'] as const,
    prizeList: (filters?: PrizeFilters) => [...wheelKeys.prizes(), 'list', filters] as const,
    prizeDetail: (key: string) => [...wheelKeys.prizes(), 'detail', key] as const,

    // Inventory
    inventory: (campaignKey: string) => [...wheelKeys.campaigns(), campaignKey, 'inventory'] as const,

    // Logs & Analytics
    events: (filters?: EventFilters) => [...wheelKeys.all, 'events', filters] as const,
    analytics: () => [...wheelKeys.all, 'analytics'] as const,
    analyticsSummary: () => [...wheelKeys.analytics(), 'summary'] as const,
    analyticsDetailed: (filters?: AnalyticsFilters) => [...wheelKeys.analytics(), 'detailed', filters] as const,
    analyticsByStore: (filters?: ByStoreAnalyticsFilters) => [...wheelKeys.analytics(), 'by-store', filters] as const,
    analyticsPeakHours: (filters?: { period?: AnalyticsPeriod }) => [...wheelKeys.analytics(), 'peak-hours', filters] as const,
    analyticsGeographic: (filters?: { period?: AnalyticsPeriod }) => [...wheelKeys.analytics(), 'geographic', filters] as const,
    analyticsRoi: (filters?: RoiFilters) => [...wheelKeys.analytics(), 'roi', filters] as const,

    // Players
    players: () => [...wheelKeys.all, 'players'] as const,
    playerList: (filters?: PlayerFilters) => [...wheelKeys.players(), 'list', filters] as const,
    playerDetail: (key: string) => [...wheelKeys.players(), 'detail', key] as const,
    playerLogs: (key: string, filters?: PlayerLogFilters) => [...wheelKeys.players(), key, 'logs', filters] as const,
    playerSpins: (key: string, filters?: PlayerSpinFilters) => [...wheelKeys.players(), key, 'spins', filters] as const,
    playerStatsByCity: () => [...wheelKeys.players(), 'stats', 'by-city'] as const,
    playerStatsByStore: () => [...wheelKeys.players(), 'stats', 'by-store'] as const,
};

// ============================================
// Screens Hooks
// ============================================

export function useWheelScreens(filters?: ScreenFilters) {
    return useQuery({
        queryKey: wheelKeys.screenList(filters),
        queryFn: () => wheelService.getScreens(filters),
    });
}

export function useWheelScreen(screenKey: string) {
    return useQuery({
        queryKey: wheelKeys.screenDetail(screenKey),
        queryFn: () => wheelService.getScreen(screenKey),
        enabled: !!screenKey,
    });
}

export function useWheelScreenHealth(screenKey: string) {
    return useQuery({
        queryKey: wheelKeys.screenHealth(screenKey),
        queryFn: () => wheelService.getScreenHealth(screenKey),
        enabled: !!screenKey,
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export function useWheelScreenCampaigns(screenKey: string) {
    return useQuery({
        queryKey: wheelKeys.screenCampaigns(screenKey),
        queryFn: () => wheelService.getScreenCampaigns(screenKey),
        enabled: !!screenKey,
    });
}

export function useCreateScreen() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateScreenPayload) => wheelService.createScreen(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.screens() });
            queryClient.invalidateQueries({ queryKey: wheelKeys.analyticsSummary() });
        },
    });
}

export function useUpdateScreen() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ key, data }: { key: string; data: UpdateScreenPayload }) =>
            wheelService.updateScreen(key, data),
        onSuccess: (_, { key }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.screenDetail(key) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.screens() });
        },
    });
}

export function useDeleteScreen() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (screenKey: string) => wheelService.deleteScreen(screenKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.screens() });
            queryClient.invalidateQueries({ queryKey: wheelKeys.analyticsSummary() });
        },
    });
}

export function useRotateScreenSecret() {
    return useMutation({
        mutationFn: (screenKey: string) => wheelService.rotateScreenSecret(screenKey),
    });
}

export function useSetScreenStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ key, status }: { key: string; status: ScreenStatus }) =>
            wheelService.setScreenStatus(key, status),
        onSuccess: (_, { key }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.screenDetail(key) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.screens() });
        },
    });
}

export function useSyncScreenCampaigns() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ screenKey, data }: { screenKey: string; data: SyncScreenCampaignsPayload }) =>
            wheelService.syncScreenCampaigns(screenKey, data),
        onSuccess: (_, { screenKey }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.screenCampaigns(screenKey) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.screenDetail(screenKey) });
        },
    });
}

export function useActivateCampaignOnScreen() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ screenKey, campaignKey }: { screenKey: string; campaignKey: string }) =>
            wheelService.activateCampaignOnScreen(screenKey, campaignKey),
        onSuccess: (_, { screenKey }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.screenDetail(screenKey) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.screenCampaigns(screenKey) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.screens() });
        },
    });
}

export function useSendHeartbeat() {
    return useMutation({
        mutationFn: ({ screenKey, data }: { screenKey: string; data?: HeartbeatPayload }) =>
            wheelService.sendHeartbeat(screenKey, data),
    });
}

// ============================================
// Campaigns Hooks
// ============================================

export function useWheelCampaigns(filters?: CampaignFilters) {
    return useQuery({
        queryKey: wheelKeys.campaignList(filters),
        queryFn: () => wheelService.getCampaigns(filters),
    });
}

export function useWheelCampaign(campaignKey: string) {
    return useQuery({
        queryKey: wheelKeys.campaignDetail(campaignKey),
        queryFn: () => wheelService.getCampaign(campaignKey),
        enabled: !!campaignKey,
    });
}

export function useWheelCampaignPreview(campaignKey: string) {
    return useQuery({
        queryKey: wheelKeys.campaignPreview(campaignKey),
        queryFn: () => wheelService.getCampaignPreview(campaignKey),
        enabled: !!campaignKey,
    });
}

export function useCreateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCampaignPayload) => wheelService.createCampaign(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaigns() });
            queryClient.invalidateQueries({ queryKey: wheelKeys.analyticsSummary() });
        },
    });
}

export function useUpdateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ key, data }: { key: string; data: UpdateCampaignPayload }) =>
            wheelService.updateCampaign(key, data),
        onSuccess: (_, { key }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaignDetail(key) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaigns() });
        },
    });
}

export function useDeleteCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (campaignKey: string) => wheelService.deleteCampaign(campaignKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaigns() });
            queryClient.invalidateQueries({ queryKey: wheelKeys.analyticsSummary() });
        },
    });
}

export function useDuplicateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ key, data }: { key: string; data: DuplicateCampaignPayload }) =>
            wheelService.duplicateCampaign(key, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaigns() });
            queryClient.invalidateQueries({ queryKey: wheelKeys.analyticsSummary() });
        },
    });
}

export function useActivateCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (campaignKey: string) => wheelService.activateCampaign(campaignKey),
        onSuccess: (_, key) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaignDetail(key) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaigns() });
            queryClient.invalidateQueries({ queryKey: wheelKeys.analyticsSummary() });
        },
    });
}

export function usePauseCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (campaignKey: string) => wheelService.pauseCampaign(campaignKey),
        onSuccess: (_, key) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaignDetail(key) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaigns() });
            queryClient.invalidateQueries({ queryKey: wheelKeys.analyticsSummary() });
        },
    });
}

export function useEndCampaign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (campaignKey: string) => wheelService.endCampaign(campaignKey),
        onSuccess: (_, key) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaignDetail(key) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaigns() });
            queryClient.invalidateQueries({ queryKey: wheelKeys.analyticsSummary() });
        },
    });
}

// ============================================
// Segments Hooks
// ============================================

export function useWheelSegments(campaignKey: string) {
    return useQuery({
        queryKey: wheelKeys.segments(campaignKey),
        queryFn: () => wheelService.getSegments(campaignKey),
        enabled: !!campaignKey,
    });
}

export function useSyncSegments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ campaignKey, segments }: { campaignKey: string; segments: SegmentInput[] }) =>
            wheelService.syncSegments(campaignKey, { segments }),
        onSuccess: (_, { campaignKey }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.segments(campaignKey) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaignDetail(campaignKey) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaignPreview(campaignKey) });
        },
    });
}

export function useReorderSegments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ campaignKey, order }: { campaignKey: string; order: number[] }) =>
            wheelService.reorderSegments(campaignKey, { order }),
        onSuccess: (_, { campaignKey }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.segments(campaignKey) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaignPreview(campaignKey) });
        },
    });
}

export function useDeleteSegment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ campaignKey, segmentId }: { campaignKey: string; segmentId: number }) =>
            wheelService.deleteSegment(campaignKey, segmentId),
        onSuccess: (_, { campaignKey }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.segments(campaignKey) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.campaignDetail(campaignKey) });
        },
    });
}

// ============================================
// Prizes Hooks
// ============================================

export function useWheelPrizes(filters?: PrizeFilters) {
    return useQuery({
        queryKey: wheelKeys.prizeList(filters),
        queryFn: () => wheelService.getPrizes(filters),
    });
}

export function useWheelPrize(prizeKey: string) {
    return useQuery({
        queryKey: wheelKeys.prizeDetail(prizeKey),
        queryFn: () => wheelService.getPrize(prizeKey),
        enabled: !!prizeKey,
    });
}

export function useCreatePrize() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePrizePayload) => wheelService.createPrize(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.prizes() });
        },
    });
}

export function useUpdatePrize() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ key, data }: { key: string; data: UpdatePrizePayload }) =>
            wheelService.updatePrize(key, data),
        onSuccess: (_, { key }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.prizeDetail(key) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.prizes() });
        },
    });
}

export function useDeletePrize() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (prizeKey: string) => wheelService.deletePrize(prizeKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.prizes() });
        },
    });
}

export function useTogglePrize() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (prizeKey: string) => wheelService.togglePrize(prizeKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.prizes() });
        },
    });
}

// ============================================
// Inventory Hooks
// ============================================

export function useWheelInventory(campaignKey: string) {
    return useQuery({
        queryKey: wheelKeys.inventory(campaignKey),
        queryFn: () => wheelService.getInventory(campaignKey),
        enabled: !!campaignKey,
    });
}

export function useSyncInventory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ campaignKey, inventory }: { campaignKey: string; inventory: InventoryInput[] }) =>
            wheelService.syncInventory(campaignKey, { inventory }),
        onSuccess: (_, { campaignKey }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.inventory(campaignKey) });
        },
    });
}

export function useAddStock() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ campaignKey, prizeKey, quantity }: { campaignKey: string; prizeKey: string; quantity: number }) =>
            wheelService.addStock(campaignKey, prizeKey, { quantity }),
        onSuccess: (_, { campaignKey }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.inventory(campaignKey) });
        },
    });
}

export function useResetDailyInventory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ campaignKey, prizeKey }: { campaignKey: string; prizeKey: string }) =>
            wheelService.resetDailyInventory(campaignKey, prizeKey),
        onSuccess: (_, { campaignKey }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.inventory(campaignKey) });
        },
    });
}

// ============================================
// Analytics Hooks
// ============================================

export function useWheelAnalyticsSummary() {
    return useQuery({
        queryKey: wheelKeys.analyticsSummary(),
        queryFn: wheelService.getAnalyticsSummary,
        refetchInterval: 60000, // Refresh every minute
    });
}

export function useWheelAnalyticsDetailed(filters?: AnalyticsFilters) {
    return useQuery({
        queryKey: wheelKeys.analyticsDetailed(filters),
        queryFn: () => wheelService.getAnalyticsDetailed(filters),
    });
}

export function useWheelAnalyticsByStore(filters?: ByStoreAnalyticsFilters) {
    return useQuery({
        queryKey: wheelKeys.analyticsByStore(filters),
        queryFn: () => wheelService.getAnalyticsByStore(filters),
    });
}

export function useWheelAnalyticsPeakHours(filters?: { period?: AnalyticsPeriod }) {
    return useQuery({
        queryKey: wheelKeys.analyticsPeakHours(filters),
        queryFn: () => wheelService.getAnalyticsPeakHours(filters),
    });
}

export function useWheelAnalyticsGeographic(filters?: { period?: AnalyticsPeriod }) {
    return useQuery({
        queryKey: wheelKeys.analyticsGeographic(filters),
        queryFn: () => wheelService.getAnalyticsGeographic(filters),
    });
}

export function useWheelAnalyticsRoi(filters?: RoiFilters) {
    return useQuery({
        queryKey: wheelKeys.analyticsRoi(filters),
        queryFn: () => wheelService.getAnalyticsRoi(filters),
    });
}

export function useWheelEvents(filters?: EventFilters) {
    return useQuery({
        queryKey: wheelKeys.events(filters),
        queryFn: () => wheelService.getEvents(filters),
    });
}

// ============================================
// Players Hooks
// ============================================

export function useWheelPlayers(filters?: PlayerFilters) {
    return useQuery({
        queryKey: wheelKeys.playerList(filters),
        queryFn: () => wheelService.getPlayers(filters),
        staleTime: 30_000, // 30s
    });
}

export function useWheelPlayer(playerKey: string) {
    return useQuery({
        queryKey: wheelKeys.playerDetail(playerKey),
        queryFn: () => wheelService.getPlayer(playerKey),
        enabled: !!playerKey,
    });
}

export function useWheelPlayerLogs(playerKey: string, filters?: PlayerLogFilters) {
    return useQuery({
        queryKey: wheelKeys.playerLogs(playerKey, filters),
        queryFn: () => wheelService.getPlayerLogs(playerKey, filters),
        enabled: !!playerKey,
    });
}

export function useWheelPlayerSpins(playerKey: string, filters?: PlayerSpinFilters) {
    return useQuery({
        queryKey: wheelKeys.playerSpins(playerKey, filters),
        queryFn: () => wheelService.getPlayerSpins(playerKey, filters),
        enabled: !!playerKey,
    });
}

export function useWheelPlayerStatsByCity() {
    return useQuery({
        queryKey: wheelKeys.playerStatsByCity(),
        queryFn: wheelService.getPlayerStatsByCity,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useWheelPlayerStatsByStore() {
    return useQuery({
        queryKey: wheelKeys.playerStatsByStore(),
        queryFn: wheelService.getPlayerStatsByStore,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useUpdatePlayer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ key, data }: { key: string; data: UpdatePlayerPayload }) =>
            wheelService.updatePlayer(key, data),
        onSuccess: (_, { key }) => {
            queryClient.invalidateQueries({ queryKey: wheelKeys.playerDetail(key) });
            queryClient.invalidateQueries({ queryKey: wheelKeys.players() });
        },
    });
}

export function useExportPlayers() {
    return useMutation({
        mutationFn: (filters?: PlayerFilters) => wheelService.exportPlayers(filters),
    });
}
