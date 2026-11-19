/**
 * TV Signage & Ads Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tvService } from '@/services/tv.service';
import { toast } from 'sonner';
import type {
    CreateTvAdPayload,
    UpdateTvAdPayload,
    CreateTvWebhookPayload,
    UpdateTvWebhookPayload,
} from '@/types/tv.types';

export const tvAdsKeys = {
    all: ['admin', 'tv'] as const,
    ads: (params?: any) => [...tvAdsKeys.all, 'ads', params] as const,
    screens: () => [...tvAdsKeys.all, 'screens'] as const,
    stats: () => [...tvAdsKeys.all, 'stats'] as const,
    analytics: (params?: any) => [...tvAdsKeys.all, 'analytics', params] as const,
    design: () => [...tvAdsKeys.all, 'design'] as const,
    logs: (params?: any) => [...tvAdsKeys.all, 'logs', params] as const,
    webhooks: () => [...tvAdsKeys.all, 'webhooks'] as const,
    webhookDeliveries: (params?: any) => [...tvAdsKeys.all, 'webhook-deliveries', params] as const,
    playlist: (slugOrToken: string) => ['tv', 'playlist', slugOrToken] as const,
};

/**
 * Obter configurações de design (Global + Overrides de Loja)
 */
export function useTvDesignSettings() {
    return useQuery({
        queryKey: tvAdsKeys.design(),
        queryFn: () => tvService.getDesignSettings(),
    });
}

/**
 * Salvar template de design global padrão da rede
 */
export function useSaveGlobalDesign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (template: any) => tvService.saveGlobalDesign(template),
        onSuccess: (res) => {
            toast.success(res.message || 'Design global salvo com sucesso!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.design() });
            queryClient.invalidateQueries({ queryKey: ['tv', 'playlist'] });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao salvar design global.');
        },
    });
}

/**
 * Salvar template de design exclusivo de uma filial
 */
export function useSaveStoreDesign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ storeId, template }: { storeId: number; template: any }) =>
            tvService.saveStoreDesign(storeId, template),
        onSuccess: (res) => {
            toast.success(res.message || 'Design da loja salvo com sucesso!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.design() });
            queryClient.invalidateQueries({ queryKey: ['tv', 'playlist'] });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao salvar design da loja.');
        },
    });
}

/**
 * Restaurar loja para usar o design global padrão
 */
export function useResetStoreDesign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (storeId: number) => tvService.resetStoreDesign(storeId),
        onSuccess: (res) => {
            toast.success(res.message || 'Design restaurado para o padrão global!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.design() });
            queryClient.invalidateQueries({ queryKey: ['tv', 'playlist'] });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao restaurar design da loja.');
        },
    });
}

/**
 * Upload de Logomarca para o Estúdio de Design
 */
export function useUploadTvLogo() {
    return useMutation({
        mutationFn: (file: File) => tvService.uploadLogo(file),
        onSuccess: (res) => {
            toast.success(res.message || 'Logomarca enviada com sucesso!');
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Erro ao enviar logomarca.');
        },
    });
}

/**
 * Listar anúncios no Admin
 */
export function useTvAds(params?: {
    status?: string;
    media_type?: string;
    store_id?: number;
    search?: string;
    page?: number;
}) {
    return useQuery({
        queryKey: tvAdsKeys.ads(params),
        queryFn: () => tvService.listAds(params),
    });
}

/**
 * Listar telas e links de todas as lojas
 */
export function useTvScreens() {
    return useQuery({
        queryKey: tvAdsKeys.screens(),
        queryFn: () => tvService.listScreens(),
        refetchInterval: 15000, // Atualiza a cada 15 segundos para monitorar telemetria online
    });
}

/**
 * Enviar comando de controle remoto para TV (reload, next, pause, play, clear_cache, turn_off, turn_on, toggle_power)
 */
export function useTvSendCommand() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            screenId,
            command,
        }: {
            screenId: number;
            command: 'reload' | 'next' | 'pause' | 'play' | 'clear_cache' | 'turn_off' | 'turn_on' | 'toggle_power';
        }) => tvService.sendCommand(screenId, command),
        onSuccess: (res) => {
            toast.success(res.message || 'Comando enviado para a TV!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.screens() });
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.logs() });
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.analytics() });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao enviar comando para a TV.');
        },
    });
}

/**
 * Obter estatísticas gerais das TVs
 */
export function useTvStats() {
    return useQuery({
        queryKey: tvAdsKeys.stats(),
        queryFn: () => tvService.getStats(),
        refetchInterval: 15000,
    });
}

/**
 * Obter estatísticas analíticas e sessões por loja e período
 */
export function useTvAnalytics(params?: { store_id?: number | string; period?: string }) {
    return useQuery({
        queryKey: tvAdsKeys.analytics(params),
        queryFn: () => tvService.getAnalytics(params),
        refetchInterval: 15000,
    });
}

/**
 * Obter logs de diagnóstico e transmissão
 */
export function useTvLogs(params?: { level?: string; event?: string; screen_slug?: string; store_id?: number | string; page?: number }) {
    return useQuery({
        queryKey: tvAdsKeys.logs(params),
        queryFn: () => tvService.getLogs(params),
        refetchInterval: 10000,
    });
}

/**
 * Cadastrar anúncio com upload
 */
export function useCreateTvAd() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTvAdPayload) => tvService.createAd(payload),
        onSuccess: (res) => {
            toast.success(res.message || 'Anúncio publicado com sucesso!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.all });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao cadastrar o anúncio.');
        },
    });
}

/**
 * Atualizar anúncio
 */
export function useUpdateTvAd() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateTvAdPayload }) =>
            tvService.updateAd(id, payload),
        onSuccess: (res) => {
            toast.success(res.message || 'Anúncio atualizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.all });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao atualizar o anúncio.');
        },
    });
}

/**
 * Excluir anúncio
 */
export function useDeleteTvAd() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => tvService.deleteAd(id),
        onSuccess: () => {
            toast.success('Anúncio excluído com sucesso.');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.all });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao excluir o anúncio.');
        },
    });
}

/**
 * Atualizar configuração de monitoramento/orientação de uma tela
 */
export function useUpdateTvScreen() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            screenId,
            payload,
        }: {
            screenId: number;
            payload: { monitoring_enabled?: boolean; orientation?: 'auto' | 'horizontal' | 'vertical' };
        }) => tvService.updateScreen(screenId, payload),
        onSuccess: (res) => {
            toast.success(res.message || 'Configuração da TV atualizada.');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.screens() });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao atualizar configuração da TV.');
        },
    });
}

/**
 * Listar webhooks configurados e endpoints públicos Pull
 */
export function useTvWebhooks() {
    return useQuery({
        queryKey: tvAdsKeys.webhooks(),
        queryFn: () => tvService.listWebhooks(),
        refetchInterval: 30000,
    });
}

/**
 * Criar webhook Push
 */
export function useCreateTvWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTvWebhookPayload) => tvService.createWebhook(payload),
        onSuccess: (res) => {
            toast.success(res.message || 'Alerta cadastrado com sucesso!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.webhooks() });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Erro ao cadastrar alerta.');
        },
    });
}

/**
 * Atualizar webhook Push
 */
export function useUpdateTvWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateTvWebhookPayload }) =>
            tvService.updateWebhook(id, payload),
        onSuccess: (res) => {
            toast.success(res.message || 'Alerta atualizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.webhooks() });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Erro ao atualizar alerta.');
        },
    });
}

/**
 * Remover webhook Push
 */
export function useDeleteTvWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => tvService.deleteWebhook(id),
        onSuccess: (res) => {
            toast.success(res.message || 'Alerta removido com sucesso.');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.webhooks() });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Erro ao remover alerta.');
        },
    });
}

/**
 * Testar webhook Push de forma síncrona
 */
export function useTestTvWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => tvService.testWebhook(id),
        onSuccess: (res) => {
            toast.success(res.message || 'Envio de teste realizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.webhooks() });
            queryClient.invalidateQueries({ queryKey: [...tvAdsKeys.all, 'webhook-deliveries'] });
        },
        onError: (err: any) => {
            toast.error(err?.message || 'Falha ao enviar o teste.');
            queryClient.invalidateQueries({ queryKey: tvAdsKeys.webhooks() });
            queryClient.invalidateQueries({ queryKey: [...tvAdsKeys.all, 'webhook-deliveries'] });
        },
    });
}

/**
 * Histórico de entregas de webhooks
 */
export function useTvWebhookDeliveries(params?: { tv_webhook_id?: number; status?: string; per_page?: number }) {
    return useQuery({
        queryKey: tvAdsKeys.webhookDeliveries(params),
        queryFn: () => tvService.listWebhookDeliveries(params),
        refetchInterval: 15000,
    });
}

/**
 * Obter playlist para o player de TV (fallback de segurança a cada 120s;
 * atualizações em tempo real são disparadas via playlist_version no ping de 30s).
 */
export function useTvPlaylist(slugOrToken: string, enabled = true) {
    return useQuery({
        queryKey: tvAdsKeys.playlist(slugOrToken),
        queryFn: () => tvService.getPlaylist(slugOrToken),
        enabled: enabled && !!slugOrToken,
        refetchInterval: 120000,
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });
}
