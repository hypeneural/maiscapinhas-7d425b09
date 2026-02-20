/**
 * Closure Validation Page
 *
 * Validates ERP cash closure (turno) data against the local database.
 * Shows summary stats, filterable results table, and detailed comparison modals.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    Search,
    Loader2,
    Database,
    RefreshCw,
    Ban,
    Clock,
    Filter,
    User,
    CreditCard,
    DollarSign,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Wallet,
    TrendingDown,
    TrendingUp,
    ShieldCheck,
    Store,
    Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/PageHeader';
import { validateClosureBatch, compareClosureDetail } from '@/services/sales.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { hiperErpService } from '@/services/admin/hiper-erp.service';
import type { HiperConnection } from '@/types/hiper-erp.types';
import type {
    ClosureValidateResponse,
    ClosureResultItem,
    ClosureValidation as ClosureValidationType,
    TurnoDB,
    PagamentosGrouped,
    PagamentoItem,
    ClosureComparison,
    LocalUnified,
    DiffPorMeio,
    CompareDetailResponse,
    ComparePaymentMethodItem,
} from '@/types/closure-validation.types';
import { ValidationNav } from './ValidationNav';

// ── Helpers ──

function formatBRL(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDuration(minutes: number | null | undefined): string {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function getConfidenceBadge(validation: ClosureValidationType) {
    if (!validation.found) {
        if (validation.status_erp === 'CANCELLED') {
            return {
                text: '🚫 Cancelada',
                bg: 'bg-gray-100 dark:bg-gray-800/50',
                border: 'border-gray-300 dark:border-gray-600',
                color: 'text-gray-600 dark:text-gray-400',
                dot: 'bg-gray-400',
            };
        }
        return {
            text: '❌ Não encontrado',
            bg: 'bg-red-50 dark:bg-red-950/30',
            border: 'border-red-200 dark:border-red-800',
            color: 'text-red-700 dark:text-red-400',
            dot: 'bg-red-500',
        };
    }
    const conf = validation.match_confidence;
    const label = validation.unified ? `🔗 ${validation.match_type}` : validation.match_type;
    if (conf >= 90) {
        return {
            text: `✅ ${label} (${conf}%)`,
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            border: 'border-emerald-200 dark:border-emerald-800',
            color: 'text-emerald-700 dark:text-emerald-400',
            dot: 'bg-emerald-500',
        };
    }
    if (conf >= 75) {
        return {
            text: `⚠️ ${label} (${conf}%)`,
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            border: 'border-amber-200 dark:border-amber-800',
            color: 'text-amber-700 dark:text-amber-400',
            dot: 'bg-amber-500',
        };
    }
    return {
        text: `❓ ${label} (${conf}%)`,
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        color: 'text-red-700 dark:text-red-400',
        dot: 'bg-red-500',
    };
}

/** Get falta value from either turno_db or local_unified */
function getFalta(v: ClosureValidationType): number {
    if (v.unified && v.local_unified) return v.local_unified.totais?.falta ?? 0;
    return v.turno_db?.total_falta ?? 0;
}

/** Get sobra value from either turno_db or local_unified */
function getSobra(v: ClosureValidationType): number {
    if (v.unified && v.local_unified) return v.local_unified.totais?.sobra ?? 0;
    return v.turno_db?.total_sobra ?? 0;
}

// ── Main Component ──

const ClosureValidation: React.FC = () => {
    const { isSuperAdmin } = useAuth();

    // --- State ---
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ClosureValidateResponse | null>(null);
    const [connections, setConnections] = useState<HiperConnection[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(false);
    const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);

    // Filters
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'found' | 'not_found' | 'falta'>('all');

    // Detail modal
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<ClosureResultItem | null>(null);

    // Compare detail (ERP × Local detalhe)
    const [compareData, setCompareData] = useState<CompareDetailResponse | null>(null);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState<string | null>(null);

    // Fetch connections on mount
    useEffect(() => {
        if (isSuperAdmin && connections.length === 0) {
            const fetchConns = async () => {
                setLoadingConnections(true);
                try {
                    const res = await hiperErpService.listConnections();
                    setConnections(res.connections ?? []);
                    if (res.connections?.length > 0) {
                        setSelectedConnectionId(res.connections[0].id);
                    }
                } catch (err: any) {
                    toast.error(err?.message || 'Erro ao carregar conexões.');
                } finally {
                    setLoadingConnections(false);
                }
            };
            fetchConns();
        }
    }, [isSuperAdmin]);

    // Filtered results
    const filteredResults = useMemo(() => {
        if (!result) return [];
        let items = result.results;
        if (searchText.trim()) {
            const q = searchText.toLowerCase();
            items = items.filter(item => {
                const s = item.closure_summary;
                return (
                    (s?.codigo?.toString() || '').includes(q) ||
                    (s?.loja_nome || '').toLowerCase().includes(q) ||
                    (s?.data || '').toLowerCase().includes(q) ||
                    (s?.turno || '').toLowerCase().includes(q) ||
                    (s?.erp_id || '').toLowerCase().includes(q)
                );
            });
        }
        if (statusFilter !== 'all') {
            items = items.filter(item => {
                if (statusFilter === 'found') return item.validation.found;
                if (statusFilter === 'not_found') return !item.validation.found;
                if (statusFilter === 'falta') return item.validation.found && getFalta(item.validation) > 0;
                return true;
            });
        }
        return items;
    }, [result, searchText, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        if (!result) return null;
        const total = result.results.length;
        const found = result.results.filter(r => r.validation.found).length;
        const notFound = result.results.filter(r => !r.validation.found).length;
        const withFalta = result.results.filter(r => r.validation.found && getFalta(r.validation) > 0).length;
        return { total, found, notFound, withFalta, rate: total > 0 ? Math.round((found / total) * 100) : 0 };
    }, [result]);

    // ── Actions ──

    const handleValidate = async () => {
        setIsLoading(true);
        setSearchText('');
        setStatusFilter('all');
        try {
            const payload: any = {
                source: 'erp',
                limit: 100,
            };
            if (selectedConnectionId) payload.connection_id = selectedConnectionId;
            const res = await validateClosureBatch(payload);
            setResult(res);
            toast.success(`${res.batch_count} fechamentos validados.`);
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao validar fechamentos.');
        } finally {
            setIsLoading(false);
        }
    };

    const openDetail = (item: ClosureResultItem) => {
        setDetailItem(item);
        setDetailOpen(true);
        // Reset compare data when opening a new detail
        setCompareData(null);
        setCompareError(null);
    };

    const handleCompareDetail = async (item: ClosureResultItem) => {
        const turnoId = item.closure_summary?.turno_id || item.closure_summary?.erp_id;
        const closureUuid = item.validation.local_unified?.closure_uuid
            || item.validation.turno_db?.closure_uuid
            || item.validation.comparison?.closure_uuid?.db;

        if (!turnoId || !closureUuid) {
            setCompareError('IDs insuficientes para comparação (turno_id ou closure_uuid não encontrado).');
            return;
        }

        setCompareLoading(true);
        setCompareError(null);
        try {
            const res = await compareClosureDetail({
                turno_id: turnoId,
                closure_uuid: closureUuid,
                ...(selectedConnectionId ? { connection_id: selectedConnectionId } : {}),
            });
            setCompareData(res);
        } catch (err: any) {
            setCompareError(err?.message || 'Erro ao buscar comparação detalhada.');
            toast.error('Erro ao buscar comparação detalhada do ERP.');
        } finally {
            setCompareLoading(false);
        }
    };

    // ── Render ──

    return (
        <div className="space-y-6">
            <PageHeader
                title="Validação de Fechamento de Caixa"
                description="Compare os fechamentos de caixa do ERP com os dados locais"
            />

            <ValidationNav />

            {/* Form */}
            <Card className="border-dashed">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Database className="h-3.5 w-3.5" />
                                Conexão ERP
                            </Label>
                            <Select
                                value={selectedConnectionId?.toString() ?? ''}
                                onValueChange={(v) => setSelectedConnectionId(Number(v))}
                                disabled={loadingConnections}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder={loadingConnections ? 'Carregando...' : 'Selecione a conexão'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {connections.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name || `Conexão #${c.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleValidate}
                            disabled={isLoading || !selectedConnectionId}
                            className="gap-2 min-w-[180px]"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            {isLoading ? 'Validando...' : 'Buscar e Validar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {result && stats && (
                <div className="space-y-4">
                    {/* Summary Stats */}
                    <Card className="overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-500/10 via-blue-500/5 to-emerald-500/10 p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                <div>
                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                        <Wallet className="h-4.5 w-4.5 text-violet-500" />
                                        Resumo da Validação
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {stats.total} fechamentos processados
                                        {result.erp_total_returned ? ` (${result.erp_total_returned} retornados pelo ERP, ${result.closures_filtered} filtrados)` : ''}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-xs font-mono">
                                    {stats.rate}% match
                                </Badge>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden mb-4">
                                <div className="h-full flex">
                                    <div
                                        className="bg-emerald-500 transition-all duration-700"
                                        style={{ width: `${stats.total > 0 ? (stats.found / stats.total) * 100 : 0}%` }}
                                    />
                                    <div
                                        className="bg-red-400 transition-all duration-700"
                                        style={{ width: `${stats.total > 0 ? (stats.notFound / stats.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stat cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="rounded-lg border bg-background/80 backdrop-blur p-3 text-center">
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">Processados</p>
                                </div>
                                <div className="rounded-lg border bg-background/80 backdrop-blur p-3 text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{stats.found}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">✅ Encontrados</p>
                                </div>
                                <div className="rounded-lg border bg-background/80 backdrop-blur p-3 text-center">
                                    <p className="text-2xl font-bold text-red-500">{stats.notFound}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">❌ Não Encontrados</p>
                                </div>
                                <div className="rounded-lg border bg-background/80 backdrop-blur p-3 text-center">
                                    <p className={cn("text-2xl font-bold", stats.withFalta > 0 ? "text-red-600" : "text-muted-foreground")}>{stats.withFalta}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">🔴 Com Falta</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por código, loja, turno..."
                                className="pl-9 h-9 text-sm"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {[
                                { key: 'all' as const, label: 'Todos', count: result.results.length },
                                { key: 'found' as const, label: 'Encontrados', count: stats.found },
                                { key: 'not_found' as const, label: 'Não encontrados', count: stats.notFound },
                                { key: 'falta' as const, label: 'Com Falta', count: stats.withFalta },
                            ].map(f => (
                                <Button
                                    key={f.key}
                                    variant={statusFilter === f.key ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        "h-8 text-xs gap-1.5 transition-all",
                                        statusFilter === f.key && f.key === 'found' && 'bg-emerald-600 hover:bg-emerald-700',
                                        statusFilter === f.key && f.key === 'not_found' && 'bg-red-500 hover:bg-red-600',
                                        statusFilter === f.key && f.key === 'falta' && 'bg-orange-500 hover:bg-orange-600',
                                    )}
                                    onClick={() => setStatusFilter(f.key)}
                                >
                                    {f.label}
                                    <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] bg-white/20 text-inherit">
                                        {f.count}
                                    </Badge>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 text-xs text-muted-foreground">
                                        <th className="text-left px-3 py-2.5 font-medium">Cod.</th>
                                        <th className="text-left px-3 py-2.5 font-medium">Loja</th>
                                        <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Turno</th>
                                        <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Data / Hora</th>
                                        <th className="text-right px-3 py-2.5 font-medium">Valor</th>
                                        <th className="text-center px-3 py-2.5 font-medium hidden sm:table-cell">Operador</th>
                                        <th className="text-center px-3 py-2.5 font-medium">Confiança</th>
                                        <th className="text-center px-3 py-2.5 font-medium hidden sm:table-cell">Caixa</th>
                                        <th className="text-center px-3 py-2.5 font-medium">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="text-center py-8 text-muted-foreground">
                                                <Filter className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">Nenhum resultado encontrado com os filtros atuais.</p>
                                            </td>
                                        </tr>
                                    )}
                                    {filteredResults.map((item, index) => {
                                        const cs = item.closure_summary;
                                        const v = item.validation;
                                        const badge = getConfidenceBadge(v);
                                        const turno = v.turno_db;
                                        const uni = v.local_unified;
                                        const hasFalta = v.found && getFalta(v) > 0;
                                        const hasSobra = v.found && getSobra(v) > 0;

                                        return (
                                            <tr
                                                key={item.input_id || index}
                                                className={cn(
                                                    "border-b last:border-0 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm cursor-pointer",
                                                    cs?.cancelada && "bg-gray-50/50 dark:bg-gray-950/10 opacity-60",
                                                    !v.found && "bg-muted/10 opacity-60",
                                                    hasFalta && "bg-red-50/30 dark:bg-red-950/10"
                                                )}
                                                onClick={() => openDetail(item)}
                                            >
                                                {/* Cod. */}
                                                <td className="px-3 py-2.5 font-mono text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        {v.found ? (
                                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                                        )}
                                                        {cs?.codigo ? (
                                                            <span className="font-semibold">{cs.codigo}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground truncate max-w-[80px]" title={item.input_id}>
                                                                {item.input_id.substring(0, 8)}…
                                                            </span>
                                                        )}
                                                        {cs?.cancelada && (
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-900/30">
                                                                <Ban className="h-2 w-2" />
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Loja */}
                                                <td className="px-3 py-2.5 text-xs max-w-[180px]">
                                                    {cs?.loja_nome ? (
                                                        <span className={cn("truncate block", !cs.found_in_db && "text-amber-600 dark:text-amber-400")}>
                                                            {cs.loja_nome}
                                                        </span>
                                                    ) : cs?.loja_erp_id ? (
                                                        <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400" title={cs.loja_erp_id}>
                                                            {cs.loja_erp_id.substring(0, 8)}…
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                {/* Turno */}
                                                <td className="px-3 py-2.5 text-xs hidden sm:table-cell">
                                                    {cs?.turno ? (
                                                        <span className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 text-[10px] font-medium">
                                                            {cs.turno}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                {/* Data/Hora */}
                                                <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                                                    {cs?.data || '—'}
                                                </td>
                                                {/* Valor */}
                                                <td className="px-3 py-2.5 text-right font-semibold text-xs">
                                                    {cs?.valor || (cs?.valor_liquido != null ? formatBRL(cs.valor_liquido) : '—')}
                                                </td>
                                                {/* Operador */}
                                                <td className="px-3 py-2.5 text-center text-xs hidden sm:table-cell">
                                                    {(turno?.operador_nome || uni?.operador_nome) ? (
                                                        <span className="truncate block max-w-[120px] mx-auto" title={turno?.operador_nome || uni?.operador_nome || ''}>
                                                            {turno?.operador_nome || uni?.operador_nome}
                                                        </span>
                                                    ) : cs?.operador_guid ? (
                                                        <span className="font-mono text-[10px] text-muted-foreground" title={cs.operador_guid}>
                                                            {cs.operador_guid.substring(0, 8)}…
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                {/* Confiança */}
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all", badge.bg, badge.border, badge.color)}>
                                                        <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", badge.dot)} />
                                                        {badge.text}
                                                    </div>
                                                </td>
                                                {/* Caixa (falta/sobra) */}
                                                <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                                                    {hasFalta ? (
                                                        <Badge variant="outline" className="text-[10px] border-red-300 text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 gap-1">
                                                            <TrendingDown className="h-2.5 w-2.5" />
                                                            {formatBRL(getFalta(v))}
                                                        </Badge>
                                                    ) : hasSobra ? (
                                                        <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1">
                                                            <TrendingUp className="h-2.5 w-2.5" />
                                                            {formatBRL(getSobra(v))}
                                                        </Badge>
                                                    ) : v.found ? (
                                                        <span className="text-emerald-500 text-[10px]">✅ OK</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                {/* Ações */}
                                                <td className="px-3 py-2.5 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => { e.stopPropagation(); openDetail(item); }}
                                                    >
                                                        Detalhes
                                                        <ChevronRight className="h-3 w-3" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ Detail Modal ═══════════ */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-violet-500" />
                            Detalhes do Fechamento
                            {detailItem?.closure_summary?.codigo && (
                                <Badge variant="outline" className="font-mono text-xs">
                                    #{detailItem.closure_summary.codigo}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {detailItem?.closure_summary?.loja_nome || 'Loja desconhecida'} — {detailItem?.closure_summary?.turno || '—'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                        {detailItem && (
                            <Tabs defaultValue="comparison" className="space-y-4">
                                <TabsList className={cn("w-full grid", detailItem.validation.unified ? 'grid-cols-5' : 'grid-cols-4')}>
                                    <TabsTrigger value="comparison" className="text-xs">Comparação</TabsTrigger>
                                    <TabsTrigger value="turno" className="text-xs">
                                        {detailItem.validation.unified ? 'Dados Unificados' : 'Dados do Turno'}
                                    </TabsTrigger>
                                    <TabsTrigger value="payments" className="text-xs">Pagamentos</TabsTrigger>
                                    {detailItem.validation.unified && (
                                        <TabsTrigger value="diff_meio" className="text-xs">Diff por Meio</TabsTrigger>
                                    )}
                                    {detailItem.validation.found && (
                                        <TabsTrigger
                                            value="compare_erp"
                                            className="text-xs gap-1"
                                            onClick={() => { if (!compareData && !compareLoading) handleCompareDetail(detailItem); }}
                                        >
                                            <Database className="h-3 w-3" />
                                            ERP × Local
                                        </TabsTrigger>
                                    )}
                                </TabsList>

                                {/* Unified badge */}
                                {detailItem.validation.unified && detailItem.validation.local_unified && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                                        <Database className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                            Visão Unificada — Canais: {detailItem.validation.local_unified.canais_presentes?.join(', ')}
                                        </span>
                                    </div>
                                )}

                                {/* Tab 1: Comparison ERP × DB */}
                                <TabsContent value="comparison" className="space-y-4">
                                    {detailItem.validation.comparison ? (
                                        <ComparisonTable comparison={detailItem.validation.comparison} isUnified={!!detailItem.validation.unified} />
                                    ) : (
                                        <div className="text-center py-8">
                                            {!detailItem.validation.found ? (
                                                <div className="space-y-2">
                                                    <XCircle className="h-10 w-10 text-red-400 mx-auto" />
                                                    <p className="text-sm font-medium">Fechamento não encontrado no banco</p>
                                                    <p className="text-xs text-muted-foreground">{detailItem.validation.reason || 'Nenhum registro correspondente.'}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Dados de comparação não disponíveis.</p>
                                            )}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Tab 2: Turno/Unified Data */}
                                <TabsContent value="turno" className="space-y-4">
                                    {detailItem.validation.unified && detailItem.validation.local_unified ? (
                                        <UnifiedDataPanel unified={detailItem.validation.local_unified} />
                                    ) : detailItem.validation.turno_db ? (
                                        <TurnoDataPanel turno={detailItem.validation.turno_db} />
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            Turno não encontrado no banco local.
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Tab 3: Payments */}
                                <TabsContent value="payments" className="space-y-4">
                                    {detailItem.validation.pagamentos ? (
                                        <PaymentsPanel pagamentos={detailItem.validation.pagamentos} />
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            Dados de pagamento não disponíveis.
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Tab 4: Diff por Meio (unified only) */}
                                {detailItem.validation.unified && (
                                    <TabsContent value="diff_meio" className="space-y-4">
                                        {detailItem.validation.diff_por_meio && detailItem.validation.diff_por_meio.length > 0 ? (
                                            <DiffPorMeioPanel items={detailItem.validation.diff_por_meio} />
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                Dados de comparação por meio de pagamento não disponíveis.
                                            </div>
                                        )}
                                    </TabsContent>
                                )}

                                {/* Tab 5: Compare Detail (ERP × Local Online) */}
                                {detailItem.validation.found && (
                                    <TabsContent value="compare_erp" className="space-y-4">
                                        {compareLoading ? (
                                            <div className="flex items-center justify-center py-12 gap-3">
                                                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                                                <span className="text-sm text-muted-foreground">Buscando dados detalhados do ERP...</span>
                                            </div>
                                        ) : compareError ? (
                                            <div className="text-center py-8 space-y-2">
                                                <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
                                                <p className="text-sm font-medium text-red-600">{compareError}</p>
                                                <Button size="sm" variant="outline" className="mt-2" onClick={() => handleCompareDetail(detailItem)}>
                                                    <RefreshCw className="h-3 w-3 mr-1" /> Tentar novamente
                                                </Button>
                                            </div>
                                        ) : compareData ? (
                                            <CompareDetailPanel data={compareData} />
                                        ) : (
                                            <div className="text-center py-8">
                                                <Database className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">Clique na aba para buscar a comparação detalhada.</p>
                                                <Button size="sm" className="mt-3 gap-1.5" onClick={() => handleCompareDetail(detailItem)}>
                                                    <RefreshCw className="h-3 w-3" /> Buscar Comparação
                                                </Button>
                                            </div>
                                        )}
                                    </TabsContent>
                                )}
                            </Tabs>
                        )}
                    </div>

                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// ── Sub-components ──

function ComparisonTable({ comparison, isUnified = false }: { comparison: ClosureComparison; isUnified?: boolean }) {
    // Handle both unified (db_unificado) and single-channel (db) total values
    const dbTotal = comparison.total.db_unificado ?? comparison.total.db ?? null;

    const rows: { label: string; erp: string; db: string; match?: boolean; extra?: string | null }[] = [
        {
            label: isUnified ? 'Total (Unificado)' : 'Total',
            erp: formatBRL(comparison.total.erp ?? null),
            db: formatBRL(dbTotal),
            match: comparison.total.match,
            extra: comparison.total.diff != null && comparison.total.diff !== 0
                ? `Diff: ${formatBRL(comparison.total.diff)}`
                : null,
        },
        {
            label: 'Operador',
            erp: comparison.operador?.erp_guid ? comparison.operador.erp_guid.substring(0, 12) + '…' : '—',
            db: comparison.operador?.db_nome || (comparison.operador?.db_guid ? comparison.operador.db_guid.substring(0, 12) + '…' : '—'),
            match: comparison.operador?.match,
        },
        {
            label: 'Sequencial',
            erp: comparison.sequencial?.erp?.toString() ?? '—',
            db: comparison.sequencial?.db?.toString() ?? '—',
            match: comparison.sequencial?.match,
        },
    ];

    // fechado is only present in single-channel responses
    if (comparison.fechado) {
        rows.push({
            label: 'Fechado',
            erp: comparison.fechado.erp ? 'Sim' : 'Não',
            db: comparison.fechado.db ? 'Sim' : 'Não',
            match: comparison.fechado.match,
        });
    }

    // Closure UUID
    if (comparison.closure_uuid) {
        rows.push({
            label: 'UUID Fechamento',
            erp: comparison.closure_uuid.erp ? comparison.closure_uuid.erp.substring(0, 12) + '…' : '—',
            db: comparison.closure_uuid.db ? comparison.closure_uuid.db.substring(0, 12) + '…' : '—',
            match: comparison.closure_uuid.match,
        });
    }

    // Declared consistent flag (unified only)
    if (isUnified && comparison.declared_consistent !== undefined) {
        rows.push({
            label: 'Declarado Consistente',
            erp: '—',
            db: comparison.declared_consistent ? 'Sim ✅' : 'Não ⚠️',
            match: comparison.declared_consistent,
        });
    }

    return (
        <div className="space-y-3">
            <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 text-xs text-muted-foreground">
                            <th className="text-left px-3 py-2 font-medium">Campo</th>
                            <th className="text-left px-3 py-2 font-medium">ERP</th>
                            <th className="text-left px-3 py-2 font-medium">{isUnified ? 'Banco (Unificado)' : 'Banco Local'}</th>
                            <th className="text-center px-3 py-2 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.label} className={cn("border-b last:border-0", row.match === false && "bg-red-50/50 dark:bg-red-950/20")}>
                                <td className="px-3 py-2 font-medium text-xs">{row.label}</td>
                                <td className="px-3 py-2 text-xs font-mono">{row.erp}</td>
                                <td className="px-3 py-2 text-xs font-mono">
                                    {row.db}
                                    {row.extra && <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400">({row.extra})</span>}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {row.match === undefined ? (
                                        <span className="text-muted-foreground">—</span>
                                    ) : row.match ? (
                                        <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Extra: declarado, falta, sobra from DB (single-channel only) */}
            {!isUnified && (comparison.total_declarado || comparison.total_falta || comparison.total_sobra) && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Declarado</p>
                        <p className="text-sm font-semibold">{formatBRL(comparison.total_declarado?.db ?? null)}</p>
                    </div>
                    <div className={cn("rounded-lg border p-3 text-center", (comparison.total_falta?.db ?? 0) > 0 && "border-red-300 bg-red-50/50 dark:bg-red-950/20")}>
                        <p className="text-xs text-muted-foreground mb-1">Falta</p>
                        <p className={cn("text-sm font-semibold", (comparison.total_falta?.db ?? 0) > 0 && "text-red-600")}>
                            {formatBRL(comparison.total_falta?.db ?? null)}
                        </p>
                    </div>
                    <div className={cn("rounded-lg border p-3 text-center", (comparison.total_sobra?.db ?? 0) > 0 && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20")}>
                        <p className="text-xs text-muted-foreground mb-1">Sobra</p>
                        <p className={cn("text-sm font-semibold", (comparison.total_sobra?.db ?? 0) > 0 && "text-emerald-600")}>
                            {formatBRL(comparison.total_sobra?.db ?? null)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function TurnoDataPanel({ turno }: { turno: TurnoDB }) {
    const rows = [
        { label: 'Operador', value: turno.operador_nome || '—', icon: User },
        { label: 'Responsável Fechamento', value: turno.responsavel_nome || '—', icon: ShieldCheck },
        { label: 'Canal', value: turno.canal || '—', icon: Database },
        { label: 'Loja', value: turno.store_name ? `${turno.store_name}${turno.store_city ? ` (${turno.store_city})` : ''}` : '—', icon: Store },
        { label: 'Início', value: turno.data_hora_inicio ? new Date(turno.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—', icon: Clock },
        { label: 'Término', value: turno.data_hora_termino ? new Date(turno.data_hora_termino).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—', icon: Clock },
        { label: 'Duração', value: formatDuration(turno.duracao_minutos), icon: Clock },
        { label: 'Vendas no Turno', value: turno.qtd_vendas_sistema?.toString() ?? '—', icon: Hash },
        { label: 'Fechado', value: turno.fechado ? '✅ Sim' : '❌ Não', icon: CheckCircle },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.label} className="border-b last:border-0">
                                <td className="px-3 py-2.5 text-xs text-muted-foreground font-medium flex items-center gap-2 w-[200px]">
                                    <row.icon className="h-3.5 w-3.5" />
                                    {row.label}
                                </td>
                                <td className="px-3 py-2.5 text-sm">{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Total Sistema</p>
                    <p className="text-base font-bold">{formatBRL(turno.total_sistema)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Total Declarado</p>
                    <p className="text-base font-bold">{formatBRL(turno.total_declarado)}</p>
                </div>
                <div className={cn("rounded-lg border p-3 text-center", (turno.total_falta ?? 0) > 0 && "border-red-300 bg-red-50/50 dark:bg-red-950/20")}>
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Falta</p>
                    <p className={cn("text-base font-bold", (turno.total_falta ?? 0) > 0 ? "text-red-600" : "text-muted-foreground")}>{formatBRL(turno.total_falta)}</p>
                </div>
                <div className={cn("rounded-lg border p-3 text-center", (turno.total_sobra ?? 0) > 0 && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20")}>
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Sobra</p>
                    <p className={cn("text-base font-bold", (turno.total_sobra ?? 0) > 0 ? "text-emerald-600" : "text-muted-foreground")}>{formatBRL(turno.total_sobra)}</p>
                </div>
            </div>
        </div>
    );
}

function PaymentsPanel({ pagamentos }: { pagamentos: PagamentosGrouped }) {
    const sections: { key: keyof PagamentosGrouped; label: string; color: string; icon: typeof CreditCard }[] = [
        { key: 'sistema', label: '📊 Sistema (calculado pelo PDV)', color: 'text-blue-600', icon: Database },
        { key: 'declarado', label: '📝 Declarado (contado pelo operador)', color: 'text-amber-600', icon: CreditCard },
        { key: 'falta', label: '⚠️ Falta', color: 'text-red-600', icon: TrendingDown },
        { key: 'sobra', label: '✅ Sobra', color: 'text-emerald-600', icon: TrendingUp },
    ];

    return (
        <div className="space-y-4">
            {sections.map(({ key, label, color, icon: Icon }) => {
                const items = pagamentos[key];
                if (!items || items.length === 0) return null;
                const totalValue = items.reduce((sum, p) => sum + p.total, 0);
                const totalQtd = items.reduce((sum, p) => sum + p.qtd_vendas, 0);

                return (
                    <div key={key} className="rounded-lg border overflow-hidden">
                        <div className={cn("px-3 py-2 bg-muted/30 border-b flex items-center justify-between")}>
                            <span className={cn("text-xs font-semibold", color)}>{label}</span>
                            <span className="text-xs text-muted-foreground font-mono">{formatBRL(totalValue)}</span>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-muted-foreground bg-muted/20">
                                    <th className="text-left px-3 py-1.5 font-medium">Meio</th>
                                    <th className="text-right px-3 py-1.5 font-medium">Total</th>
                                    <th className="text-center px-3 py-1.5 font-medium">Vendas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((p, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="px-3 py-2 text-xs">{p.meio_pagamento}</td>
                                        <td className="px-3 py-2 text-xs text-right font-mono font-semibold">{formatBRL(p.total)}</td>
                                        <td className="px-3 py-2 text-xs text-center">{p.qtd_vendas}</td>
                                    </tr>
                                ))}
                                <tr className="bg-muted/30 font-semibold">
                                    <td className="px-3 py-2 text-xs">TOTAL</td>
                                    <td className="px-3 py-2 text-xs text-right font-mono">{formatBRL(totalValue)}</td>
                                    <td className="px-3 py-2 text-xs text-center">{totalQtd}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
}

// ── Unified Data Panel ──

function UnifiedDataPanel({ unified }: { unified: LocalUnified }) {
    const t = unified.totais;
    const rows = [
        { label: 'Operador', value: unified.operador_nome || '—', icon: User },
        { label: 'Canais', value: unified.canais_presentes?.join(', ') || '—', icon: Database },
        { label: 'Canal Canônico', value: unified.canal_canonico || '—', icon: Database },
        { label: 'Loja', value: unified.store_name ? `${unified.store_name}${unified.store_city ? ` (${unified.store_city})` : ''}` : '—', icon: Store },
        { label: 'Início', value: unified.data_hora_inicio ? new Date(unified.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—', icon: Clock },
        { label: 'Término', value: unified.data_hora_termino ? new Date(unified.data_hora_termino).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—', icon: Clock },
        { label: 'Período', value: unified.periodo || '—', icon: Clock },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.label} className="border-b last:border-0">
                                <td className="px-3 py-2.5 text-xs text-muted-foreground font-medium flex items-center gap-2 w-[200px]">
                                    <row.icon className="h-3.5 w-3.5" />
                                    {row.label}
                                </td>
                                <td className="px-3 py-2.5 text-sm">{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Financial summary */}
            {t && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg border p-3 text-center">
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Entries Expected</p>
                            <p className="text-base font-bold">{formatBRL(t.entries_expected)}</p>
                        </div>
                        <div className="rounded-lg border p-3 text-center">
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Total Declarado</p>
                            <p className="text-base font-bold">{formatBRL(t.declarado)}</p>
                        </div>
                        <div className={cn("rounded-lg border p-3 text-center", t.falta > 0 && "border-red-300 bg-red-50/50 dark:bg-red-950/20")}>
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Falta</p>
                            <p className={cn("text-base font-bold", t.falta > 0 ? "text-red-600" : "text-muted-foreground")}>{formatBRL(t.falta)}</p>
                        </div>
                        <div className={cn("rounded-lg border p-3 text-center", t.sobra > 0 && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20")}>
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Sobra</p>
                            <p className={cn("text-base font-bold", t.sobra > 0 ? "text-emerald-600" : "text-muted-foreground")}>{formatBRL(t.sobra)}</p>
                        </div>
                    </div>

                    {/* Channel breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3">
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Sistema Caixa (PDV)</p>
                            <p className="text-sm font-bold">{formatBRL(t.sistema_caixa)}</p>
                        </div>
                        {t.has_loja_sales && (
                            <div className="rounded-lg border p-3">
                                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Contribuição Loja (inferida)</p>
                                <p className="text-sm font-bold text-blue-600">{formatBRL(t.loja_cash_contribution_inferred)}</p>
                            </div>
                        )}
                    </div>

                    {/* Consistency flag */}
                    {!t.declared_consistent && (
                        <div className="rounded-lg border border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 p-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-amber-700 dark:text-amber-300">
                                Valores declarados divergem entre canais (min: {formatBRL(t.declared_min)}, max: {formatBRL(t.declared_max)})
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Diff por Meio Panel ──

function DiffPorMeioPanel({ items }: { items: DiffPorMeio[] }) {
    return (
        <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted/50 text-xs text-muted-foreground">
                        <th className="text-left px-3 py-2 font-medium">Meio</th>
                        <th className="text-right px-3 py-2 font-medium">ERP Sistema</th>
                        <th className="text-right px-3 py-2 font-medium">Local Sistema</th>
                        <th className="text-right px-3 py-2 font-medium">Local Declarado</th>
                        <th className="text-center px-3 py-2 font-medium">ERP Falta</th>
                        <th className="text-center px-3 py-2 font-medium">ERP Sobra</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2 text-xs font-medium">{item.meio}</td>
                            <td className="px-3 py-2 text-xs text-right font-mono">{formatBRL(item.erp?.valor_sistema)}</td>
                            <td className="px-3 py-2 text-xs text-right font-mono">{formatBRL(item.local?.sistema)}</td>
                            <td className="px-3 py-2 text-xs text-right font-mono">{formatBRL(item.local?.declarado)}</td>
                            <td className="px-3 py-2 text-xs text-center">
                                {(item.erp?.falta ?? 0) > 0 ? (
                                    <span className="text-red-600 font-semibold">{formatBRL(item.erp.falta)}</span>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-xs text-center">
                                {(item.erp?.sobra ?? 0) > 0 ? (
                                    <span className="text-emerald-600 font-semibold">{formatBRL(item.erp.sobra)}</span>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Compare Detail Panel ──

function CompareDetailPanel({ data }: { data: CompareDetailResponse }) {
    const c = data.comparison;
    const erp = data.erp;
    const local = data.local;

    const matchBg = (match: boolean) =>
        match
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';

    const matchIcon = (match: boolean) =>
        match
            ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;

    const matchText = (match: boolean) =>
        match ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300';

    return (
        <div className="space-y-4">
            {/* Loja info */}
            {local.store && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-800">
                    <Store className="h-4 w-4 text-violet-500" />
                    <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                        {local.store.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                        ID: {local.store.id}
                    </span>
                </div>
            )}

            {/* Summary cards: Total / Falta / Sobra */}
            <div className="grid grid-cols-3 gap-3">
                {/* Total */}
                <div className={cn("rounded-lg border p-3", matchBg(c.totais.match))}>
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Sistema</p>
                        {matchIcon(c.totais.match)}
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs"><span className="text-muted-foreground">ERP:</span> <span className="font-bold">{formatBRL(c.totais.erp_total)}</span></p>
                        <p className="text-xs"><span className="text-muted-foreground">Local:</span> <span className="font-bold">{formatBRL(c.totais.local_total)}</span></p>
                    </div>
                    {!c.totais.match && (
                        <p className={cn("text-[10px] font-semibold mt-1", matchText(false))}>
                            Diff: {formatBRL(c.totais.diff)}
                        </p>
                    )}
                </div>

                {/* Falta */}
                <div className={cn("rounded-lg border p-3", matchBg(c.falta.match))}>
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Falta</p>
                        {matchIcon(c.falta.match)}
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs"><span className="text-muted-foreground">ERP:</span> <span className="font-bold">{formatBRL(c.falta.erp)}</span></p>
                        <p className="text-xs"><span className="text-muted-foreground">Local:</span> <span className="font-bold">{formatBRL(c.falta.local)}</span></p>
                    </div>
                    {!c.falta.match && (
                        <p className={cn("text-[10px] font-semibold mt-1", matchText(false))}>
                            Diff: {formatBRL(c.falta.diff)}
                        </p>
                    )}
                </div>

                {/* Sobra */}
                <div className={cn("rounded-lg border p-3", matchBg(c.sobra.match))}>
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sobra</p>
                        {matchIcon(c.sobra.match)}
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs"><span className="text-muted-foreground">ERP:</span> <span className="font-bold">{formatBRL(c.sobra.erp)}</span></p>
                        <p className="text-xs"><span className="text-muted-foreground">Local:</span> <span className="font-bold">{formatBRL(c.sobra.local)}</span></p>
                    </div>
                    {!c.sobra.match && (
                        <p className={cn("text-[10px] font-semibold mt-1", matchText(false))}>
                            Diff: {formatBRL(c.sobra.diff)}
                        </p>
                    )}
                </div>
            </div>

            {/* Metadata: Operador / Sequencial / Fechado */}
            <div className="grid grid-cols-3 gap-3">
                <div className={cn("rounded-lg border p-3 text-center", matchBg(c.operador.match))}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Operador</p>
                    </div>
                    <p className="text-xs font-medium truncate">{c.operador.local_nome || '—'}</p>
                    <p className={cn("text-[10px] mt-0.5", matchText(c.operador.match))}>
                        {c.operador.match ? '✓ Match' : '✗ Divergente'}
                    </p>
                </div>
                <div className={cn("rounded-lg border p-3 text-center", matchBg(c.sequencial.match))}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sequencial</p>
                    </div>
                    <p className="text-sm font-bold">{c.sequencial.erp ?? '—'}º → {c.sequencial.local ?? '—'}º</p>
                    <p className={cn("text-[10px] mt-0.5", matchText(c.sequencial.match))}>
                        {c.sequencial.match ? '✓ Match' : '✗ Divergente'}
                    </p>
                </div>
                <div className={cn("rounded-lg border p-3 text-center", matchBg(c.fechado.match))}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Fechado</p>
                    </div>
                    <p className="text-sm font-bold">
                        {c.fechado.erp ? '✅' : '❌'} → {c.fechado.local ? '✅' : '❌'}
                    </p>
                    <p className={cn("text-[10px] mt-0.5", matchText(c.fechado.match))}>
                        {c.fechado.match ? '✓ Match' : '✗ Divergente'}
                    </p>
                </div>
            </div>

            {/* Per-payment-method table */}
            {c.por_meio && c.por_meio.length > 0 && (
                <div className="rounded-lg border overflow-hidden">
                    <div className="bg-muted/30 px-3 py-2 border-b">
                        <p className="text-xs font-semibold flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-violet-500" />
                            Comparação por Meio de Pagamento
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground">
                                    <th className="text-left px-3 py-2 font-medium">Meio</th>
                                    <th className="text-right px-3 py-2 font-medium">ERP Sistema</th>
                                    <th className="text-right px-3 py-2 font-medium">Local Expected</th>
                                    <th className="text-right px-3 py-2 font-medium">Local Declarado</th>
                                    <th className="text-center px-3 py-2 font-medium">Falta</th>
                                    <th className="text-center px-3 py-2 font-medium">Sobra</th>
                                    <th className="text-center px-3 py-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {c.por_meio.map((pm, i) => {
                                    const allMatch = pm.match_entradas && pm.match_declarado && pm.match_falta && pm.match_sobra;
                                    const isOnlyOne = pm.only_erp || pm.only_local;
                                    return (
                                        <tr
                                            key={i}
                                            className={cn(
                                                "border-b last:border-0",
                                                isOnlyOne && "bg-amber-50/50 dark:bg-amber-950/10",
                                                !allMatch && !isOnlyOne && "bg-red-50/30 dark:bg-red-950/10"
                                            )}
                                        >
                                            <td className="px-3 py-2 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    {pm.meio}
                                                    {pm.only_erp && (
                                                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-amber-300 text-amber-600 bg-amber-50">
                                                            só ERP
                                                        </Badge>
                                                    )}
                                                    {pm.only_local && (
                                                        <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-blue-300 text-blue-600 bg-blue-50">
                                                            só Local
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={cn("px-3 py-2 text-right font-mono", !pm.match_entradas && "text-red-600 font-bold")}>
                                                {pm.erp_entradas != null ? formatBRL(pm.erp_entradas) : '—'}
                                            </td>
                                            <td className={cn("px-3 py-2 text-right font-mono", !pm.match_entradas && "text-red-600 font-bold")}>
                                                {pm.local_expected != null ? formatBRL(pm.local_expected) : '—'}
                                            </td>
                                            <td className={cn("px-3 py-2 text-right font-mono", !pm.match_declarado && "text-amber-600 font-bold")}>
                                                {pm.local_declarado != null ? formatBRL(pm.local_declarado) : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {(pm.erp_falta ?? 0) > 0 || (pm.local_falta ?? 0) > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-red-600 font-semibold">
                                                            {formatBRL(pm.erp_falta ?? 0)}
                                                        </span>
                                                        {!pm.match_falta && (
                                                            <span className="text-[9px] text-red-400">
                                                                L: {formatBRL(pm.local_falta ?? 0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {(pm.erp_sobra ?? 0) > 0 || (pm.local_sobra ?? 0) > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-emerald-600 font-semibold">
                                                            {formatBRL(pm.erp_sobra ?? 0)}
                                                        </span>
                                                        {!pm.match_sobra && (
                                                            <span className="text-[9px] text-emerald-400">
                                                                L: {formatBRL(pm.local_sobra ?? 0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {allMatch ? (
                                                    <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                                                ) : isOnlyOne ? (
                                                    <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ERP Totals Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Entradas Sistema</p>
                    <p className="text-sm font-bold">{formatBRL(erp.total_entradas_sistema)}</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Lançamentos Sistema</p>
                    <p className="text-sm font-bold">{formatBRL(erp.total_lancamentos_sistema)}</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Na Gaveta (ERP)</p>
                    <p className="text-sm font-bold">{formatBRL(erp.total_na_gaveta)}</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">No Sistema (ERP)</p>
                    <p className="text-sm font-bold">{formatBRL(erp.total_no_sistema)}</p>
                </div>
            </div>
        </div>
    );
}

export default ClosureValidation;
