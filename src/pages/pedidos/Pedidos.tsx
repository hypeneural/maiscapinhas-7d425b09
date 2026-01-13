/**
 * Pedidos Page
 * 
 * Pedidos list with status badges, filters, pagination, and bulk actions.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    Plus,
    Pencil,
    Trash2,
    Eye,
    User,
    Store,
    Calendar as CalendarIcon,
    Filter,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import { BulkActionBar } from '@/components/BulkActionBar';
import {
    usePedidos,
    useDeletePedido,
    useBulkPedidoStatus,
} from '@/hooks/api/use-pedidos';
import { useAuth } from '@/contexts/AuthContext';
import { getStatusColorClasses, PEDIDO_STATUS_OPTIONS } from '@/lib/constants/status.constants';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Pedido, PedidoFilters, PedidoStatus } from '@/types/pedidos.types';

const Pedidos: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.is_super_admin || user?.stores?.some((s) => s.role === 'admin');

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [confirmDelete, setConfirmDelete] = useState<Pedido | null>(null);

    // Advanced filters
    const [statusFilter, setStatusFilter] = useState<PedidoStatus | 'all'>('all');
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

    // Build filters object
    const filters: PedidoFilters = {
        keyword: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        initial_date: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        final_date: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
        page,
        per_page: 25,
    };

    const { data: pedidosData, isLoading } = usePedidos(filters);
    const deleteMutation = useDeletePedido();
    const bulkStatusMutation = useBulkPedidoStatus();

    const pedidos = pedidosData?.data || [];

    // Selection handlers
    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedIds(pedidos.map((p) => p.id));
        } else {
            setSelectedIds([]);
        }
    }, [pedidos]);

    const handleSelectOne = useCallback((id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((i) => i !== id));
        }
    }, []);

    const handleBulkStatusChange = async (ids: number[], status: number) => {
        await bulkStatusMutation.mutateAsync({ ids, status: status as 1 | 2 | 3 | 4 | 5 });
    };

    const columns: Column<Pedido>[] = [
        // Checkbox column for admin
        ...(isAdmin
            ? [
                {
                    key: 'select' as keyof Pedido,
                    label: (
                        <Checkbox
                            checked={
                                pedidos.length > 0 &&
                                selectedIds.length === pedidos.length
                            }
                            onCheckedChange={handleSelectAll}
                        />
                    ) as unknown as string,
                    render: (_: unknown, pedido: Pedido) => (
                        <Checkbox
                            checked={selectedIds.includes(pedido.id)}
                            onCheckedChange={(checked) =>
                                handleSelectOne(pedido.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                        />
                    ),
                } as Column<Pedido>,
            ]
            : []),
        {
            key: 'id',
            label: 'ID',
            render: (_, pedido) => (
                <Badge variant="outline" className="font-mono">
                    #{pedido.id}
                </Badge>
            ),
        },
        {
            key: 'selected_product',
            label: 'Pedido',
            render: (_, pedido) => (
                <div className="space-y-1">
                    <p className="font-medium">{pedido.selected_product}</p>
                    {pedido.obs && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {pedido.obs}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'customer',
            label: 'Cliente',
            render: (_, pedido) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{pedido.customer?.name || '-'}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_, pedido) => (
                <Badge
                    variant="outline"
                    className={cn('border', getStatusColorClasses(pedido.status_color))}
                >
                    {pedido.status_label}
                </Badge>
            ),
        },
        {
            key: 'store',
            label: 'Loja',
            render: (_, pedido) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="h-4 w-4" />
                    <span>{pedido.store?.name || '-'}</span>
                </div>
            ),
        },
        {
            key: 'created_at',
            label: 'Data',
            render: (_, pedido) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                        {format(parseISO(pedido.created_at), 'dd/MM/yyyy')}
                    </span>
                </div>
            ),
        },
    ];

    const getRowActions = (pedido: Pedido): RowAction<Pedido>[] => [
        {
            label: 'Ver Detalhes',
            icon: <Eye className="h-4 w-4" />,
            onClick: (p) => navigate(`/pedidos/${p.id}`),
        },
        {
            label: 'Editar',
            icon: <Pencil className="h-4 w-4" />,
            onClick: (p) => navigate(`/pedidos/${p.id}/editar`),
        },
        {
            label: 'Excluir',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (p) => setConfirmDelete(p),
            variant: 'destructive',
            separator: true,
        },
    ];

    const handleDelete = async () => {
        if (confirmDelete) {
            await deleteMutation.mutateAsync(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Pedidos"
                description="Gerencie solicitações de produtos"
                icon={ClipboardList}
            />

            {/* Filters Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Input
                            placeholder="Buscar por ID, cliente, produto..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-[280px] pl-4"
                        />
                    </div>

                    {/* Status Filter */}
                    <Select
                        value={statusFilter.toString()}
                        onValueChange={(v) => {
                            setStatusFilter(v === 'all' ? 'all' : Number(v) as PedidoStatus);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            {PEDIDO_STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value.toString()}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Date Range Filter */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-[200px] justify-start text-left font-normal',
                                    !dateRange.from && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, 'dd/MM', { locale: ptBR })} - {format(dateRange.to, 'dd/MM', { locale: ptBR })}
                                        </>
                                    ) : (
                                        format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                                    )
                                ) : (
                                    'Período'
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                selected={dateRange as { from: Date; to: Date }}
                                onSelect={(range) => {
                                    setDateRange(range || {});
                                    setPage(1);
                                }}
                                locale={ptBR}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Clear Filters */}
                    {(statusFilter !== 'all' || dateRange.from || search) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setStatusFilter('all');
                                setDateRange({});
                                setSearch('');
                                setPage(1);
                            }}
                            className="h-9 px-3 gap-1 text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                            Limpar
                        </Button>
                    )}
                </div>

                <Button onClick={() => navigate('/pedidos/novo')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Pedido
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Lista de Pedidos
                    </CardTitle>
                    <CardDescription>
                        {pedidosData?.meta?.total || 0} pedidos cadastrados
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={pedidos}
                        columns={columns}
                        loading={isLoading}
                        getRowKey={(p) => p.id}
                        pagination={pedidosData?.meta}
                        onPageChange={setPage}
                        actions={getRowActions}
                        emptyMessage="Nenhum pedido encontrado"
                        emptyIcon={<ClipboardList className="h-12 w-12 text-muted-foreground" />}
                    />
                </CardContent>
            </Card>

            {/* Bulk action bar (admin only) */}
            {isAdmin && (
                <BulkActionBar
                    selectedIds={selectedIds}
                    onClearSelection={() => setSelectedIds([])}
                    onStatusChange={handleBulkStatusChange}
                    statusOptions={PEDIDO_STATUS_OPTIONS}
                    type="pedido"
                />
            )}

            <ConfirmDialog
                open={!!confirmDelete}
                onOpenChange={() => setConfirmDelete(null)}
                title="Excluir Pedido"
                description={
                    <p>
                        Tem certeza que deseja excluir o pedido{' '}
                        <strong>{confirmDelete?.selected_product}</strong>?
                        <br />
                        <span className="text-muted-foreground text-sm">
                            Esta ação não pode ser desfeita.
                        </span>
                    </p>
                }
                confirmText="Excluir"
                onConfirm={handleDelete}
                loading={deleteMutation.isPending}
                variant="destructive"
            />
        </div>
    );
};

export default Pedidos;
