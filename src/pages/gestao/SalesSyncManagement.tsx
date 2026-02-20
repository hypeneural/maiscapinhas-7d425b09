import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPdvSyncs, getPdvMetrics } from '@/services/pdv-sync.service';
import type { PdvSyncFilters } from '@/types/pdv-sync.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Database,
    FileJson,
    Filter,
    RefreshCw,
    Search,
    ServerCrash,
    ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const SalesSyncManagement: React.FC = () => {
    const [filters, setFilters] = useState<PdvSyncFilters>({
        page: 1,
        per_page: 20,
    });

    // Fetch Metrics
    const { data: metricsData, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useQuery({
        queryKey: ['pdv-metrics'],
        queryFn: () => getPdvMetrics(30), // 30 min threshold for "stale"
        refetchInterval: 60000, // Auto-refresh every minute
    });

    // Fetch Sync List
    const { data: syncsData, isLoading: isLoadingSyncs, refetch: refetchSyncs } = useQuery({
        queryKey: ['pdv-syncs', filters],
        queryFn: () => getPdvSyncs(filters),
        placeholderData: (previousData) => previousData,
    });

    const metrics = metricsData?.data;
    const syncs = syncsData?.data;
    const meta = syncsData?.meta;

    const handleFilterChange = (key: keyof PdvSyncFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'processed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'blocked': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const formatDuration = (ms: number | null) => {
        if (ms === null) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Monitoramento PDV</h1>
                    <p className="text-muted-foreground mt-1">
                        Saúde da sincronização, alertas de atraso e logs de ingestão.
                    </p>
                </div>
                <Button variant="outline" onClick={() => { refetchMetrics(); refetchSyncs(); }}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                </Button>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics?.stores.active_mapped_stores || 0}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({metrics?.stores.stale_count || 0} atrasadas)
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Lojas enviando dados nos últimos 30min
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Volume 24h</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.last_24h.total || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-green-600">
                            {(100 - (metrics?.last_24h.failure_rate_percent || 0)).toFixed(1)}% de sucesso
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics?.latency.avg_processing_ms || 0}ms
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tempo médio de processamento
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Erros de Banco</CardTitle>
                        <ServerCrash className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {metrics?.risk_flags.gestao_db_failure || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Falhas conexão Hiper Gestão (24h)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="list">Lista de Sincronizações</TabsTrigger>
                    <TabsTrigger value="stale">Lojas Atrasadas ({metrics?.stores.stale_count || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={filters.status || "all"}
                                        onValueChange={(val) => handleFilterChange("status", val === "all" ? undefined : val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="processed">Processado</SelectItem>
                                            <SelectItem value="queued">Na Fila</SelectItem>
                                            <SelectItem value="failed">Falha</SelectItem>
                                            <SelectItem value="blocked">Bloqueado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">ID da Loja (PDV)</label>
                                    <Input
                                        placeholder="Ex: 13"
                                        type="number"
                                        value={filters.store_pdv_id || ''}
                                        onChange={(e) => handleFilterChange("store_pdv_id", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sync ID (Busca)</label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Busca por ID..."
                                            className="pl-8"
                                            value={filters.sync_id || ''}
                                            onChange={(e) => handleFilterChange("sync_id", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Risco (Flag)</label>
                                    <Select
                                        value={filters.risk_flag || "all"}
                                        onValueChange={(val) => handleFilterChange("risk_flag", val === "all" ? undefined : val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="gestao_db_failure">Erro Banco Gestão</SelectItem>
                                            <SelectItem value="vendedor_null">Vendedor Null</SelectItem>
                                            <SelectItem value="timestamp_out_of_window">Timestamp Inválido</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Recebido em</TableHead>
                                    <TableHead>Latência</TableHead>
                                    <TableHead>Riscos / Flags</TableHead>
                                    <TableHead className="text-right">Versão</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingSyncs ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            Carregando...
                                        </TableCell>
                                    </TableRow>
                                ) : syncs?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Nenhum registro encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    syncs?.map((sync) => (
                                        <TableRow key={sync.id}>
                                            <TableCell>
                                                <Badge variant="secondary" className={getStatusColor(sync.status)}>
                                                    {sync.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">Loja {sync.store_pdv_id}</div>
                                                <div className="text-xs text-muted-foreground">{sync.sync_id.substring(0, 8)}...</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{sync.event_type}</Badge>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {sync.ops_count} ops
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {format(new Date(sync.received_at), "dd/MM HH:mm:ss")}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {sync.queue_delay_ms}ms fila
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatDuration(sync.processing_ms)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {sync.risk_flags.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {sync.risk_flags.slice(0, 2).map(flag => (
                                                            <Badge key={flag} variant="destructive" className="text-[10px] px-1 py-0 h-5">
                                                                {flag.replace(/_/g, ' ')}
                                                            </Badge>
                                                        ))}
                                                        {sync.risk_flags.length > 2 && (
                                                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                                                +{sync.risk_flags.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-green-600 text-xs">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        OK
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground font-mono text-xs">
                                                v{sync.schema_version}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {meta && meta.pagination.last_page > 1 && (
                        <Pagination>
                            <PaginationContent>
                                {meta.pagination.current_page > 1 && (
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); handlePageChange(meta.pagination.current_page - 1); }}
                                        />
                                    </PaginationItem>
                                )}

                                <PaginationItem>
                                    <PaginationLink isActive>{meta.pagination.current_page}</PaginationLink>
                                </PaginationItem>

                                {meta.pagination.current_page < meta.pagination.last_page && (
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); handlePageChange(meta.pagination.current_page + 1); }}
                                        />
                                    </PaginationItem>
                                )}
                            </PaginationContent>
                        </Pagination>
                    )}
                </TabsContent>

                <TabsContent value="stale">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lojas Atrasadas (Stale)</CardTitle>
                            <CardDescription>
                                Lojas que não enviaram sincronização nos últimos 30 minutos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Loja</TableHead>
                                        <TableHead>Alias</TableHead>
                                        <TableHead>Último Envio</TableHead>
                                        <TableHead>Tempo Ausente</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {metrics?.stores.stale.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-green-600">
                                                <div className="flex flex-col items-center justify-center">
                                                    <CheckCircle2 className="h-8 w-8 mb-2" />
                                                    Todas as lojas estão sincronizando normalmente.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        metrics?.stores.stale.map((store) => (
                                            <TableRow key={store.store_pdv_id}>
                                                <TableCell className="font-medium">
                                                    {store.store_name || `PDV ${store.store_pdv_id}`}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {store.alias || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {store.last_received_at
                                                        ? format(new Date(store.last_received_at), "dd/MM/yyyy HH:mm")
                                                        : "Nunca"}
                                                </TableCell>
                                                <TableCell className="text-red-600 font-bold">
                                                    {store.minutes_since_last_sync
                                                        ? `${Math.floor(store.minutes_since_last_sync / 60)}h ${store.minutes_since_last_sync % 60}m`
                                                        : "Indefinido"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="destructive" className="flex items-center w-fit">
                                                        <AlertTriangle className="mr-1 h-3 w-3" />
                                                        Offline
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SalesSyncManagement;
