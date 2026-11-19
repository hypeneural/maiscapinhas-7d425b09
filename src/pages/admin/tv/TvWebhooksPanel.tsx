/**
 * Painel de Alertas Automáticos & Links de Consulta ao Vivo das TVs
 * Interface simplificada 100% em português para operadores.
 */

import { useState, type ComponentType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    BellRing,
    Plus,
    Copy,
    Check,
    ExternalLink,
    Send,
    Trash2,
    Pencil,
    CheckCircle2,
    XCircle,
    Clock,
    Timer,
    Globe,
    Loader2,
    RefreshCw,
    Wifi,
    WifiOff,
    AlertTriangle,
    Moon,
    Sun,
    ShieldAlert,
    MonitorSmartphone,
    Store as StoreIcon,
    ChevronDown,
    ChevronUp,
    History,
    Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    useTvWebhooks,
    useCreateTvWebhook,
    useUpdateTvWebhook,
    useDeleteTvWebhook,
    useTestTvWebhook,
    useTvWebhookDeliveries,
} from '@/hooks/api/use-tv-ads';
import type { TvWebhookItem } from '@/types/tv.types';

interface TvWebhooksPanelProps {
    stores: Array<{ id: number; name: string }>;
}

interface TvEventMeta {
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    badgeClass: string;
    primary?: boolean;
}

const TV_EVENT_META: Record<string, TvEventMeta> = {
    'tv.went_offline': {
        label: 'TV fora do ar',
        description: 'Avisa quando a TV para de responder por mais de 3 minutos ou é fechada.',
        icon: WifiOff,
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
        primary: true,
    },
    'tv.came_online': {
        label: 'TV voltou ao ar',
        description: 'Avisa quando uma TV que estava fora do ar volta a transmitir, informando o tempo parada.',
        icon: Wifi,
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        primary: true,
    },
    'tv.became_degraded': {
        label: 'Sinal instável',
        description: 'Avisa se a TV atrasar os sinais ou apresentar instabilidade de rede.',
        icon: AlertTriangle,
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    },
    'tv.recovered_healthy': {
        label: 'Sinal normalizado',
        description: 'Avisa quando a TV sai do estado instável e volta ao normal.',
        icon: CheckCircle2,
        badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
    },
    'tv.standby_enabled': {
        label: 'Modo espera ativado',
        description: 'Avisa quando alguém desliga a tela da TV pelo painel.',
        icon: Moon,
        badgeClass: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
    },
    'tv.standby_disabled': {
        label: 'TV religada',
        description: 'Avisa quando a tela sai do modo de espera e volta a exibir anúncios.',
        icon: Sun,
        badgeClass: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
    },
    'tv.player_error_spike': {
        label: 'Erro nos vídeos',
        description: 'Avisa se vários erros de reprodução de vídeo acontecerem em sequência.',
        icon: ShieldAlert,
        badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
    },
    'tv.device_changed': {
        label: 'Troca de aparelho/tela',
        description: 'Avisa se o link da loja for aberto em outro aparelho ou mudar de resolução.',
        icon: MonitorSmartphone,
        badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    },
    'tv.playlist_updated': {
        label: 'Anúncios atualizados',
        description: 'Avisa sempre que um anúncio ou visual da TV for alterado no sistema.',
        icon: RefreshCw,
        badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    },
    'tv.webhook_test': {
        label: 'Envio de teste',
        description: 'Disparo manual feito para validar se o endereço de destino está recebendo.',
        icon: Send,
        badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    },
};

const DEFAULT_EVENTS = ['tv.went_offline', 'tv.came_online'];

const INTERVAL_PRESETS = [
    { label: 'Sem espera', seconds: 0 },
    { label: '1 min', seconds: 60 },
    { label: '5 min', seconds: 300 },
    { label: '15 min', seconds: 900 },
];

function getEventMeta(eventKey: string): TvEventMeta {
    return (
        TV_EVENT_META[eventKey] || {
            label: 'Outro aviso',
            description: 'Notificação do monitoramento das TVs.',
            icon: BellRing,
            badgeClass: 'bg-muted text-foreground border-border',
        }
    );
}

function formatIntervalPt(seconds: number): string {
    if (!seconds || seconds <= 0) return 'Sem espera';
    if (seconds < 60) return `${seconds} seg`;
    if (seconds % 3600 === 0) {
        const h = seconds / 3600;
        return h === 1 ? '1 hora' : `${h} horas`;
    }
    if (seconds % 60 === 0) {
        const m = seconds / 60;
        return m === 1 ? '1 min' : `${m} min`;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} min ${s}s`;
}

function formatLatencyPt(ms?: number | null): string {
    if (ms === null || ms === undefined) return '';
    if (ms >= 1000) return `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
    return `${ms} ms`;
}

function formatDeliveryNotePt(message?: string | null): string {
    if (!message) return '';
    if (/cooldown|anti-flapping/i.test(message)) {
        const match = message.match(/(\d+)s/);
        return match
            ? `Aviso repetido ignorado dentro do intervalo mínimo de ${formatIntervalPt(Number(match[1]))}.`
            : 'Aviso repetido ignorado para evitar excesso de mensagens.';
    }
    return message;
}

function EventBadge({ eventKey }: { eventKey: string }) {
    const meta = getEventMeta(eventKey);
    const Icon = meta.icon;
    return (
        <Badge
            variant="outline"
            title={`Evento técnico: ${eventKey}`}
            className={`text-[11px] font-medium gap-1.5 px-2 py-0.5 ${meta.badgeClass}`}
        >
            <Icon className="h-3 w-3 shrink-0" />
            {meta.label}
        </Badge>
    );
}

export function TvWebhooksPanel({ stores }: TvWebhooksPanelProps) {
    const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<'all' | 'delivered' | 'failed' | 'skipped_cooldown'>('all');

    const { data: webhooksRes, isLoading: webhooksLoading } = useTvWebhooks();
    const {
        data: deliveriesRes,
        isLoading: deliveriesLoading,
        isFetching: deliveriesFetching,
        refetch: refetchDeliveries,
    } = useTvWebhookDeliveries({
        per_page: 25,
        status: deliveryStatusFilter === 'all' ? undefined : deliveryStatusFilter,
    });

    const createMutation = useCreateTvWebhook();
    const updateMutation = useUpdateTvWebhook();
    const deleteMutation = useDeleteTvWebhook();
    const testMutation = useTestTvWebhook();

    const webhooks = webhooksRes?.data || [];
    const meta = webhooksRes?.meta;
    const deliveries = deliveriesRes?.data || [];

    // Modal de criação / edição
    const [modalOpen, setModalOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<TvWebhookItem | null>(null);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [urlError, setUrlError] = useState<string | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<string[]>(DEFAULT_EVENTS);
    const [showAdvancedEvents, setShowAdvancedEvents] = useState(false);
    const [onlySpecificStores, setOnlySpecificStores] = useState(false);
    const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
    const [onlyBusinessHours, setOnlyBusinessHours] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(60);
    const [customIntervalOpen, setCustomIntervalOpen] = useState(false);

    // Confirmação de exclusão e estados por linha
    const [deleteTarget, setDeleteTarget] = useState<TvWebhookItem | null>(null);
    const [testingId, setTestingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    // Copiar links + dicas técnicas recolhíveis
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [showIntegrationFilters, setShowIntegrationFilters] = useState(false);

    const openCreateModal = () => {
        setEditingWebhook(null);
        setName('');
        setUrl('');
        setUrlError(null);
        setSelectedEvents(DEFAULT_EVENTS);
        setShowAdvancedEvents(false);
        setOnlySpecificStores(false);
        setSelectedStoreIds([]);
        setOnlyBusinessHours(false);
        setCooldownSeconds(60);
        setCustomIntervalOpen(false);
        setModalOpen(true);
    };

    const openEditModal = (wh: TvWebhookItem) => {
        const events = wh.events && wh.events.length > 0 ? wh.events : DEFAULT_EVENTS;
        const hasOptional = events.some((ev) => !TV_EVENT_META[ev]?.primary);
        const storeList = wh.store_ids || [];
        const isPreset = INTERVAL_PRESETS.some((p) => p.seconds === wh.cooldown_seconds);

        setEditingWebhook(wh);
        setName(wh.name);
        setUrl(wh.url);
        setUrlError(null);
        setSelectedEvents(events);
        setShowAdvancedEvents(hasOptional);
        setOnlySpecificStores(storeList.length > 0);
        setSelectedStoreIds(storeList);
        setOnlyBusinessHours(Boolean(wh.only_during_business_hours));
        setCooldownSeconds(wh.cooldown_seconds ?? 60);
        setCustomIntervalOpen(!isPreset);
        setModalOpen(true);
    };

    const copyLink = async (key: string, text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            toast.success(`Link "${label}" copiado!`);
            setTimeout(() => {
                setCopiedKey((curr) => (curr === key ? null : curr));
            }, 2000);
        } catch {
            toast.error('Não foi possível copiar o link.');
        }
    };

    const toggleEvent = (eventKey: string) => {
        setSelectedEvents((prev) =>
            prev.includes(eventKey) ? prev.filter((k) => k !== eventKey) : [...prev, eventKey]
        );
    };

    const toggleStore = (storeId: number) => {
        setSelectedStoreIds((prev) =>
            prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
        );
    };

    const handleSave = async () => {
        const trimmedName = name.trim();
        const trimmedUrl = url.trim();

        if (!trimmedName) {
            toast.error('Dê um nome fácil de identificar para este alerta.');
            return;
        }
        if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
            setUrlError('Informe um endereço completo começando com https:// ou http://');
            return;
        }
        setUrlError(null);

        if (selectedEvents.length === 0) {
            toast.error('Escolha pelo menos um tipo de aviso.');
            return;
        }
        if (onlySpecificStores && selectedStoreIds.length === 0) {
            toast.error('Selecione pelo menos uma loja ou marque "Todas as lojas".');
            return;
        }

        const payload = {
            name: trimmedName,
            url: trimmedUrl,
            events: selectedEvents,
            store_ids: onlySpecificStores ? selectedStoreIds : null,
            only_during_business_hours: onlyBusinessHours,
            cooldown_seconds: Math.max(0, Number(cooldownSeconds) || 0),
        };

        if (editingWebhook) {
            await updateMutation.mutateAsync({ id: editingWebhook.id, payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        setModalOpen(false);
    };

    const handleToggleActive = async (wh: TvWebhookItem) => {
        setTogglingId(wh.id);
        try {
            await updateMutation.mutateAsync({
                id: wh.id,
                payload: { is_active: !wh.is_active },
            });
        } finally {
            setTogglingId(null);
        }
    };

    const handleTest = async (id: number) => {
        setTestingId(id);
        try {
            await testMutation.mutateAsync(id);
            await refetchDeliveries();
        } finally {
            setTestingId(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteMutation.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const originBase = typeof window !== 'undefined' ? window.location.origin : '';
    const publicLinks = [
        {
            key: 'fleet',
            label: 'Situação de todas as TVs',
            description: 'Mostra quais TVs estão no ar ou fora do ar, resolução, horário da loja e últimas atualizações.',
            url: meta?.public_endpoints?.fleet_status || `${originBase}/api/v1/tv/status`,
            canOpenDirectly: true,
        },
        {
            key: 'single',
            label: 'Situação de uma TV específica',
            description: 'Mostra detalhes, sessões e histórico completo de uma única loja (substitua {slug} pelo código da loja).',
            url: meta?.public_endpoints?.screen_status_template || `${originBase}/api/v1/tv/status/{slug}`,
            canOpenDirectly: false,
        },
        {
            key: 'history',
            label: 'Histórico geral de quedas e atualizações',
            description: 'Lista em ordem cronológica todas as quedas, retornos e trocas de anúncios da rede.',
            url: meta?.public_endpoints?.history_feed || `${originBase}/api/v1/tv/history`,
            canOpenDirectly: true,
        },
    ];

    const activeWebhooksCount = webhooks.filter((w) => w.is_active).length;
    const deliveredCount = deliveries.filter((d) => d.status === 'delivered').length;
    const primaryEventKeys = Object.keys(TV_EVENT_META).filter((k) => TV_EVENT_META[k].primary);
    const optionalEventKeys = Object.keys(TV_EVENT_META).filter(
        (k) => !TV_EVENT_META[k].primary && k !== 'tv.webhook_test'
    );

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-5">
            {/* Faixa de Resumo Rápido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Alertas automáticos ativos</p>
                            <p className="text-2xl font-bold mt-0.5">
                                {activeWebhooksCount}{' '}
                                <span className="text-sm font-normal text-muted-foreground">
                                    de {webhooks.length}
                                </span>
                            </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
                            <BellRing className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Envios recentes com sucesso</p>
                            <p className="text-2xl font-bold mt-0.5 text-emerald-600">{deliveredCount}</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Regra de detecção de queda</p>
                            <p className="text-sm font-semibold mt-1">
                                Avisa após{' '}
                                {formatIntervalPt(meta?.thresholds?.offline_threshold_seconds ?? 180)} sem sinal
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                TV checada a cada {meta?.thresholds?.heartbeat_interval_seconds ?? 30} segundos
                            </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                            <Timer className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 1. Alertas Automáticos das TVs (Seção Principal do Operador) */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BellRing className="h-5 w-5 text-primary" />
                            Alertas Automáticos das TVs
                        </CardTitle>
                        <CardDescription>
                            Envie avisos automáticos para WhatsApp, n8n ou outro sistema sempre que uma TV sair do ar ou voltar a funcionar.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="gap-1.5 shrink-0" onClick={openCreateModal}>
                        <Plus className="h-4 w-4" />
                        Novo Alerta
                    </Button>
                </CardHeader>
                <CardContent>
                    {meta?.default_env_webhook_configured && (
                        <div className="mb-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>
                                Integração padrão do servidor está ativa para avisos de <strong>TV fora do ar</strong> e{' '}
                                <strong>TV voltou ao ar</strong>.
                            </span>
                        </div>
                    )}

                    {webhooksLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : webhooks.length === 0 ? (
                        <div className="text-center py-10 px-4 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            <BellRing className="mx-auto h-10 w-10 opacity-30 mb-2" />
                            <p className="text-sm font-semibold text-foreground">Nenhum alerta automático cadastrado</p>
                            <p className="text-xs mt-1 mb-4 max-w-md mx-auto">
                                Cadastre o endereço da sua automação (WhatsApp, n8n ou Make) para ser avisado assim que uma TV ficar fora do ar ou voltar ao ar.
                            </p>
                            <Button size="sm" onClick={openCreateModal} className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                Criar Primeiro Alerta
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {webhooks.map((wh) => {
                                const isTesting = testingId === wh.id;
                                const isToggling = togglingId === wh.id;
                                const lastOk =
                                    wh.last_status_code !== null &&
                                    wh.last_status_code !== undefined &&
                                    wh.last_status_code >= 200 &&
                                    wh.last_status_code < 300;

                                return (
                                    <div
                                        key={wh.id}
                                        className={`p-4 rounded-xl border transition ${
                                            wh.is_active
                                                ? 'bg-card hover:border-primary/40 shadow-sm'
                                                : 'bg-muted/30 opacity-75'
                                        }`}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Coluna esquerda: Nome, destino, tags e regras */}
                                            <div className="space-y-2.5 min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-sm text-foreground">
                                                        {wh.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            wh.is_active
                                                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]'
                                                                : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30 text-[10px]'
                                                        }
                                                    >
                                                        {wh.is_active ? 'Ativo' : 'Pausado'}
                                                    </Badge>
                                                    {wh.last_triggered_at && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            {lastOk ? (
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                            ) : (
                                                                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                                            )}
                                                            Último envio:{' '}
                                                            {new Date(wh.last_triggered_at).toLocaleString('pt-BR', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    )}
                                                </div>

                                                <p
                                                    className="text-xs text-muted-foreground font-mono truncate max-w-2xl"
                                                    title={wh.url}
                                                >
                                                    {wh.url}
                                                </p>

                                                {/* Tags de eventos em português com ícones */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(wh.events || []).map((ev) => (
                                                        <EventBadge key={ev} eventKey={ev} />
                                                    ))}
                                                </div>

                                                {/* Regras em português simples */}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 text-primary/70" />
                                                        {wh.only_during_business_hours
                                                            ? 'Apenas horário da loja'
                                                            : 'Qualquer horário (24h)'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Timer className="h-3.5 w-3.5 text-primary/70" />
                                                        Intervalo mínimo: {formatIntervalPt(wh.cooldown_seconds)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <StoreIcon className="h-3.5 w-3.5 text-primary/70" />
                                                        {wh.store_ids && wh.store_ids.length > 0
                                                            ? `${wh.store_ids.length} loja(s) selecionada(s)`
                                                            : 'Todas as lojas'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Coluna direita: Controles e botões claros */}
                                            <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                                                <div className="flex items-center gap-2 mr-1 px-2.5 py-1.5 rounded-lg bg-muted/50">
                                                    <Switch
                                                        checked={wh.is_active}
                                                        disabled={isToggling}
                                                        onCheckedChange={() => handleToggleActive(wh)}
                                                        aria-label={`Alternar alerta ${wh.name}`}
                                                    />
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {wh.is_active ? 'Ligado' : 'Pausado'}
                                                    </span>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1.5 text-xs"
                                                    disabled={isTesting}
                                                    onClick={() => handleTest(wh.id)}
                                                >
                                                    {isTesting ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Send className="h-3.5 w-3.5 text-primary" />
                                                    )}
                                                    {isTesting ? 'Testando...' : 'Testar'}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1.5 text-xs"
                                                    onClick={() => openEditModal(wh)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Editar
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                                                    onClick={() => setDeleteTarget(wh)}
                                                    aria-label={`Excluir alerta ${wh.name}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only sm:not-sr-only">Excluir</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. Histórico de Envios */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <History className="h-5 w-5 text-blue-500" />
                            Histórico de Envios
                        </CardTitle>
                        <CardDescription>
                            Acompanhe cada aviso enviado automaticamente para saber se chegou sem erro.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {(
                            [
                                { id: 'all', label: 'Todos' },
                                { id: 'delivered', label: 'Enviados' },
                                { id: 'failed', label: 'Com falha' },
                                { id: 'skipped_cooldown', label: 'Ignorados' },
                            ] as const
                        ).map((f) => (
                            <Button
                                key={f.id}
                                type="button"
                                size="sm"
                                variant={deliveryStatusFilter === f.id ? 'default' : 'outline'}
                                className="h-7 text-xs px-2.5"
                                onClick={() => setDeliveryStatusFilter(f.id)}
                            >
                                {f.label}
                            </Button>
                        ))}
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 ml-1"
                            disabled={deliveriesFetching}
                            onClick={() => refetchDeliveries()}
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${deliveriesFetching ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {deliveriesLoading ? (
                        <div className="h-24 bg-muted animate-pulse rounded-lg" />
                    ) : deliveries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                            <p className="text-xs">Nenhum envio encontrado para este filtro.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data e hora</TableHead>
                                    <TableHead>Tipo de aviso</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead>Situação do envio</TableHead>
                                    <TableHead>Detalhes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deliveries.map((d) => {
                                    const note = formatDeliveryNotePt(d.error_message);
                                    const latency = formatLatencyPt(d.duration_ms);
                                    return (
                                        <TableRow key={d.id}>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(d.dispatched_at).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <EventBadge eventKey={d.event_type} />
                                            </TableCell>
                                            <TableCell className="text-xs font-medium">
                                                {d.store?.name || (d.event_type === 'tv.webhook_test' ? 'Teste manual' : d.screen_slug || 'Todas as lojas')}
                                            </TableCell>
                                            <TableCell>
                                                {d.status === 'delivered' ? (
                                                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px] gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Enviado
                                                    </Badge>
                                                ) : d.status === 'skipped_cooldown' ? (
                                                    <Badge
                                                        variant="outline"
                                                        title="Aviso repetido ignorado para evitar excesso de mensagens dentro do intervalo mínimo"
                                                        className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[11px] gap-1"
                                                    >
                                                        <Timer className="h-3 w-3" />
                                                        Aguardando intervalo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-[11px] gap-1">
                                                        <XCircle className="h-3 w-3" />
                                                        Falha no envio
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={note || undefined}>
                                                {d.status === 'delivered'
                                                    ? [latency ? `Respondido em ${latency}` : null, d.http_status ? `Código ${d.http_status}` : null]
                                                          .filter(Boolean)
                                                          .join(' · ')
                                                    : note || (d.http_status ? `Erro código ${d.http_status}` : 'Sem resposta do servidor de destino')}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* 3. Links de Consulta ao Vivo (Integrações — Secundário e Limpo) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="h-5 w-5 text-emerald-500" />
                        Links de Consulta ao Vivo (Integrações)
                    </CardTitle>
                    <CardDescription>
                        Links abertos (não precisam de senha) para consultar a situação atual e o histórico das TVs em outros sistemas ou automações.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {publicLinks.map((ep) => {
                        const isCopied = copiedKey === ep.key;
                        return (
                            <div
                                key={ep.key}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-muted/25"
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <p className="text-sm font-semibold flex items-center gap-1.5">
                                        <Link2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        {ep.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{ep.description}</p>
                                    <code className="text-[11px] font-mono bg-background px-2.5 py-1 rounded-md border block truncate">
                                        {ep.url}
                                    </code>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={isCopied ? 'default' : 'outline'}
                                        className="gap-1.5 text-xs"
                                        onClick={() => copyLink(ep.key, ep.url, ep.label)}
                                    >
                                        {isCopied ? (
                                            <Check className="h-3.5 w-3.5" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                        {isCopied ? 'Copiado!' : 'Copiar link'}
                                    </Button>
                                    {ep.canOpenDirectly && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="gap-1.5 text-xs"
                                            onClick={() => window.open(ep.url, '_blank', 'noopener,noreferrer')}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Abrir
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Dicas de filtros técnicos recolhidas para não poluir a tela do operador */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setShowIntegrationFilters((prev) => !prev)}
                            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition"
                        >
                            {showIntegrationFilters ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            {showIntegrationFilters
                                ? 'Ocultar filtros opcionais para integrações'
                                : 'Ver filtros opcionais para integrações (n8n / TI)'}
                        </button>

                        {showIntegrationFilters && (
                            <div className="mt-2 p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground space-y-1">
                                <p>
                                    • Somente TVs fora do ar: <code className="text-foreground">?status=offline</code>
                                </p>
                                <p>
                                    • Somente lojas abertas agora: <code className="text-foreground">?only_open_stores=1</code>
                                </p>
                                <p>
                                    • Ocultar unidades sem TV conectada: <code className="text-foreground">?only_monitored=1</code>
                                </p>
                                <p>
                                    • Limitar histórico retornado: <code className="text-foreground">?history_limit=30</code> ou no histórico geral <code className="text-foreground">?category=status&amp;limit=50</code>
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modal Criar / Editar Alerta Automático */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BellRing className="h-5 w-5 text-primary" />
                            {editingWebhook ? 'Editar Alerta Automático' : 'Novo Alerta Automático'}
                        </DialogTitle>
                        <DialogDescription>
                            Escolha quando o sistema deve avisar automaticamente e para qual endereço enviar a mensagem.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="alerta-nome">Nome do alerta</Label>
                            <Input
                                id="alerta-nome"
                                placeholder="Ex.: Aviso WhatsApp das TVs"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="alerta-url">Endereço de destino (link da automação)</Label>
                            <Input
                                id="alerta-url"
                                placeholder="https://sua-automacao.com/webhook/tvs"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    if (urlError) setUrlError(null);
                                }}
                            />
                            {urlError && <p className="text-xs text-rose-600">{urlError}</p>}
                        </div>

                        {/* Seleção de eventos simplificada (Principais + Mais opções) */}
                        <div className="space-y-2">
                            <Label>Quando avisar?</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {primaryEventKeys.map((key) => {
                                    const ev = TV_EVENT_META[key];
                                    const Icon = ev.icon;
                                    const active = selectedEvents.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleEvent(key)}
                                            className={`text-left p-3 rounded-xl border transition flex items-start gap-2.5 ${
                                                active
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                                    : 'border-border hover:bg-muted/40'
                                            }`}
                                        >
                                            <div className={`p-1.5 rounded-lg border shrink-0 ${ev.badgeClass}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-foreground">{ev.label}</p>
                                                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                                    {ev.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAdvancedEvents((prev) => !prev)}
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1 pt-1"
                            >
                                {showAdvancedEvents ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                )}
                                {showAdvancedEvents
                                    ? 'Ocultar outros tipos de aviso'
                                    : 'Mostrar outros tipos de aviso (opcional)'}
                            </button>

                            {showAdvancedEvents && (
                                <div className="grid grid-cols-1 gap-1.5 border rounded-xl p-2.5 bg-muted/20">
                                    {optionalEventKeys.map((key) => {
                                        const ev = TV_EVENT_META[key];
                                        const Icon = ev.icon;
                                        const active = selectedEvents.includes(key);
                                        return (
                                            <label
                                                key={key}
                                                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition ${
                                                    active ? 'bg-primary/5' : 'hover:bg-muted/50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={active}
                                                    onChange={() => toggleEvent(key)}
                                                    className="mt-0.5 rounded border-input"
                                                />
                                                <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-foreground">{ev.label}</p>
                                                    <p className="text-[11px] text-muted-foreground">{ev.description}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Horário da loja */}
                        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/25">
                            <div>
                                <Label className="text-sm font-medium">Avisar somente no horário da loja</Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Evita receber avisos à noite quando a loja já fechou e desligou a TV.
                                </p>
                            </div>
                            <Switch checked={onlyBusinessHours} onCheckedChange={setOnlyBusinessHours} />
                        </div>

                        {/* Intervalo mínimo entre avisos (substituindo Cooldown) */}
                        <div className="space-y-2">
                            <div>
                                <Label>Intervalo mínimo entre avisos repetidos</Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Evita várias mensagens seguidas se a internet da loja ficar oscilando.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {INTERVAL_PRESETS.map((preset) => {
                                    const active = !customIntervalOpen && cooldownSeconds === preset.seconds;
                                    return (
                                        <Button
                                            key={preset.seconds}
                                            type="button"
                                            size="sm"
                                            variant={active ? 'default' : 'outline'}
                                            className="h-8 text-xs"
                                            onClick={() => {
                                                setCustomIntervalOpen(false);
                                                setCooldownSeconds(preset.seconds);
                                            }}
                                        >
                                            {preset.label}
                                        </Button>
                                    );
                                })}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={customIntervalOpen ? 'default' : 'outline'}
                                    className="h-8 text-xs"
                                    onClick={() => setCustomIntervalOpen(true)}
                                >
                                    Outro tempo
                                </Button>
                            </div>
                            {customIntervalOpen && (
                                <div className="flex items-center gap-2 pt-1">
                                    <Input
                                        type="number"
                                        min={0}
                                        max={86400}
                                        className="w-32"
                                        value={cooldownSeconds}
                                        onChange={(e) => setCooldownSeconds(Number(e.target.value))}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        segundos ({formatIntervalPt(cooldownSeconds)})
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Lojas monitoradas */}
                        {stores.length > 0 && (
                            <div className="space-y-2">
                                <Label>Quais lojas monitorar?</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={!onlySpecificStores ? 'default' : 'outline'}
                                        className="h-8 text-xs"
                                        onClick={() => {
                                            setOnlySpecificStores(false);
                                            setSelectedStoreIds([]);
                                        }}
                                    >
                                        Todas as lojas
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={onlySpecificStores ? 'default' : 'outline'}
                                        className="h-8 text-xs"
                                        onClick={() => setOnlySpecificStores(true)}
                                    >
                                        Escolher lojas específicas
                                    </Button>
                                </div>

                                {onlySpecificStores && (
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border rounded-xl p-2.5 bg-muted/20">
                                        {stores.map((s) => {
                                            const active = selectedStoreIds.includes(s.id);
                                            return (
                                                <Button
                                                    key={s.id}
                                                    type="button"
                                                    size="sm"
                                                    variant={active ? 'default' : 'outline'}
                                                    className="h-7 text-[11px]"
                                                    onClick={() => toggleStore(s.id)}
                                                >
                                                    {s.name}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            {editingWebhook ? 'Salvar Alterações' : 'Salvar Alerta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <Trash2 className="h-5 w-5" />
                            Remover este alerta?
                        </DialogTitle>
                        <DialogDescription>
                            O alerta <strong>{deleteTarget?.name}</strong> deixará de enviar avisos automáticos. Você poderá criar outro quando quiser.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                            onClick={handleConfirmDelete}
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            Sim, remover
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
