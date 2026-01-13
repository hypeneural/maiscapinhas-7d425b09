/**
 * Production Orders List Page
 * 
 * Admin page to list and filter production orders.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Eye, Calendar, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { PedidoProducaoStatus, CapasNavTabs } from '@/components/producao';
import { useProducaoPedidos } from '@/hooks/api/use-producao';
import {
    PRODUCAO_STATUS_LABELS,
    type ProducaoPedidoFilters,
    type ProducaoPedido,
} from '@/types/producao.types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatCurrency(value: number | null): string {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    try {
        return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
        return dateString;
    }
}

export function ProducaoPedidos() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<ProducaoPedidoFilters>({
        page: 1,
        per_page: 10,
    });

    const { data, isLoading, error } = useProducaoPedidos(filters);

    const handleFilterChange = (key: keyof ProducaoPedidoFilters, value: unknown) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : (value as number),
        }));
    };

    const clearFilters = () => {
        setFilters({ page: 1, per_page: 10 });
    };

    const hasFilters = filters.status || filters.initial_date || filters.final_date;

    // Loading state
    if (isLoading && !data) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Erro ao carregar pedidos</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Tentar novamente
                </Button>
            </div>
        );
    }

    const pedidos = data?.data || [];
    const pagination = data?.meta;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Capas Personalizadas"
                icon={Factory}
            />
            <CapasNavTabs />

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Status filter */}
                        <div className="w-48 space-y-1.5">
                            <Label className="text-xs">Status</Label>
                            <Select
                                value={filters.status?.toString() || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('status', value === 'all' ? undefined : Number(value))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os status</SelectItem>
                                    {Object.entries(PRODUCAO_STATUS_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date range */}
                        <div className="flex gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Data Inicial</Label>
                                <Input
                                    type="date"
                                    value={filters.initial_date || ''}
                                    onChange={(e) => handleFilterChange('initial_date', e.target.value || undefined)}
                                    className="w-40"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Data Final</Label>
                                <Input
                                    type="date"
                                    value={filters.final_date || ''}
                                    onChange={(e) => handleFilterChange('final_date', e.target.value || undefined)}
                                    className="w-40"
                                />
                            </div>
                        </div>

                        {/* Clear filters */}
                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Limpar filtros
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Orders list */}
            {pedidos.length === 0 ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 text-center">
                    <Factory className="h-16 w-16 text-muted-foreground" />
                    <div className="space-y-2">
                        <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
                        <p className="text-muted-foreground">
                            {hasFilters
                                ? 'Tente ajustar os filtros'
                                : 'Adicione capas ao carrinho e envie para a fábrica'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {pedidos.map((pedido) => (
                        <OrderCard
                            key={pedido.id}
                            pedido={pedido}
                            onClick={() => navigate(`/capas/pedidos/${pedido.id}`)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => handleFilterChange('page', Math.max(1, pagination.current_page - 1))}
                                className={pagination.current_page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        onClick={() => handleFilterChange('page', page)}
                                        isActive={pagination.current_page === page}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => handleFilterChange('page', Math.min(pagination.last_page, pagination.current_page + 1))}
                                className={pagination.current_page === pagination.last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}

// Order Card Component
function OrderCard({ pedido, onClick }: { pedido: ProducaoPedido; onClick: () => void }) {
    return (
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={onClick}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold">Pedido #{pedido.id}</h3>
                            <PedidoProducaoStatus status={pedido.status} size="sm" />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{pedido.total_itens} {pedido.total_itens === 1 ? 'item' : 'itens'}</span>
                            <span>•</span>
                            <span>{pedido.total_qtd} {pedido.total_qtd === 1 ? 'capa' : 'capas'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(pedido.created_at)}
                            </span>
                            {pedido.factory_total && (
                                <>
                                    <span>•</span>
                                    <span className="font-medium text-foreground">
                                        {formatCurrency(pedido.factory_total)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default ProducaoPedidos;
