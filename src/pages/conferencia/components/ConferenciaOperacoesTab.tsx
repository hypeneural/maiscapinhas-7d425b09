/**
 * ConferenciaOperacoesTab
 *
 * Embedded operations viewer for the conference page.
 * Reuses the shared OperacoesTable + OperacaoDetailSheet components
 * with pre-set filters derived from the parent conference selection.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { RefreshCw, Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOperacoes } from '@/services/reports.service';
import { OperacoesSummaryCards } from '@/pages/gestao/operacoes/OperacoesSummaryCards';
import { OperacoesTable } from '@/pages/gestao/operacoes/OperacoesTable';
import { OperacaoDetailSheet } from '@/pages/gestao/operacoes/OperacaoDetailSheet';
import type { OperacoesFilters, Operacao } from '@/types/pdv-operacoes.types';

interface ConferenciaOperacoesTabProps {
    /** Store identifier (guid) ready for the reports API */
    storeIdentifier: string;
    /** Date in YYYY-MM-DD format */
    date: string;
    /** Normalized shift code (1, 2, 3) */
    shiftCode: string;
}

export const ConferenciaOperacoesTab: React.FC<ConferenciaOperacoesTabProps> = ({
    storeIdentifier,
    date,
    shiftCode,
}) => {
    const [page, setPage] = useState(1);
    const [tipoOperacao, setTipoOperacao] = useState<string | undefined>(undefined);
    const [selectedOp, setSelectedOp] = useState<Operacao | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const filters: OperacoesFilters = useMemo(() => ({
        page,
        per_page: 15,
        sort: 'desc' as const,
        from: date,
        to: date,
        store_id: storeIdentifier,
        turno_seq: parseInt(shiftCode, 10),
        tipo_operacao: tipoOperacao as OperacoesFilters['tipo_operacao'],
    }), [page, date, storeIdentifier, shiftCode, tipoOperacao]);

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['conferencia-operacoes', storeIdentifier, date, shiftCode, page, tipoOperacao],
        queryFn: () => getOperacoes(filters),
        placeholderData: keepPreviousData,
        enabled: !!storeIdentifier && !!date && !!shiftCode,
    });

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handleRowClick = useCallback((op: Operacao) => {
        setSelectedOp(op);
        setIsDetailOpen(true);
    }, []);

    const handleFilterChange = useCallback((newFilters: OperacoesFilters) => {
        setTipoOperacao(newFilters.tipo_operacao);
        setPage(1);
    }, []);

    if (!storeIdentifier || !date || !shiftCode) {
        return (
            <div className="text-center p-12 border rounded-xl bg-card text-muted-foreground space-y-2">
                <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="font-medium">Selecione loja, data e turno</p>
                <p className="text-xs">As operações serão exibidas após a seleção completa.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Operações do turno selecionado
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Summary Cards */}
            <OperacoesSummaryCards
                summary={data?.summary}
                filters={filters}
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
            />

            {/* Table */}
            <OperacoesTable
                data={data}
                isLoading={isLoading}
                onPageChange={handlePageChange}
                onRowClick={handleRowClick}
            />

            {/* Detail Sheet */}
            <OperacaoDetailSheet
                operacao={selectedOp}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />

            {/* Error State */}
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
