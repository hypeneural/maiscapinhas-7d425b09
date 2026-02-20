import { useState, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import { RefreshCw, History, ShieldCheck, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOperacoes } from '@/services/reports.service';
import { getStores } from '@/services/stores.service';
import { resolveStoreIdentifierForReports } from '@/lib/store-identifiers';
import { OperacoesSummaryCards } from './operacoes/OperacoesSummaryCards';
import { OperacoesFilters } from './operacoes/OperacoesFilters';
import { OperacoesTable } from './operacoes/OperacoesTable';
import { OperacaoDetailSheet } from './operacoes/OperacaoDetailSheet';
import type { OperacoesFilters as FilterType, Operacao } from '@/types/pdv-operacoes.types';

const OperacoesHistory: React.FC = () => {
    const [filters, setFilters] = useState<FilterType>({
        page: 1,
        per_page: 15,
        sort: 'desc',
        from: format(new Date(), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd'),
    });

    const [selectedOp, setSelectedOp] = useState<Operacao | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { data: stores, isLoading: isLoadingStores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => getStores(),
        staleTime: 1000 * 60 * 5,
    });
    const resolvedStoreId = resolveStoreIdentifierForReports(filters.store_id, stores);
    const shouldWaitStoreMetadata = Boolean(filters.store_id)
        && /^\d+$/.test(String(filters.store_id))
        && isLoadingStores;

    // ── Main Data Query ──
    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['operacoes-history', filters, resolvedStoreId],
        queryFn: () => getOperacoes({
            ...filters,
            store_id: resolvedStoreId,
        }),
        enabled: !shouldWaitStoreMetadata,
        placeholderData: keepPreviousData,
    });

    // ── Handlers ──
    const handleFilterChange = useCallback((newFilters: FilterType) => {
        setFilters(newFilters);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }));
    }, []);

    const handleRowClick = useCallback((op: Operacao) => {
        setSelectedOp(op);
        setIsDetailOpen(true);
    }, []);

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 p-5 shadow-sm">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                            <History className="h-3.5 w-3.5" />
                            Histórico unificado
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                Operações PDV
                            </h1>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Visual moderno para análise de vendas e fechamentos de caixa em todas as lojas.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Vendas e Fechamentos
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-medium text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300">
                                <Store className="h-3.5 w-3.5" />
                                Visão multiloja
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="gap-2 bg-white/80 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <OperacoesSummaryCards
                summary={data?.summary}
                filters={filters}
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
            />

            {/* ── Filters ── */}
            <OperacoesFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
            />

            {/* ── Table ── */}
            <OperacoesTable
                data={data}
                isLoading={isLoading}
                onPageChange={handlePageChange}
                onRowClick={handleRowClick}
            />

            {/* ── Detail Sheet ── */}
            <OperacaoDetailSheet
                operacao={selectedOp}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />

            {/* ── Error State ── */}
            {isError && (
                <div className="text-center p-6 border border-red-200 dark:border-red-900 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
                    <p className="font-medium">Erro ao carregar operações</p>
                    <p className="text-sm mt-1">Verifique sua conexão e tente novamente.</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
                        Tentar novamente
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OperacoesHistory;
