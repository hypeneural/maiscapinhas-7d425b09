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
    Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import type { Pedido, PedidoFilters } from '@/types/pedidos.types';

const Pedidos: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.is_super_admin || user?.stores?.some((s) => s.role === 'admin');

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [confirmDelete, setConfirmDelete] = useState<Pedido | null>(null);

    const filters: PedidoFilters = {
        keyword: search || undefined,
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
                    <Calendar className="h-4 w-4" />
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

            <div className="flex justify-between items-center">
                <div />
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
                        onSearch={setSearch}
                        searchPlaceholder="Buscar por produto, cliente..."
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
