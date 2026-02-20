import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingBag, CreditCard, User, Box, FileText, Key } from "lucide-react";
import { getSaleDetails } from '@/services/reports.service';
import { getStores } from '@/services/stores.service';
import { resolveStoreIdentifierForReports } from '@/lib/store-identifiers';
import type { Sale } from '@/types/sales-history.types';
import { formatCurrency, formatDateTime } from '@/lib/format';

interface SaleDetailsSheetProps {
    sale: Sale | null;
    isOpen: boolean;
    onClose: () => void;
}

export const SaleDetailsSheet: React.FC<SaleDetailsSheetProps> = ({
    sale,
    isOpen,
    onClose
}) => {
    const { data: stores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => getStores(),
        staleTime: 1000 * 60 * 5,
    });
    const resolvedStoreId = resolveStoreIdentifierForReports(sale?.store_id, stores);

    const { data: detailsData, isLoading } = useQuery({
        queryKey: ['sale-details', resolvedStoreId ?? sale?.store_id, sale?.id_operacao, sale?.canal],
        queryFn: () => {
            if (!sale) throw new Error("Sale not selected");
            return getSaleDetails(resolvedStoreId ?? sale.store_id, sale.id_operacao, sale.canal);
        },
        enabled: !!sale && isOpen,
    });

    const items = detailsData?.data.itens || [];
    const payments = detailsData?.data.pagamentos || [];

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Detalhes da Venda</SheetTitle>
                    <SheetDescription>
                        Operação #{sale?.id_operacao} - {sale?.data_hora && formatDateTime(sale.data_hora)}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Box className="h-3 w-3" />
                                        {sale?.canal === 'HIPER_CAIXA' ? 'PDV / Caixa' : 'Retaguarda / App'}
                                    </Badge>
                                    {sale?.turno_seq && (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">
                                            Turno {sale.turno_seq}º
                                        </Badge>
                                    )}
                                </div>
                                {sale?.turno_seq && (
                                    <p className="text-xs text-muted-foreground">
                                        do dia {sale?.data_hora && format(new Date(sale.data_hora), "dd/MM")}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-muted-foreground">Valor Total</p>
                                <p className="text-xl font-bold text-primary">
                                    {formatCurrency(sale?.total || 0)}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Items Section */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                Itens ({items.length})
                            </h3>
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="text-right">Qtd</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="py-3 align-top">
                                                    <div className="font-medium text-sm">{item.nome_produto}</div>
                                                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                        {item.codigo_barras}
                                                    </div>
                                                    {item.vendedor_nome && (
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 bg-muted/40 p-1 rounded w-fit">
                                                            {item.vendedor_avatar_url ? (
                                                                <img src={item.vendedor_avatar_url} className="w-4 h-4 rounded-full" />
                                                            ) : (
                                                                <User className="h-3 w-3" />
                                                            )}
                                                            <span className="truncate max-w-[120px]">{item.vendedor_nome}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-3 align-top whitespace-nowrap">
                                                    {item.desconto && item.desconto > 0 ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs text-muted-foreground line-through">
                                                                {formatCurrency((item.total + item.desconto) / item.qtd)}
                                                            </span>
                                                            <span className="font-medium text-sm">
                                                                {formatCurrency(item.preco_unit)}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                {item.qtd} x {formatCurrency(item.preco_unit)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-medium text-sm">
                                                                {formatCurrency(item.preco_unit)}
                                                            </span>
                                                            {item.qtd > 1 && (
                                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                    {item.qtd} x {formatCurrency(item.preco_unit)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right py-3 align-top font-bold text-sm">
                                                    {formatCurrency(item.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Fiscal & Technical Section */}
                        {(sale?.fiscal?.nfce?.chave || sale?.erp_operacao_uuid) && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Dados Fiscais e Técnicos
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-md border border-dashed">
                                        {sale?.fiscal?.nfce?.chave && (
                                            <div className="col-span-2 space-y-1">
                                                <p className="text-xs text-muted-foreground font-medium uppercase">Chave de Acesso NFC-e</p>
                                                <div className="font-mono text-xs break-all bg-background border p-2 rounded flex items-center gap-2">
                                                    <Key className="h-3 w-3 text-muted-foreground" />
                                                    {sale.fiscal.nfce.chave}
                                                </div>
                                            </div>
                                        )}
                                        {sale?.fiscal?.nfce?.numero && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground font-medium uppercase">Número / Série</p>
                                                <p className="font-mono">{sale.fiscal.nfce.numero} - Série {sale.fiscal.nfce.serie}</p>
                                            </div>
                                        )}
                                        {sale?.fiscal?.cliente_cpf && (
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground font-medium uppercase">CPF Cliente</p>
                                                <p className="font-mono">{sale.fiscal.cliente_cpf}</p>
                                            </div>
                                        )}
                                        {sale?.erp_operacao_uuid && (
                                            <div className="col-span-2 space-y-1 pt-2 border-t border-dashed">
                                                <p className="text-xs text-muted-foreground font-medium uppercase">UUID Operação (Global)</p>
                                                <p className="font-mono text-xs text-muted-foreground">{sale.erp_operacao_uuid}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Payments Section */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Pagamentos
                            </h3>
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Forma</TableHead>
                                            <TableHead className="text-center">Parc.</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="py-2">{payment.meio_pagamento}</TableCell>
                                                <TableCell className="text-center py-2">
                                                    {payment.parcelas > 1 ? `${payment.parcelas}x` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right py-2 font-medium">
                                                    {formatCurrency(payment.valor)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
