/**
 * TV Signage & Ads Service
 */

import { apiGet, apiPut, apiDelete, apiPost, apiUpload } from '@/lib/api';
import type {
    TvAd,
    TvScreenItem,
    TvPlaylistResponse,
    CreateTvAdPayload,
    UpdateTvAdPayload,
    TvAnalyticsResponse,
    TvDesignSettingsResponse,
    TvDesignTemplate,
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
     * Heartbeat da TV com telemetria (Público)
     */
    async ping(
        slugOrToken: string,
        data?: {
            width?: number;
            height?: number;
            current_ad_id?: number;
            current_ad_title?: string;
            fps?: number;
            uptime_seconds?: number;
            offline_cached?: boolean;
        }
    ): Promise<{ success: boolean }> {
        return apiPost(`/tv/ping/${slugOrToken}`, data || {});
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
