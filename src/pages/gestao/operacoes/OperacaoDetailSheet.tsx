import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Loader2, ShoppingBag, CreditCard, User, Store as StoreIcon,
    Clock, Hash, BarChart3, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { getSaleDetails, getClosureDetails } from '@/services/reports.service';
import { getStores } from '@/services/stores.service';
import { resolveStoreIdentifierForReports } from '@/lib/store-identifiers';
import { formatCurrency } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Operacao, ClosureDetail, ClosurePagamentoPorMeio } from '@/types/pdv-operacoes.types';
import { getChannelVisual, getPaymentVisual, getStatusVisual, getTypeVisual } from './operacaoVisuals';

interface OperacaoDetailSheetProps {
    operacao: Operacao | null;
    isOpen: boolean;
    onClose: () => void;
}

function formatDT(isoString: string): string {
    try {
        return format(parseISO(isoString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
        return '—';
    }
}

const periodoLabels: Record<string, string> = {
    MATUTINO: 'Matutino',
    VESPERTINO: 'Vespertino',
    NOTURNO: 'Noturno',
};

export const OperacaoDetailSheet: React.FC<OperacaoDetailSheetProps> = ({
    operacao, isOpen, onClose,
}) => {
    const isVenda = operacao?.tipo_operacao === 'venda';
    const { data: stores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => getStores(),
        staleTime: 1000 * 60 * 5,
    });
    const resolvedStoreId = resolveStoreIdentifierForReports(operacao?.store_id, stores);

    // Only fetch details if it's a venda
    const { data: detailsData, isLoading } = useQuery({
        queryKey: ['operacao-detail', resolvedStoreId ?? operacao?.store_id, operacao?.operacao_id, operacao?.canal],
        queryFn: () => {
            if (!operacao || !operacao.operacao_id || !operacao.store_id) throw new Error("No operacao selected");
            return getSaleDetails(resolvedStoreId ?? operacao.store_id, operacao.operacao_id, operacao.canal);
        },
        enabled: !!operacao && isOpen && isVenda && !!operacao.operacao_id && !!operacao.store_id,
    });

    const { data: closureData, isLoading: closureLoading } = useQuery({
        queryKey: ['closure-detail', operacao?.closure_uuid],
        queryFn: () => {
            if (!operacao?.closure_uuid) throw new Error("No closure_uuid");
            return getClosureDetails(operacao.closure_uuid);
        },
        enabled: !!operacao && isOpen && !isVenda && !!operacao.closure_uuid,
    });

    const closureDetails: ClosureDetail | undefined = closureData?.unified;

    const items = detailsData?.data?.itens || [];
    const payments = detailsData?.data?.pagamentos || [];
    const typeVisual = getTypeVisual(operacao?.tipo_operacao ?? 'venda');
    const statusVisual = getStatusVisual(operacao?.status ?? '');
    const channelVisual = getChannelVisual((operacao?.canal ?? 'UNIFICADO') as Operacao['canal']);
    const channelLabel = !isVenda && closureDetails
        ? 'Loja (Unificado)'
        : operacao?.canal === 'HIPER_CAIXA'
            ? 'Caixa (PDV)'
            : operacao?.canal === 'HIPER_LOJA'
                ? 'Loja (App)'
                : channelVisual.label;
    const TypeIcon = typeVisual.icon;
    const StatusIcon = statusVisual.icon;
    const ChannelIcon = channelVisual.icon;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                        <TypeIcon className={cn("h-5 w-5", typeVisual.iconClass)} />
                        {isVenda ? 'Detalhe da Venda' : 'Detalhe do Fechamento'}
                    </SheetTitle>
                    <SheetDescription>
                        {operacao?.operacao_label} — {operacao?.data_hora && formatDT(operacao.data_hora)}
                    </SheetDescription>
                </SheetHeader>

                {/* ── Summary Info ── */}
                <div className="space-y-6">
                    {/* Status + Value Header */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs h-6 px-2 py-0.5 gap-1.5 border",
                                    statusVisual.badgeClass,
                                )}
                            >
                                <StatusIcon className={cn("h-3.5 w-3.5", statusVisual.iconClass)} />
                                {statusVisual.label}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ChannelIcon className={cn("h-3.5 w-3.5", channelVisual.iconClass)} />
                                <span>{channelLabel}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Valor Total</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(
                                    closureDetails?.totais?.entries_expected ?? operacao?.valor ?? 0
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <InfoItem icon={StoreIcon} label="Loja" value={
                            closureDetails?.operador_nome || operacao?.store_name || `PDV #${operacao?.store_pdv_id}`
                        } />
                        <InfoItem icon={Clock} label="Data/Hora" value={operacao?.data_hora ? formatDT(operacao.data_hora) : '—'} />
                        <InfoItem icon={User} label="Vendedor/Operador" value={operacao?.vendedor_nome || '—'} />
                        <InfoItem icon={Hash} label="Turno" value={
                            closureDetails?.sequencial
                                ? `${closureDetails.sequencial}º Turno`
                                : operacao?.turno_seq
                                    ? `${operacao.turno_seq}º Turno`
                                    : '—'
                        } />
                        {isVenda && operacao?.meio_pagamento && (() => {
                            const paymentVisual = getPaymentVisual(operacao.meio_pagamento);
                            const PaymentIcon = paymentVisual.icon;
                            return (
                                <InfoItem
                                    icon={CreditCard}
                                    label="Pagamento"
                                    value={(
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "h-6 px-2 py-0.5 gap-1.5 border text-[11px] w-fit",
                                                paymentVisual.badgeClass,
                                            )}
                                        >
                                            <PaymentIcon className={cn("h-3.5 w-3.5", paymentVisual.iconClass)} />
                                            {paymentVisual.label}
                                        </Badge>
                                    )}
                                />
                            );
                        })()}
                        {!isVenda && closureDetails && (
                            <>
                                <InfoItem icon={Clock} label="Período" value={periodoLabels[closureDetails.periodo] || closureDetails.periodo} />
                                <InfoItem icon={Clock} label="Início" value={formatDT(closureDetails.data_hora_inicio)} />
                                <InfoItem icon={Clock} label="Fechamento" value={formatDT(closureDetails.data_hora_fechamento)} />
                            </>
                        )}
                        <InfoItem icon={BarChart3} label={isVenda ? "Itens" : "Vendas no turno"} value={String(operacao?.itens ?? 0)} />
                    </div>

                    <Separator />

                    {/* ── Venda Details ── */}
                    {isVenda && (
                        <>
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    {/* Items */}
                                    {items.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="font-semibold flex items-center gap-2 text-sm">
                                                <ShoppingBag className="h-4 w-4" />
                                                Itens ({items.length})
                                            </h3>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Produto</TableHead>
                                                            <TableHead className="text-right w-[60px]">Qtd</TableHead>
                                                            <TableHead className="text-right w-[90px]">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {items.map((item: any, index: number) => (
                                                            <TableRow key={index}>
                                                                <TableCell className="py-2">
                                                                    <div className="font-medium text-xs">{item.nome_produto}</div>
                                                                    <div className="text-[10px] text-muted-foreground font-mono">{item.codigo_barras}</div>
                                                                    {item.vendedor_nome && (
                                                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                                                            <User className="h-3 w-3" />{item.vendedor_nome}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right py-2 text-xs">{item.qtd}</TableCell>
                                                                <TableCell className="text-right py-2 font-bold text-xs">
                                                                    {formatCurrency(item.total)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payments */}
                                    {payments.length > 0 && (
                                        <>
                                            <Separator />
                                            <div className="space-y-3">
                                                <h3 className="font-semibold flex items-center gap-2 text-sm">
                                                    <CreditCard className="h-4 w-4" />
                                                    Pagamentos
                                                </h3>
                                                <div className="border rounded-lg overflow-hidden">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Forma</TableHead>
                                                                <TableHead className="text-center w-[60px]">Parc.</TableHead>
                                                                <TableHead className="text-right w-[90px]">Valor</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {payments.map((payment: any, index: number) => (
                                                                (() => {
                                                                    const paymentVisual = getPaymentVisual(payment.meio_pagamento || '');
                                                                    const PaymentIcon = paymentVisual.icon;
                                                                    return (
                                                                        <TableRow key={index}>
                                                                            <TableCell className="py-2">
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={cn(
                                                                                        "h-6 px-2 py-0.5 gap-1.5 border text-[11px]",
                                                                                        paymentVisual.badgeClass,
                                                                                    )}
                                                                                >
                                                                                    <PaymentIcon className={cn("h-3.5 w-3.5", paymentVisual.iconClass)} />
                                                                                    {paymentVisual.label}
                                                                                </Badge>
                                                                            </TableCell>
                                                                            <TableCell className="text-center py-2 text-sm">
                                                                                {payment.parcelas > 1 ? `${payment.parcelas}x` : '-'}
                                                                            </TableCell>
                                                                            <TableCell className="text-right py-2 font-medium text-sm">
                                                                                {formatCurrency(payment.valor)}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })()
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* ── Fechamento Details ── */}
                    {!isVenda && (
                        <div className="space-y-6">
                            {/* No closure_uuid — turno still open */}
                            {!operacao?.closure_uuid ? (
                                <div className="text-center py-8 text-amber-600 dark:text-amber-400 text-sm">
                                    <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                                    Turno ainda não foi fechado. Detalhes indisponíveis.
                                </div>
                            ) : closureLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : closureDetails ? (
                                <>
                                    {/* ── Payment Breakdown Table ── */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                                            <CreditCard className="h-4 w-4" />
                                            Detalhamento por Meio de Pagamento
                                        </h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Forma</TableHead>
                                                        <TableHead className="text-right">Entrada</TableHead>
                                                        <TableHead className="text-right">Lançado</TableHead>
                                                        <TableHead className="text-right">Falta/Sobra</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {closureDetails.pagamentos?.por_meio?.map((item: ClosurePagamentoPorMeio, idx: number) => {
                                                        const diff = item.sobra > 0 ? item.sobra : (item.falta > 0 ? -item.falta : 0);
                                                        const showOrigins = item.origin_loja_inferred > 0;
                                                        const paymentVisual = getPaymentVisual(item.meio_pagamento || '');
                                                        const PaymentIcon = paymentVisual.icon;

                                                        return (
                                                            <React.Fragment key={idx}>
                                                                {/* Main row */}
                                                                <TableRow>
                                                                    <TableCell className="font-medium py-2">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn(
                                                                                "h-6 px-2 py-0.5 gap-1.5 border text-[11px]",
                                                                                paymentVisual.badgeClass,
                                                                            )}
                                                                        >
                                                                            <PaymentIcon className={cn("h-3.5 w-3.5", paymentVisual.iconClass)} />
                                                                            {paymentVisual.label}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right py-2">
                                                                        {formatCurrency(item.entries_expected)}
                                                                    </TableCell>
                                                                    <TableCell className="text-right py-2">
                                                                        {formatCurrency(item.declarado)}
                                                                    </TableCell>
                                                                    <TableCell className="text-right py-2">
                                                                        {diff !== 0 ? (
                                                                            <span className={cn(
                                                                                "font-bold",
                                                                                diff > 0
                                                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                                                    : "text-red-600 dark:text-red-400"
                                                                            )}>
                                                                                {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>

                                                                {/* Origin sub-rows (only when both channels present) */}
                                                                {showOrigins && (
                                                                    <>
                                                                        <TableRow className="bg-muted/20 border-0">
                                                                            <TableCell className="pl-6 py-1.5 text-xs text-muted-foreground">
                                                                                ↳ Hiper Caixa
                                                                            </TableCell>
                                                                            <TableCell className="text-right py-1.5 text-xs text-muted-foreground">
                                                                                {formatCurrency(item.origin_caixa_system)}
                                                                            </TableCell>
                                                                            <TableCell />
                                                                            <TableCell />
                                                                        </TableRow>
                                                                        <TableRow className="bg-muted/20 border-0">
                                                                            <TableCell className="pl-6 py-1.5 text-xs text-muted-foreground">
                                                                                ↳ Hiper Loja
                                                                            </TableCell>
                                                                            <TableCell className="text-right py-1.5 text-xs text-muted-foreground">
                                                                                {formatCurrency(item.origin_loja_inferred)}
                                                                            </TableCell>
                                                                            <TableCell />
                                                                            <TableCell />
                                                                        </TableRow>
                                                                    </>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* ── Summary Cards ── */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                                            <BarChart3 className="h-4 w-4" />
                                            Resumo
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <SummaryCard
                                                label="Entradas no Sistema"
                                                value={closureDetails.totais.entries_expected}
                                            />
                                            <SummaryCard
                                                label="Valores Lançados"
                                                value={closureDetails.totais.declarado}
                                            />
                                            <SummaryCard
                                                label="Falta de Caixa"
                                                value={closureDetails.totais.falta}
                                                variant={closureDetails.totais.falta > 0 ? "destructive" : "default"}
                                            />
                                            <SummaryCard
                                                label="Sobra de Caixa"
                                                value={closureDetails.totais.sobra}
                                                variant={closureDetails.totais.sobra > 0 ? "success" : "default"}
                                            />
                                        </div>

                                        {/* Consistency Badge */}
                                        <div className="flex justify-center pt-2">
                                            {closureDetails.totais.declared_consistent ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Valores consistentes
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="gap-1.5">
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Valores declarados divergentes entre canais
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Não foi possível carregar os detalhes do fechamento.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

// ── Helper Components ──

const InfoItem: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode }> = ({
    icon: Icon, label, value,
}) => (
    <div className="flex items-start gap-2 bg-muted/20 rounded-lg p-2.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">{label}</p>
            <div className="text-sm font-medium">{value}</div>
        </div>
    </div>
);

const SummaryCard: React.FC<{
    label: string;
    value: number;
    variant?: 'default' | 'destructive' | 'success';
}> = ({ label, value, variant = 'default' }) => {
    const borderClass =
        variant === 'destructive' && value > 0
            ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
            : variant === 'success' && value > 0
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border bg-muted/30';

    const valueClass =
        variant === 'destructive' && value > 0
            ? 'text-red-600 dark:text-red-400'
            : variant === 'success' && value > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : '';

    return (
        <div className={cn("p-3 rounded-lg border", borderClass)}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={cn("text-lg font-bold", valueClass)}>
                {formatCurrency(value)}
            </p>
        </div>
    );
};
