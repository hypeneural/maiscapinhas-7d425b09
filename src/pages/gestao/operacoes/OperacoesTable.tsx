import React from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis,
} from "@/components/ui/pagination";
import {
    Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Loader2, ChevronRight, ChevronLeft, ShoppingCart,
} from "lucide-react";
import { formatCurrency } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Operacao, OperacoesResponse } from '@/types/pdv-operacoes.types';
import { getChannelVisual, getPaymentVisual, getStatusVisual, getTypeVisual } from './operacaoVisuals';

interface OperacoesTableProps {
    data: OperacoesResponse | undefined;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onRowClick: (operacao: Operacao) => void;
}

const VisualBadge: React.FC<{
    label: string;
    icon: React.ElementType;
    badgeClass: string;
    iconClass?: string;
    compact?: boolean;
}> = ({ label, icon: Icon, badgeClass, iconClass, compact = false }) => {
    return (
        <Badge
            variant="outline"
            className={cn(
                "inline-flex items-center gap-1.5 border font-medium",
                compact ? "text-[10px] h-5 px-1.5 py-0" : "text-xs h-6 px-2 py-0.5",
                badgeClass,
            )}
        >
            <Icon className={cn("h-3.5 w-3.5", iconClass)} />
            <span className="truncate">{label}</span>
        </Badge>
    );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const visual = getStatusVisual(status);
    return (
        <VisualBadge
            label={visual.label}
            icon={visual.icon}
            badgeClass={visual.badgeClass}
            iconClass={visual.iconClass}
            compact
        />
    );
};

const TypeBadge: React.FC<{ tipo: string }> = ({ tipo }) => {
    const visual = getTypeVisual(tipo);
    return (
        <VisualBadge
            label={visual.label}
            icon={visual.icon}
            badgeClass={visual.badgeClass}
            iconClass={visual.iconClass}
            compact
        />
    );
};

const ChannelBadge: React.FC<{ canal: Operacao['canal'] }> = ({ canal }) => {
    const visual = getChannelVisual(canal);
    return (
        <VisualBadge
            label={visual.label}
            icon={visual.icon}
            badgeClass={visual.badgeClass}
            iconClass={visual.iconClass}
            compact
        />
    );
};

const PaymentBadge: React.FC<{ meioPagamento: string | null }> = ({ meioPagamento }) => {
    if (!meioPagamento) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const visual = getPaymentVisual(meioPagamento);
    return (
        <VisualBadge
            label={visual.label}
            icon={visual.icon}
            badgeClass={visual.badgeClass}
            iconClass={visual.iconClass}
            compact
        />
    );
};

// ── Format datetime ──
function formatOperacaoDateTime(isoString: string): string {
    try {
        const d = parseISO(isoString);
        return format(d, "dd/MM HH:mm", { locale: ptBR });
    } catch {
        return '—';
    }
}

export const OperacoesTable: React.FC<OperacoesTableProps> = ({
    data, isLoading, onPageChange, onRowClick,
}) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Carregando operações...</span>
            </div>
        );
    }

    if (!data?.data?.length) {
        return (
            <div className="text-center p-12 border rounded-xl bg-card text-muted-foreground space-y-2">
                <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="font-medium">Nenhuma operação encontrada</p>
                <p className="text-xs">Tente ajustar os filtros ou selecionar outro período.</p>
            </div>
        );
    }

    const { current_page, last_page, from, to, total } = data.meta.pagination;

    // ── Pagination Logic ──
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;
        if (last_page <= maxVisible) {
            for (let i = 1; i <= last_page; i++) pages.push(i);
            return pages;
        }
        let start = Math.max(1, current_page - 2);
        let end = Math.min(last_page, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
        if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < last_page) { if (end < last_page - 1) pages.push('...'); pages.push(last_page); }
        return pages;
    };

    return (
        <div className="space-y-3">
            {/* Info bar */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                    Exibindo <strong className="text-foreground">{from}–{to}</strong> de{' '}
                    <strong className="text-foreground">{total.toLocaleString('pt-BR')}</strong> operações
                </span>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-[80px]">Tipo</TableHead>
                            <TableHead className="w-[100px]">Data/Hora</TableHead>
                            <TableHead>Loja</TableHead>
                            <TableHead>Operação</TableHead>
                            <TableHead className="text-center w-[60px]">Itens</TableHead>
                            <TableHead>Vendedor</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="w-[100px]">Pagamento</TableHead>
                            <TableHead className="w-[90px]">Status</TableHead>
                            <TableHead className="w-[30px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.map((op, idx) => (
                            <TableRow
                                key={`${op.tipo_operacao}-${op.operacao_id ?? op.turno_seq}-${idx}`}
                                className="cursor-pointer hover:bg-muted/40 transition-colors group"
                                onClick={() => onRowClick(op)}
                            >
                                <TableCell><TypeBadge tipo={op.tipo_operacao} /></TableCell>

                                <TableCell className="whitespace-nowrap">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-medium">{formatOperacaoDateTime(op.data_hora)}</span>
                                        {op.turno_seq && (
                                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm w-fit">
                                                {op.turno_seq}º Turno
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium truncate max-w-[140px]">
                                                    {op.store_name || `PDV #${op.store_pdv_id}`}
                                                </span>
                                                <ChannelBadge canal={op.canal} />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{op.store_name || `PDV #${op.store_pdv_id}`}</p>
                                            <p className="text-xs text-muted-foreground">PDV ID: {op.store_pdv_id}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TableCell>

                                <TableCell>
                                    <span className="font-mono text-xs font-medium">{op.operacao_label}</span>
                                </TableCell>

                                <TableCell className="text-center">
                                    <span className="text-sm">
                                        {op.itens}
                                        {op.tipo_operacao === 'fechamento_caixa' && (
                                            <span className="text-[10px] text-muted-foreground block">vendas</span>
                                        )}
                                    </span>
                                </TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                                            {op.vendedor_nome?.substring(0, 1) || '?'}
                                        </div>
                                        <span className="text-sm truncate max-w-[100px]" title={op.vendedor_nome || undefined}>
                                            {op.vendedor_nome || '—'}
                                        </span>
                                    </div>
                                </TableCell>

                                <TableCell className="text-right">
                                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(op.valor)}
                                    </span>
                                </TableCell>

                                <TableCell>
                                    <PaymentBadge meioPagamento={op.meio_pagamento} />
                                </TableCell>

                                <TableCell><StatusBadge status={op.status} /></TableCell>

                                <TableCell>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {last_page > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationLink
                                onClick={() => onPageChange(Math.max(1, current_page - 1))}
                                className={current_page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer gap-1 pl-2.5'}
                                size="default"
                                aria-label="Página anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>Anterior</span>
                            </PaginationLink>
                        </PaginationItem>
                        {getPageNumbers().map((page, index) => (
                            <PaginationItem key={index}>
                                {page === '...' ? (
                                    <PaginationEllipsis />
                                ) : (
                                    <PaginationLink
                                        isActive={page === current_page}
                                        onClick={() => onPageChange(page as number)}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                )}
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationLink
                                onClick={() => onPageChange(Math.min(last_page, current_page + 1))}
                                className={current_page === last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer gap-1 pr-2.5'}
                                size="default"
                                aria-label="Próxima página"
                            >
                                <span>Próxima</span>
                                <ChevronRight className="h-4 w-4" />
                            </PaginationLink>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
};
