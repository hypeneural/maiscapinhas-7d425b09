import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    AlertCircle,
    Bug,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock3,
    Copy,
    Database,
    FileJson,
    Filter,
    Loader2,
    RefreshCw,
    Search,
} from 'lucide-react';

import { getPdvSyncDebugDetail, getPdvSyncDebugFilters, getPdvSyncDebugList } from '@/services/pdv-sync.service';
import type { PdvSyncDebugFilterStore, PdvSyncDebugFilters, PdvSyncDebugRow } from '@/types/pdv-sync.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DEFAULT_FILTERS: PdvSyncDebugFilters = {
    page: 1,
    per_page: 20,
    sort: 'desc',
};

const STATUS_CLASS: Record<string, string> = {
    processed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    queued: 'bg-slate-100 text-slate-800 border-slate-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    blocked: 'bg-amber-100 text-amber-800 border-amber-200',
};

const STATUS_LABEL: Record<string, string> = {
    processed: 'Processado',
    queued: 'Na fila',
    processing: 'Processando',
    failed: 'Falhou',
    blocked: 'Bloqueado',
};

const EVENT_LABEL: Record<string, string> = {
    sales: 'Vendas',
    turno_closure: 'Fechamento',
    mixed: 'Misto',
};

function formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
}

function formatDuration(milliseconds: number | null | undefined): string {
    if (milliseconds === null || milliseconds === undefined) return '-';
    if (milliseconds < 1000) return `${milliseconds} ms`;
    return `${(milliseconds / 1000).toFixed(2)} s`;
}

function formatBytes(bytes: number | null | undefined): string {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizeFilters(filters: PdvSyncDebugFilters): PdvSyncDebugFilters {
    const normalized: PdvSyncDebugFilters = {};

    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        (normalized as Record<string, unknown>)[key] = value;
    });

    return {
        ...DEFAULT_FILTERS,
        ...normalized,
        page: 1,
    };
}

const PdvDebug: React.FC = () => {
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [formFilters, setFormFilters] = useState<PdvSyncDebugFilters>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<PdvSyncDebugFilters>(DEFAULT_FILTERS);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailSyncId, setDetailSyncId] = useState<number | null>(null);

    const debugFiltersQuery = useQuery({
        queryKey: ['pdv-sync-debug-filters'],
        queryFn: () => getPdvSyncDebugFilters(),
        staleTime: 60_000,
    });

    const debugListQuery = useQuery({
        queryKey: ['pdv-sync-debug-list', appliedFilters],
        queryFn: () => getPdvSyncDebugList(appliedFilters),
        placeholderData: (previousData) => previousData,
    });

    const debugDetailQuery = useQuery({
        queryKey: ['pdv-sync-debug-detail', detailSyncId],
        queryFn: () => getPdvSyncDebugDetail(detailSyncId as number, { include_raw: true, include_decoded: true }),
        enabled: detailOpen && detailSyncId !== null,
    });

    const rows = debugListQuery.data?.data ?? [];
    const pagination = debugListQuery.data?.meta.pagination;
    const filterOptions = debugFiltersQuery.data?.data;
    const storeOptions = useMemo(() => {
        const byPdvId = new Map<number, PdvSyncDebugFilterStore>();

        (filterOptions?.stores ?? []).forEach((store) => {
            const existing = byPdvId.get(store.store_pdv_id);
            if (!existing) {
                byPdvId.set(store.store_pdv_id, store);
                return;
            }

            const existingHasName = Boolean(existing.store_name || existing.store_alias);
            const candidateHasName = Boolean(store.store_name || store.store_alias);
            if (!existingHasName && candidateHasName) {
                byPdvId.set(store.store_pdv_id, store);
            }
        });

        return Array.from(byPdvId.values()).sort((a, b) => {
            const labelA = a.store_name || a.store_alias || `Loja PDV ${a.store_pdv_id}`;
            const labelB = b.store_name || b.store_alias || `Loja PDV ${b.store_pdv_id}`;
            return labelA.localeCompare(labelB, 'pt-BR');
        });
    }, [filterOptions?.stores]);

    const decodedPretty = useMemo(() => {
        const decoded = debugDetailQuery.data?.data.payload.decoded;
        if (decoded === null || decoded === undefined) return null;

        try {
            return JSON.stringify(decoded, null, 2);
        } catch {
            return null;
        }
    }, [debugDetailQuery.data]);

    const updateFormFilter = (key: keyof PdvSyncDebugFilters, value: unknown) => {
        setFormFilters((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const applyFilters = () => {
        setAppliedFilters(normalizeFilters(formFilters));
    };

    const clearFilters = () => {
        setFormFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
    };

    const handlePageChange = (page: number) => {
        setAppliedFilters((previous) => ({
            ...previous,
            page,
        }));
    };

    const openDetail = (row: PdvSyncDebugRow) => {
        setDetailSyncId(row.id);
        setDetailOpen(true);
    };

    const copyText = async (text: string | null | undefined, successMessage: string) => {
        if (!text) {
            toast.error('Nao ha conteudo para copiar.');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            toast.success(successMessage);
        } catch {
            toast.error('Falha ao copiar para area de transferencia.');
        }
    };

    const detailPayload = debugDetailQuery.data?.data.payload;
    const detailSync = debugDetailQuery.data?.data.sync;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Bug className="h-7 w-7 text-primary" />
                        Debug PDV
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Investigue payloads brutos recebidos no webhook do PDV por loja, periodo, request e conteudo JSON.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            debugFiltersQuery.refetch();
                            debugListQuery.refetch();
                            if (detailOpen && detailSyncId) {
                                debugDetailQuery.refetch();
                            }
                        }}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar
                    </Button>
                    <Badge variant="secondary" className="h-9 px-3">
                        {pagination?.total ?? 0} registros
                    </Badge>
                </div>
            </div>

            <Card>
                <CardHeader
                    className="cursor-pointer pb-4"
                    onClick={() => setFiltersOpen((previous) => !previous)}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                Filtros de Busca
                            </CardTitle>
                            <CardDescription>
                                Combine filtros estruturados com busca textual no payload bruto para localizar eventos especificos.
                            </CardDescription>
                        </div>
                        {filtersOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                </CardHeader>

                {filtersOpen && (
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Loja (PDV)</label>
                                <Select
                                    value={formFilters.store_pdv_id ? String(formFilters.store_pdv_id) : 'all'}
                                    onValueChange={(value) => updateFormFilter('store_pdv_id', value === 'all' ? undefined : Number(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {storeOptions.map((store) => (
                                            <SelectItem key={String(store.store_pdv_id)} value={String(store.store_pdv_id)}>
                                                {store.store_name || store.store_alias || `Loja PDV ${store.store_pdv_id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                    value={formFilters.status ?? 'all'}
                                    onValueChange={(value) => updateFormFilter('status', value === 'all' ? undefined : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {(filterOptions?.statuses ?? ['queued', 'processing', 'processed', 'failed', 'blocked']).map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {STATUS_LABEL[status] || status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo de evento</label>
                                <Select
                                    value={formFilters.event_type ?? 'all'}
                                    onValueChange={(value) => updateFormFilter('event_type', value === 'all' ? undefined : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {(filterOptions?.event_types ?? ['sales', 'turno_closure', 'mixed']).map((eventType) => (
                                            <SelectItem key={eventType} value={eventType}>
                                                {EVENT_LABEL[eventType] || eventType}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Com erro</label>
                                <Select
                                    value={
                                        formFilters.has_error === undefined
                                            ? 'all'
                                            : formFilters.has_error
                                                ? 'yes'
                                                : 'no'
                                    }
                                    onValueChange={(value) => {
                                        if (value === 'all') {
                                            updateFormFilter('has_error', undefined);
                                            return;
                                        }
                                        updateFormFilter('has_error', value === 'yes');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="yes">Somente com erro</SelectItem>
                                        <SelectItem value="no">Somente sem erro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data inicial</label>
                                <Input
                                    type="date"
                                    value={formFilters.from ?? ''}
                                    onChange={(event) => updateFormFilter('from', event.target.value || undefined)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data final</label>
                                <Input
                                    type="date"
                                    value={formFilters.to ?? ''}
                                    onChange={(event) => updateFormFilter('to', event.target.value || undefined)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Request ID</label>
                                <Input
                                    placeholder="Ex: 7b30a9a0-02e9-4774-a35b-3599194b8880"
                                    value={formFilters.request_id ?? ''}
                                    onChange={(event) => updateFormFilter('request_id', event.target.value || undefined)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sync ID</label>
                                <Input
                                    placeholder="Busca parcial do sync_id"
                                    value={formFilters.sync_id ?? ''}
                                    onChange={(event) => updateFormFilter('sync_id', event.target.value || undefined)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar dentro do payload bruto</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder='Ex: CBFA4E39-C3DB-45CF-8B9B-A9A6B6574227 ou "LojaId":"..."'
                                        value={formFilters.payload_contains ?? ''}
                                        onChange={(event) => updateFormFilter('payload_contains', event.target.value || undefined)}
                                    />
                                </div>
                                <Select
                                    value={String(formFilters.per_page ?? 20)}
                                    onValueChange={(value) => updateFormFilter('per_page', Number(value))}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">20 por pagina</SelectItem>
                                        <SelectItem value="50">50 por pagina</SelectItem>
                                        <SelectItem value="100">100 por pagina</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={formFilters.sort ?? 'desc'}
                                    onValueChange={(value) => updateFormFilter('sort', value as 'asc' | 'desc')}
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desc">Mais recentes</SelectItem>
                                        <SelectItem value="asc">Mais antigos</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={applyFilters}>
                                    Buscar
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Limpar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Registros de webhook</CardTitle>
                    <CardDescription>
                        Cada linha representa um sync recebido no endpoint <code>/api/v1/pdv/sync</code>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Recebido em</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead>Request / Sync</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payload</TableHead>
                                    <TableHead>Tempo</TableHead>
                                    <TableHead className="text-right">Acao</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {debugListQuery.isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Carregando registros...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Nenhum payload encontrado para os filtros aplicados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <div className="font-medium">{formatDateTime(row.timeline.received_at)}</div>
                                                <div className="text-xs text-muted-foreground">{row.schema_version}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {row.store.name || row.store.alias || `Loja PDV ${row.store.pdv_id}`}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    PDV {row.store.pdv_id} {row.store.guid ? `- ${row.store.guid}` : ''}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-mono text-xs">{row.request_id || '-'}</div>
                                                <div className="text-xs text-muted-foreground">{row.sync_id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-2">
                                                    <Badge variant="outline" className={STATUS_CLASS[row.status] ?? 'bg-slate-100 text-slate-800 border-slate-200'}>
                                                        {STATUS_LABEL[row.status] || row.status}
                                                    </Badge>
                                                    <Badge variant="secondary" className="w-fit">
                                                        {EVENT_LABEL[row.event_type] || row.event_type}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Database className="h-4 w-4 text-muted-foreground" />
                                                    {formatBytes(row.payload.bytes)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {row.payload.compression || 'none'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                                                    {formatDuration(row.timeline.end_to_end_ms)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    fila {formatDuration(row.timeline.queue_delay_ms)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => openDetail(row)}>
                                                    <FileJson className="mr-2 h-4 w-4" />
                                                    Ver JSON
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {pagination && pagination.last_page > 1 && (
                        <div className="mt-4">
                            <Pagination>
                                <PaginationContent>
                                    {pagination.current_page > 1 && (
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    handlePageChange(pagination.current_page - 1);
                                                }}
                                            />
                                        </PaginationItem>
                                    )}

                                    <PaginationItem>
                                        <PaginationLink isActive>
                                            {pagination.current_page}
                                        </PaginationLink>
                                    </PaginationItem>

                                    {pagination.current_page < pagination.last_page && (
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    handlePageChange(pagination.current_page + 1);
                                                }}
                                            />
                                        </PaginationItem>
                                    )}
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open);
                    if (!open) {
                        setDetailSyncId(null);
                    }
                }}
            >
                <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileJson className="h-5 w-5 text-primary" />
                            Payload bruto do webhook
                        </DialogTitle>
                        <DialogDescription>
                            Visualize o JSON completo recebido no sync selecionado, com metadados de processamento e copia direta.
                        </DialogDescription>
                    </DialogHeader>

                    {debugDetailQuery.isLoading ? (
                        <div className="py-20 flex items-center justify-center text-muted-foreground gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Carregando payload...
                        </div>
                    ) : !detailPayload || !detailSync ? (
                        <div className="py-10 text-center text-muted-foreground">
                            Nao foi possivel carregar o payload selecionado.
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                <Card>
                                    <CardContent className="pt-4">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Recebido em</p>
                                        <p className="font-semibold">{formatDateTime(detailSync.timeline.received_at)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Processado em</p>
                                        <p className="font-semibold">{formatDateTime(detailSync.timeline.processed_at)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Duracao total</p>
                                        <p className="font-semibold">{formatDuration(detailSync.timeline.end_to_end_ms)}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Tamanho payload</p>
                                        <p className="font-semibold">{formatBytes(detailPayload.bytes)}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="rounded-md border p-3 bg-muted/20">
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <Badge variant="outline">{STATUS_LABEL[detailSync.status] || detailSync.status}</Badge>
                                    <Badge variant="secondary">{EVENT_LABEL[detailSync.event_type] || detailSync.event_type}</Badge>
                                    <span className="text-muted-foreground">
                                        Loja: {detailSync.store.name || detailSync.store.alias || `PDV ${detailSync.store.pdv_id}`}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 font-mono break-all">
                                    request_id: {detailSync.request_id || '-'} | sync_id: {detailSync.sync_id}
                                </div>
                            </div>

                            {detailPayload.parse_error && (
                                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 text-sm flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    O payload nao pode ser decodificado como JSON valido: {detailPayload.parse_error}
                                </div>
                            )}

                            {!detailPayload.available && (
                                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-900 text-sm flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    Payload bruto nao esta mais disponivel (pode ter sido removido por politica de retencao).
                                </div>
                            )}

                            <Tabs defaultValue="decoded" className="flex-1 min-h-0 flex flex-col">
                                <div className="flex items-center justify-between gap-3">
                                    <TabsList>
                                        <TabsTrigger value="decoded">JSON decodificado</TabsTrigger>
                                        <TabsTrigger value="raw">Payload bruto</TabsTrigger>
                                    </TabsList>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyText(decodedPretty, 'JSON decodificado copiado.')}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Copiar JSON
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyText(detailPayload.raw, 'Payload bruto copiado.')}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copiar bruto
                                        </Button>
                                    </div>
                                </div>

                                <TabsContent value="decoded" className="flex-1 min-h-0 mt-3">
                                    <ScrollArea className="h-[48vh] rounded-md border bg-muted/20 p-4">
                                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                            {decodedPretty || 'Sem JSON decodificado para este payload.'}
                                        </pre>
                                    </ScrollArea>
                                </TabsContent>

                                <TabsContent value="raw" className="flex-1 min-h-0 mt-3">
                                    <ScrollArea className="h-[48vh] rounded-md border bg-muted/20 p-4">
                                        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                            {detailPayload.raw || 'Sem payload bruto disponivel.'}
                                        </pre>
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PdvDebug;
