import React from 'react';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { BarChart3, ShoppingCart, Lock, DollarSign, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OperacoesSummary, OperacoesFilters } from '@/types/pdv-operacoes.types';

interface OperacoesSummaryCardsProps {
    summary: OperacoesSummary | undefined;
    filters: OperacoesFilters;
    onFilterChange: (filters: OperacoesFilters) => void;
    isLoading?: boolean;
}

interface SummaryCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    bgAccent: string;
    borderAccent: string;
    isActive?: boolean;
    onClick?: () => void;
    isLoading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
    title, value, subtitle, icon: Icon,
    iconColor, bgAccent, borderAccent,
    isActive, onClick, isLoading,
}) => (
    <Card
        className={cn(
            "relative overflow-hidden transition-all duration-300 cursor-pointer group",
            "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5",
            isActive && `ring-2 ${borderAccent} shadow-lg`,
            onClick && "cursor-pointer"
        )}
        onClick={onClick}
    >
        {/* Gradient accent bar */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", bgAccent)} />

        {/* Active pulse indicator */}
        {isActive && (
            <div className={cn("absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse", bgAccent)} />
        )}

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={cn(
                "p-2 rounded-lg transition-colors",
                isActive ? bgAccent + "/20" : "bg-muted/50 group-hover:" + bgAccent + "/10"
            )}>
                <Icon className={cn("h-4 w-4", iconColor)} />
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
            ) : (
                <>
                    <div className="text-2xl font-bold tracking-tight">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                </>
            )}
        </CardContent>
    </Card>
);

export const OperacoesSummaryCards: React.FC<OperacoesSummaryCardsProps> = ({
    summary, filters, onFilterChange, isLoading,
}) => {
    const activeTipo = filters.tipo_operacao;

    const handleTipoClick = (tipo: 'venda' | 'fechamento_caixa') => {
        const newFilters = { ...filters, page: 1 };
        if (activeTipo === tipo) {
            // Toggle off
            delete newFilters.tipo_operacao;
        } else {
            newFilters.tipo_operacao = tipo;
        }
        onFilterChange(newFilters);
    };

    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <SummaryCard
                title="Total Operações"
                value={summary?.total_operacoes?.toLocaleString('pt-BR') ?? '—'}
                subtitle="No período selecionado"
                icon={BarChart3}
                iconColor="text-slate-600 dark:text-slate-400"
                bgAccent="bg-slate-500"
                borderAccent="ring-slate-400"
                isLoading={isLoading}
            />
            <SummaryCard
                title="Vendas"
                value={summary?.total_vendas?.toLocaleString('pt-BR') ?? '—'}
                subtitle="Clique para filtrar"
                icon={ShoppingCart}
                iconColor="text-emerald-600 dark:text-emerald-400"
                bgAccent="bg-emerald-500"
                borderAccent="ring-emerald-400"
                isActive={activeTipo === 'venda'}
                onClick={() => handleTipoClick('venda')}
                isLoading={isLoading}
            />
            <SummaryCard
                title="Fechamentos"
                value={summary?.total_fechamentos?.toLocaleString('pt-BR') ?? '—'}
                subtitle="Clique para filtrar"
                icon={Lock}
                iconColor="text-violet-600 dark:text-violet-400"
                bgAccent="bg-violet-500"
                borderAccent="ring-violet-400"
                isActive={activeTipo === 'fechamento_caixa'}
                onClick={() => handleTipoClick('fechamento_caixa')}
                isLoading={isLoading}
            />
            <SummaryCard
                title="Valor Faturado"
                value={summary ? formatCurrency(summary.total_valor) : '—'}
                subtitle="Receita total do período"
                icon={DollarSign}
                iconColor="text-amber-600 dark:text-amber-400"
                bgAccent="bg-amber-500"
                borderAccent="ring-amber-400"
                isLoading={isLoading}
            />
        </div>
    );
};
