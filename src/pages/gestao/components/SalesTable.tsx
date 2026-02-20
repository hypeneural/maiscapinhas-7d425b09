import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Loader2, ChevronRight, ChevronLeft, Store as StoreIcon, MessageCircle } from "lucide-react";
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Sale, SalesResponse } from '@/types/sales-history.types';
import { useQuery } from '@tanstack/react-query';
import { getStores } from '@/services/stores.service';

interface SalesTableProps {
    data: SalesResponse | undefined;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onSaleClick: (sale: Sale) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
    data,
    isLoading,
    onPageChange,
    onSaleClick
}) => {
    const { data: stores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => getStores(),
        staleTime: 1000 * 60 * 5,
    });

    const getStoreName = (id: number) => {
        return stores?.find(s => s.id === id)?.name || `Loja #${id}`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data?.data?.length) {
        return (
            <div className="text-center p-8 border rounded-lg bg-card text-muted-foreground">
                Nenhuma venda encontrada com os filtros selecionados.
            </div>
        );
    }

    // Access properties from meta.pagination correctly
    const { current_page, last_page } = data.meta.pagination;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        // If total pages is small, show all
        if (last_page <= maxVisible) {
            for (let i = 1; i <= last_page; i++) pages.push(i);
            return pages;
        }

        // Logic for sliding window with ellipsis
        let start = Math.max(1, current_page - 2);
        let end = Math.min(last_page, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        start = Math.max(1, start);

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < last_page) {
            if (end < last_page - 1) pages.push('...');
            pages.push(last_page);
        }

        return pages;
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data / Turno</TableHead>
                            <TableHead>Loja</TableHead>
                            <TableHead>Operação / NF</TableHead>
                            <TableHead>Vendedor</TableHead>
                            <TableHead className="text-right">Valor Líquido</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.data.map((sale) => (
                            <TableRow
                                key={`${sale.store_id}-${sale.id_operacao}`}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => onSaleClick(sale)}
                            >
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{formatDateTime(sale.data_hora)}</span>
                                        {sale.turno_seq ? (
                                            <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm w-fit mt-0.5">
                                                {sale.turno_seq}º Turno
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground">-</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="truncate max-w-[150px] font-medium text-sm">
                                            {sale.store_pdv_name || sale.store_name || `Loja #${sale.store_id}`}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <Badge variant="outline" className="h-4 px-1 py-0 text-[9px] font-normal border-muted-foreground/30">
                                                ID: {sale.store_id}
                                            </Badge>
                                            {sale.store_pdv_id && (
                                                <span>PDV: {sale.store_pdv_id}</span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-mono text-xs font-medium">#{sale.id_operacao}</span>
                                        <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 font-normal">
                                                {sale.canal === 'HIPER_CAIXA' ? 'PDV' : 'App'}
                                            </Badge>
                                            {sale.fiscal?.nfce?.chave && (
                                                <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" title="Possui Nota Fiscal">
                                                    NF: {sale.fiscal.nfce.numero}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {sale.seller_avatar_url ? (
                                            <img
                                                src={sale.seller_avatar_url}
                                                alt={sale.seller_name}
                                                className="w-8 h-8 rounded-full object-cover border"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                {sale.seller_name?.substring(0, 1) || '?'}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm truncate max-w-[120px]" title={sale.seller_name}>
                                                {sale.seller_name || 'N/A'}
                                            </span>
                                            {sale.seller_whatsapp && (
                                                <a
                                                    href={`https://wa.me/${sale.seller_whatsapp}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-[10px] text-green-600 hover:underline flex items-center gap-0.5"
                                                >
                                                    <MessageCircle className="w-3 h-3" /> WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-bold text-base">
                                    {formatCurrency(sale.total)}
                                </TableCell>
                                <TableCell>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
