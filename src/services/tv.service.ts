/**
 * TV Signage & Ads Service
 */

import { api, apiGet, apiPut, apiPatch, apiDelete, apiPost, apiUpload } from '@/lib/api';
import type {
    TvAd,
    TvScreenItem,
    TvPlaylistResponse,
    CreateTvAdPayload,
    UpdateTvAdPayload,
    TvAnalyticsResponse,
    TvDesignSettingsResponse,
    TvDesignTemplate,
    TvPingPayload,
    TvPingResponse,
    TvWebhookItem,
    TvWebhooksMeta,
    TvWebhookDeliveryItem,
    CreateTvWebhookPayload,
    UpdateTvWebhookPayload,
} from '@/types/tv.types';

export const tvService = {
    /**
     * Listar anúncios (Admin)
     */
    async listAds(params?: {
        status?: string;
        media_type?: string;
        store_id?: number;
        search?: string;
        page?: number;
    }): Promise<{ data: TvAd[]; meta: any }> {
        return apiGet('/admin/tv/ads', params || {});
    },

    /**
     * Cadastrar anúncio com upload direto ou mídia pré-processada (Admin)
     */
    async createAd(payload: CreateTvAdPayload): Promise<{ success: boolean; data: TvAd; message: string }> {
        if (payload.media_url && payload.media_path) {
            return apiPost('/admin/tv/ads', payload);
        }

        const formData = new FormData();
        formData.append('title', payload.title);
        if (payload.file) {
            formData.append('file', payload.file);
        }

        if (payload.duration_seconds) {
            formData.append('duration_seconds', String(payload.duration_seconds));
        }
        if (payload.target_orientation) {
            formData.append('target_orientation', payload.target_orientation);
        }
        if (payload.is_global !== undefined) {
            formData.append('is_global', payload.is_global ? '1' : '0');
        }
        if (payload.status) {
            formData.append('status', payload.status);
        }
        if (payload.starts_at) {
            formData.append('starts_at', payload.starts_at);
        }
        if (payload.ends_at) {
            formData.append('ends_at', payload.ends_at);
        }
        if (payload.days_of_week && payload.days_of_week.length > 0) {
            payload.days_of_week.forEach((day, index) => {
                formData.append(`days_of_week[${index}]`, String(day));
            });
        }
        if (payload.store_ids && payload.store_ids.length > 0) {
            payload.store_ids.forEach((storeId, index) => {
                formData.append(`store_ids[${index}]`, String(storeId));
            });
        }
        if (payload.order_priority !== undefined) {
            formData.append('order_priority', String(payload.order_priority));
        }

        return apiPost('/admin/tv/ads', formData);
    },

    /**
     * Atualizar anúncio existente (Admin)
     */
    async updateAd(id: number, payload: UpdateTvAdPayload): Promise<{ success: boolean; data: TvAd; message: string }> {
        if (payload.media_url && payload.media_path) {
            return apiPut(`/admin/tv/ads/${id}`, payload);
        }

        if (payload.file) {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('file', payload.file);

            if (payload.title) formData.append('title', payload.title);
            if (payload.duration_seconds) formData.append('duration_seconds', String(payload.duration_seconds));
            if (payload.target_orientation) formData.append('target_orientation', payload.target_orientation);
            if (payload.is_global !== undefined) formData.append('is_global', payload.is_global ? '1' : '0');
            if (payload.status) formData.append('status', payload.status);
            if (payload.starts_at) formData.append('starts_at', payload.starts_at);
            if (payload.ends_at) formData.append('ends_at', payload.ends_at);
            if (payload.days_of_week && payload.days_of_week.length > 0) {
                payload.days_of_week.forEach((day, index) => {
                    formData.append(`days_of_week[${index}]`, String(day));
                });
            }
            if (payload.store_ids) {
                payload.store_ids.forEach((storeId, index) => {
                    formData.append(`store_ids[${index}]`, String(storeId));
                });
            }

            return apiPost(`/admin/tv/ads/${id}`, formData);
        }

        return apiPut(`/admin/tv/ads/${id}`, payload);
    },

    /**
     * Excluir anúncio (Admin)
     */
    async deleteAd(id: number): Promise<{ success: boolean; message: string }> {
        return apiDelete(`/admin/tv/ads/${id}`);
    },

    /**
     * Listar telas e links das lojas (Admin)
     */
    async listScreens(): Promise<{ success: boolean; data: TvScreenItem[] }> {
        return apiGet('/admin/tv/screens');
    },

    /**
     * Enviar comando de controle remoto para uma TV (Admin)
     */
    async sendCommand(
        screenId: number,
        command: 'reload' | 'next' | 'pause' | 'play' | 'clear_cache' | 'turn_off' | 'turn_on' | 'toggle_power'
    ): Promise<{ success: boolean; message: string; data?: any }> {
        return apiPost(`/admin/tv/screens/${screenId}/command`, { command });
    },

    /**
     * Estatísticas gerais de transmissão e exibição (Admin)
     */
    async getStats(): Promise<{
        success: boolean;
        data: {
            active_ads_count: number;
            total_screens: number;
            online_screens: number;
            impressions_today: number;
            airtime_today_minutes: number;
            recent_logs: any[];
        };
    }> {
        return apiGet('/admin/tv/stats');
    },

    /**
     * Estatísticas detalhadas de exibição e sessões de funcionamento por loja (Admin)
     */
    async getAnalytics(params?: { store_id?: number | string; period?: string }): Promise<{
        success: boolean;
        data: TvAnalyticsResponse;
    }> {
        return apiGet('/admin/tv/analytics', params || {});
    },

    /**
     * Obter templates de design (Global + Overrides por Loja) (Admin)
     */
    async getDesignSettings(): Promise<{ success: boolean; data: TvDesignSettingsResponse }> {
        return apiGet('/admin/tv/design');
    },

    /**
     * Salvar template de design global padrão da rede (Admin)
     */
    async saveGlobalDesign(template: TvDesignTemplate): Promise<{ success: boolean; message: string; data: TvDesignTemplate }> {
        return apiPost('/admin/tv/design/global', { template });
    },

    /**
     * Salvar template de design customizado para uma filial específica (Admin)
     */
    async saveStoreDesign(storeId: number, template: TvDesignTemplate): Promise<{ success: boolean; message: string; data: TvDesignTemplate }> {
        return apiPost(`/admin/tv/design/stores/${storeId}`, { template });
    },

    /**
     * Restaurar filial para usar o design global padrão (Admin)
     */
    async resetStoreDesign(storeId: number): Promise<{ success: boolean; message: string }> {
        return apiDelete(`/admin/tv/design/stores/${storeId}`);
    },

    /**
     * Upload de Logomarca para o Estúdio de Design (Admin)
     */
    async uploadLogo(file: File): Promise<{ success: boolean; message: string; data: { url: string; path: string } }> {
        return apiUpload('/admin/tv/design/upload-logo', file, 'file');
    },

    /**
     * Logs de diagnóstico e transmissão (Admin)
     */
    async getLogs(params?: { level?: string; event?: string; screen_slug?: string; store_id?: number | string; page?: number }): Promise<{
        success: boolean;
        data: any[];
        meta: any;
    }> {
        return apiGet('/admin/tv/logs', params || {});
    },

    /**
     * Obter playlist runtime da TV (Público)
     */
    async getPlaylist(slugOrToken: string): Promise<{ success: boolean; data: TvPlaylistResponse }> {
        return apiGet(`/tv/playlist/${slugOrToken}`);
    },

    /**
     * Atualizar configuração de monitoramento/orientação de uma tela (Admin)
     */
    async updateScreen(
        screenId: number,
        payload: { monitoring_enabled?: boolean; orientation?: 'auto' | 'horizontal' | 'vertical' }
    ): Promise<{ success: boolean; message: string; data: any }> {
        return apiPatch(`/admin/tv/screens/${screenId}`, payload);
    },

    /**
     * Listar webhooks configurados e metadados dos endpoints públicos (Admin)
     */
    async listWebhooks(): Promise<{ success: boolean; data: TvWebhookItem[]; meta: TvWebhooksMeta }> {
        return apiGet('/admin/tv/webhooks');
    },

    /**
     * Cadastrar webhook de saída (Admin)
     */
    async createWebhook(payload: CreateTvWebhookPayload): Promise<{ success: boolean; message: string; data: TvWebhookItem }> {
        return apiPost('/admin/tv/webhooks', payload);
    },

    /**
     * Atualizar webhook de saída (Admin)
     */
    async updateWebhook(id: number, payload: UpdateTvWebhookPayload): Promise<{ success: boolean; message: string; data: TvWebhookItem }> {
        return apiPut(`/admin/tv/webhooks/${id}`, payload);
    },

    /**
     * Excluir webhook de saída (Admin)
     */
    async deleteWebhook(id: number): Promise<{ success: boolean; message: string }> {
        return apiDelete(`/admin/tv/webhooks/${id}`);
    },

    /**
     * Testar entrega síncrona de um webhook (Admin)
     */
    async testWebhook(id: number): Promise<{ success: boolean; message: string; data: TvWebhookDeliveryItem }> {
        return apiPost(`/admin/tv/webhooks/${id}/test`, {});
    },

    /**
     * Listar histórico de entregas de webhooks (Admin)
     */
    async listWebhookDeliveries(params?: {
        tv_webhook_id?: number;
        event_type?: string;
        status?: string;
        screen_slug?: string;
        per_page?: number;
        page?: number;
    }): Promise<{ success: boolean; data: TvWebhookDeliveryItem[]; meta: any }> {
        return apiGet('/admin/tv/webhooks/deliveries', params || {});
    },

    /**
     * Heartbeat da TV com telemetria completa (Público)
     */
    async ping(slugOrToken: string, data?: TvPingPayload): Promise<TvPingResponse> {
        return apiPost(`/tv/ping/${slugOrToken}`, data || {});
    },

    /**
     * Desconexão graciosa via navigator.sendBeacon ao fechar/navegar para fora do player (Público)
     */
    sendDisconnectBeacon(slugOrToken: string, data: { device_id?: string; reason?: string; uptime_seconds?: number }): void {
        const base = String(api.defaults.baseURL || import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
        const url = `${base}/tv/disconnect/${encodeURIComponent(slugOrToken)}`;
        const body = JSON.stringify(data);

        try {
            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
                navigator.sendBeacon(url, blob);
                return;
            }
        } catch {
            // Fallback below
        }

        try {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
            }).catch(() => {});
        } catch {
            // Ignore during unload
        }
    },

    /**
     * Registrar impressão de anúncio (Público)
     */
    async logImpression(
        slugOrToken: string,
        data: {
            tv_ad_id: number;
            duration_played_seconds: number;
            completed_naturally: boolean;
            media_type: string;
        }
    ): Promise<{ success: boolean }> {
        return apiPost(`/tv/impression/${slugOrToken}`, data);
    },

    /**
     * Registrar erro de reprodução da TV (Público)
     */
    async logError(
        slugOrToken: string,
        data: {
            message: string;
            url?: string;
            type?: string;
        }
    ): Promise<{ success: boolean }> {
        return apiPost(`/tv/error/${slugOrToken}`, data);
    },
};
