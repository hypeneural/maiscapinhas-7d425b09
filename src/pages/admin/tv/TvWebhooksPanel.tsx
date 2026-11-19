/**
 * TV Signage — Public Pull Endpoints & Outbound Push Webhooks Management Panel
 */

import { useState } from 'react';
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
    Webhook,
    Plus,
    Copy,
    ExternalLink,
    Send,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    Globe,
    Loader2,
    Activity,
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

const DEFAULT_EVENTS = ['tv.went_offline', 'tv.came_online'];

export function TvWebhooksPanel({ stores }: TvWebhooksPanelProps) {
    const { data: webhooksRes, isLoading: webhooksLoading } = useTvWebhooks();
    const { data: deliveriesRes, isLoading: deliveriesLoading } = useTvWebhookDeliveries({ per_page: 25 });

    const createMutation = useCreateTvWebhook();
    const updateMutation = useUpdateTvWebhook();
    const deleteMutation = useDeleteTvWebhook();
    const testMutation = useTestTvWebhook();

    const webhooks = webhooksRes?.data || [];
    const meta = webhooksRes?.meta;
    const deliveries = deliveriesRes?.data || [];
    const supportedEvents = meta?.supported_events || {
        'tv.went_offline': 'TV ficou offline',
        'tv.came_online': 'TV voltou online',
        'tv.became_degraded': 'TV entrou em estado instável/degradado',
        'tv.recovered_healthy': 'TV recuperou estabilidade',
        'tv.standby_enabled': 'TV colocada em Standby (Blackout)',
        'tv.standby_disabled': 'TV religada (saiu de Standby)',
        'tv.player_error_spike': 'Pico de erros de reprodução de mídia',
        'tv.device_changed': 'Alteração de dispositivo ou resolução detectada',
        'tv.playlist_updated': 'Grade de anúncios ou design atualizado',
    };

    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>(DEFAULT_EVENTS);
    const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
    const [onlyBusinessHours, setOnlyBusinessHours] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(60);
    const [testingId, setTestingId] = useState<number | null>(null);

    const copyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado!`);
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

    const handleCreate = async () => {
        if (!name.trim() || !url.trim()) {
            toast.error('Informe nome e URL de destino do webhook.');
            return;
        }
        if (selectedEvents.length === 0) {
            toast.error('Selecione pelo menos um evento.');
            return;
        }

        await createMutation.mutateAsync({
            name: name.trim(),
            url: url.trim(),
            events: selectedEvents,
            store_ids: selectedStoreIds.length > 0 ? selectedStoreIds : null,
            only_during_business_hours: onlyBusinessHours,
            cooldown_seconds: Math.max(0, Number(cooldownSeconds) || 0),
        });

        setName('');
        setUrl('');
        setSelectedEvents(DEFAULT_EVENTS);
        setSelectedStoreIds([]);
        setOnlyBusinessHours(false);
        setCooldownSeconds(60);
        setModalOpen(false);
    };

    const handleToggleActive = (webhook: TvWebhookItem) => {
        updateMutation.mutate({
            id: webhook.id,
            payload: { is_active: !webhook.is_active },
        });
    };

    const handleTest = async (id: number) => {
        setTestingId(id);
        try {
            await testMutation.mutateAsync(id);
        } finally {
            setTestingId(null);
        }
    };

    const originBase = typeof window !== 'undefined' ? window.location.origin : '';
    const publicEndpoints = [
        {
            label: 'Status Geral de Todas as TVs + Últimas Atualizações',
            url: meta?.public_endpoints?.fleet_status || `${originBase}/api/v1/tv/status`,
            hint: 'Aceita ?status=offline, ?only_monitored=1, ?only_open_stores=1, ?history_limit=30',
        },
        {
            label: 'Status Detalhado de 1 TV + Sessões + Histórico',
            url: meta?.public_endpoints?.screen_status_template || `${originBase}/api/v1/tv/status/{slug}`,
            hint: 'Substitua {slug} pelo slug ou store_id da loja (ex.: loja-loja-1-mc-komprao-centro-tj)',
        },
        {
            label: 'Histórico Unificado de Atualizações & Quedas',
            url: meta?.public_endpoints?.history_feed || `${originBase}/api/v1/tv/history`,
            hint: 'Aceita ?category=status|content|commands|errors, ?slug=..., ?limit=50',
        },
    ];

    return (
        <div className="space-y-5">
            {/* 1. Endpoints Públicos (Pull) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="h-5 w-5 text-emerald-500" />
                        Endpoints Públicos de Monitoramento (Pull — Sem Autenticação)
                    </CardTitle>
                    <CardDescription>
                        Consulte via HTTP GET (n8n, Make, bot WhatsApp, Uptime Kuma ou painel externo) o status atual,
                        resolução real, expediente da loja e histórico das últimas atualizações das TVs.
                        {meta?.thresholds && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                                • Ping: {meta.thresholds.heartbeat_interval_seconds}s | Online ≤ {meta.thresholds.online_threshold_seconds}s | Offline &gt; {meta.thresholds.offline_threshold_seconds}s
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {publicEndpoints.map((ep) => (
                        <div
                            key={ep.label}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30"
                        >
                            <div className="space-y-1 min-w-0">
                                <p className="text-sm font-medium">{ep.label}</p>
                                <code className="text-xs font-mono bg-background px-2 py-1 rounded border block truncate">
                                    GET {ep.url}
                                </code>
                                <p className="text-[11px] text-muted-foreground">{ep.hint}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs"
                                    onClick={() => copyText(ep.url, ep.label)}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copiar
                                </Button>
                                {!ep.url.includes('{slug}') && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="gap-1.5 text-xs"
                                        onClick={() => window.open(ep.url, '_blank', 'noopener,noreferrer')}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Abrir JSON
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* 2. Webhooks de Saída (Push) */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Webhook className="h-5 w-5 text-primary" />
                            Webhooks Automáticos de Alerta (Push — Offline / Online)
                        </CardTitle>
                        <CardDescription>
                            Dispara HTTP POST JSON automaticamente quando qualquer TV fica offline (&gt; 3 min sem sinal) ou volta online,
                            com texto pronto para WhatsApp, duração da queda e indicação de expediente comercial.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Novo Webhook
                    </Button>
                </CardHeader>
                <CardContent>
                    {meta?.default_env_webhook_configured && (
                        <div className="mb-3 p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300">
                            Variável global <code>TV_WEBHOOK_URL</code> ativa no servidor (.env) para eventos padrão (<code>tv.went_offline</code>, <code>tv.came_online</code>).
                        </div>
                    )}

                    {webhooksLoading ? (
                        <div className="space-y-2">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-14 bg-muted animate-pulse rounded" />
                            ))}
                        </div>
                    ) : webhooks.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                            <Webhook className="mx-auto h-10 w-10 opacity-30 mb-2" />
                            <p className="text-sm font-medium">Nenhum webhook cadastrado ainda</p>
                            <p className="text-xs mt-1 mb-3">
                                Cadastre uma URL do n8n, Make ou bot WhatsApp para receber alertas instantâneos de queda e retorno das TVs.
                            </p>
                            <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Cadastrar Primeiro Webhook
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Webhook</TableHead>
                                    <TableHead>Eventos & Regras</TableHead>
                                    <TableHead>Último Disparo</TableHead>
                                    <TableHead>Ativo</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {webhooks.map((wh) => (
                                    <TableRow key={wh.id}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{wh.name}</div>
                                            <code className="text-[11px] text-muted-foreground break-all">{wh.url}</code>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 mb-1">
                                                {(wh.events || []).map((ev) => (
                                                    <Badge key={ev} variant="secondary" className="text-[10px]">
                                                        {ev}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2">
                                                <span>Cooldown: {wh.cooldown_seconds}s</span>
                                                <span>•</span>
                                                <span>
                                                    {wh.only_during_business_hours ? 'Somente horário comercial' : '24h (com flag de expediente)'}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {wh.store_ids && wh.store_ids.length > 0
                                                        ? `${wh.store_ids.length} loja(s)`
                                                        : 'Todas as lojas'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {wh.last_triggered_at ? (
                                                <div className="space-y-0.5">
                                                    <div>
                                                        {wh.last_status_code ? (
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    wh.last_status_code >= 200 && wh.last_status_code < 300
                                                                        ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]'
                                                                        : 'text-rose-600 border-rose-500/30 bg-rose-500/10 text-[10px]'
                                                                }
                                                            >
                                                                HTTP {wh.last_status_code}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px]">
                                                                Erro
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {new Date(wh.last_triggered_at).toLocaleString('pt-BR')}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Nunca disparado</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={wh.is_active}
                                                onCheckedChange={() => handleToggleActive(wh)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 text-xs"
                                                    disabled={testingId === wh.id}
                                                    onClick={() => handleTest(wh.id)}
                                                >
                                                    {testingId === wh.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Send className="h-3.5 w-3.5" />
                                                    )}
                                                    Testar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-rose-500 hover:text-rose-600"
                                                    onClick={() => deleteMutation.mutate(wh.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* 3. Histórico de Entregas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Histórico de Disparos de Webhook
                    </CardTitle>
                    <CardDescription>
                        Auditoria em tempo real das últimas entregas HTTP realizadas pelo monitor de TVs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {deliveriesLoading ? (
                        <div className="h-24 bg-muted animate-pulse rounded" />
                    ) : deliveries.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                            Nenhuma entrega de webhook registrada ainda.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Loja / TV</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Resposta / Latência</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deliveries.map((d) => (
                                    <TableRow key={d.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(d.dispatched_at).toLocaleString('pt-BR')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] font-mono">
                                                {d.event_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {d.store?.name || d.screen_slug || 'Global / Teste'}
                                        </TableCell>
                                        <TableCell>
                                            {d.status === 'delivered' ? (
                                                <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Entregue ({d.http_status})
                                                </Badge>
                                            ) : d.status === 'skipped_cooldown' ? (
                                                <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[10px] gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Cooldown
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-[10px] gap-1">
                                                    <XCircle className="h-3 w-3" />
                                                    Falha {d.http_status ? `(${d.http_status})` : ''}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                                            {d.duration_ms != null ? `${d.duration_ms}ms` : ''}
                                            {d.error_message ? ` • ${d.error_message}` : ''}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal Novo Webhook */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Webhook className="h-5 w-5 text-primary" />
                            Cadastrar Webhook de Monitoramento TV
                        </DialogTitle>
                        <DialogDescription>
                            O ERP enviará um POST JSON direto (sem necessidade de assinatura) sempre que os eventos selecionados ocorrerem.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="wh-name">Nome identificador</Label>
                            <Input
                                id="wh-name"
                                placeholder="Ex.: n8n Alerta WhatsApp TVs"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="wh-url">URL de destino (HTTP POST)</Label>
                            <Input
                                id="wh-url"
                                placeholder="https://n8n.suaempresa.com/webhook/tv-status"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Eventos assinados</Label>
                            <div className="grid grid-cols-1 gap-1.5 border rounded-lg p-3 max-h-48 overflow-y-auto">
                                {Object.entries(supportedEvents)
                                    .filter(([key]) => key !== 'tv.webhook_test')
                                    .map(([key, label]) => (
                                        <label key={key} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                                            <input
                                                type="checkbox"
                                                checked={selectedEvents.includes(key)}
                                                onChange={() => toggleEvent(key)}
                                                className="rounded border-input"
                                            />
                                            <code className="font-mono text-[11px] text-primary">{key}</code>
                                            <span className="text-muted-foreground">— {label}</span>
                                        </label>
                                    ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                            <div>
                                <Label className="text-sm">Somente durante horário comercial</Label>
                                <p className="text-xs text-muted-foreground">
                                    Usa o cadastro de horário de funcionamento de cada loja para evitar alertas à noite.
                                </p>
                            </div>
                            <Switch checked={onlyBusinessHours} onCheckedChange={setOnlyBusinessHours} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="wh-cooldown">Cooldown anti-flapping (segundos)</Label>
                            <Input
                                id="wh-cooldown"
                                type="number"
                                min={0}
                                max={86400}
                                value={cooldownSeconds}
                                onChange={(e) => setCooldownSeconds(Number(e.target.value))}
                            />
                        </div>

                        {stores.length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Filtrar lojas (opcional — vazio = todas)</Label>
                                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto border rounded-lg p-2">
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
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            Salvar Webhook
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
