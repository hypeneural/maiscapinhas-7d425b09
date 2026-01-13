/**
 * Capas Personalizadas Page
 * 
 * Capas list with status badges, payment indicators, filters, and bulk actions.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Palette,
    Plus,
    Pencil,
    Trash2,
    Eye,
    User,
    Store,
    Calendar,
    DollarSign,
    Image,
    Send,
    ShoppingCart,
    AlertCircle,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import { BulkActionBar } from '@/components/BulkActionBar';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';
import {
    useCapas,
    useDeleteCapa,
    useBulkCapaStatus,
    useSendToProduction,
} from '@/hooks/api/use-capas';
import { useAddToCart } from '@/hooks/api/use-producao';
import { useAuth } from '@/contexts/AuthContext';
import { getStatusColorClasses, CAPA_STATUS_OPTIONS } from '@/lib/constants/status.constants';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CapaPersonalizada, CapaFilters } from '@/types/capas.types';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CapasNavTabs } from '@/components/producao';

const Capas: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.is_super_admin || user?.stores?.some((s) => s.role === 'admin');

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [confirmDelete, setConfirmDelete] = useState<CapaPersonalizada | null>(null);
    const [previewCapa, setPreviewCapa] = useState<CapaPersonalizada | null>(null);

    const filters: CapaFilters = {
        keyword: search || undefined,
        page,
        per_page: 25,
    };

    const { data: capasData, isLoading } = useCapas(filters);
    const deleteMutation = useDeleteCapa();
    const bulkStatusMutation = useBulkCapaStatus();
    const sendToProductionMutation = useSendToProduction();
    const addToCartMutation = useAddToCart();

    const capas = capasData?.data || [];

    // Check if capa is eligible for cart (status=1 "Encomenda Solicitada" and has photo)
    const isEligibleForCart = (capa: CapaPersonalizada) => {
        return capa.status === 1 && !!capa.photo_url;
    };

    // Count eligible items in current selection
    const eligibleForCart = capas
        .filter((c) => selectedIds.includes(c.id) && isEligibleForCart(c))
        .length;

    // Selection handlers
    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedIds(capas.map((c) => c.id));
        } else {
            setSelectedIds([]);
        }
    }, [capas]);

    const handleSelectOne = useCallback((id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((i) => i !== id));
        }
    }, []);

    const handleBulkStatusChange = async (ids: number[], status: number) => {
        await bulkStatusMutation.mutateAsync({
            ids,
            status: status as 1 | 2 | 3 | 4 | 5 | 6,
        });
    };

    const handleSendToProduction = async (ids: number[], date: string) => {
        await sendToProductionMutation.mutateAsync({
            ids,
            sended_to_production_at: date,
        });
    };

    const handleAddToCart = async (ids: number[]) => {
        const result = await addToCartMutation.mutateAsync(ids);
        return {
            added: result.data.added_count,
            blocked: result.data.blocked_count,
        };
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const columns: Column<CapaPersonalizada>[] = [
        // Checkbox column for admin
        ...(isAdmin
            ? [
                {
                    key: 'select' as keyof CapaPersonalizada,
                    label: (
                        <Checkbox
                            checked={capas.length > 0 && selectedIds.length === capas.length}
                            onCheckedChange={handleSelectAll}
                        />
                    ) as unknown as string,
                    render: (_: unknown, capa: CapaPersonalizada) => {
                        const eligible = isEligibleForCart(capa);
                        const isSelected = selectedIds.includes(capa.id);

                        return (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) =>
                                                    handleSelectOne(capa.id, checked as boolean)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                                className={cn(
                                                    'transition-all',
                                                    isSelected && !eligible && 'border-amber-500 data-[state=checked]:bg-amber-500'
                                                )}
                                            />
                                            {isSelected && !eligible && (
                                                <div className="absolute -top-1 -right-1">
                                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                                </div>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    {!eligible && (
                                        <TooltipContent side="right" className="max-w-xs">
                                            <div className="flex items-center gap-2">
                                                <Info className="h-4 w-4 text-amber-500" />
                                                <span>
                                                    {!capa.photo_url
                                                        ? 'Sem foto - não pode ser adicionada ao carrinho'
                                                        : capa.status !== 1
                                                            ? `Status "${capa.status_label}" - não pode ser adicionada ao carrinho`
                                                            : 'Não elegível para carrinho'}
                                                </span>
                                            </div>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        );
                    },
                } as Column<CapaPersonalizada>,
            ]
            : []),
        {
            key: 'photo_url',
            label: '',
            render: (_, capa) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setPreviewCapa(capa);
                    }}
                    className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                >
                    {capa.photo_url ? (
                        <img
                            src={capa.photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Image className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
            ),
        },
        {
            key: 'selected_product',
            label: 'Produto',
            render: (_, capa) => (
                <div className="space-y-1">
                    <p className="font-medium">{capa.selected_product}</p>
                    {capa.product_reference && (
                        <p className="text-xs text-muted-foreground">
                            Ref: {capa.product_reference}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'customer',
            label: 'Cliente',
            render: (_, capa) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{capa.customer?.name || '-'}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_, capa) => (
                <Badge
                    variant="outline"
                    className={cn('border', getStatusColorClasses(capa.status_color))}
                >
                    {capa.status_label}
                </Badge>
            ),
        },
        {
            key: 'total',
            label: 'Total',
            render: (_, capa) => (
                <div className="space-y-1">
                    <p className="font-medium">{formatCurrency(capa.total)}</p>
                    <p className="text-xs text-muted-foreground">
                        {capa.qty}x {formatCurrency(capa.price)}
                    </p>
                </div>
            ),
        },
        {
            key: 'payed',
            label: 'Pago',
            render: (_, capa) => (
                <div className="flex items-center gap-2">
                    <DollarSign
                        className={cn(
                            'h-4 w-4',
                            capa.payed ? 'text-emerald-600' : 'text-amber-500'
                        )}
                    />
                    <Badge variant={capa.payed ? 'default' : 'outline'}>
                        {capa.payed ? 'Pago' : 'Pendente'}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'created_at',
            label: 'Data',
            render: (_, capa) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(parseISO(capa.created_at), 'dd/MM/yyyy')}</span>
                </div>
            ),
        },
    ];

    const getRowActions = (capa: CapaPersonalizada): RowAction<CapaPersonalizada>[] => [
        {
            label: 'Ver Detalhes',
            icon: <Eye className="h-4 w-4" />,
            onClick: (c) => navigate(`/capas/${c.id}`),
        },
        {
            label: 'Editar',
            icon: <Pencil className="h-4 w-4" />,
            onClick: (c) => navigate(`/capas/${c.id}/editar`),
        },
        {
            label: 'Excluir',
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (c) => setConfirmDelete(c),
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
                title="Capas Personalizadas"
                description="Gerencie capas personalizadas e encomendas"
                icon={Palette}
            />

            <CapasNavTabs />

            <div className="flex justify-between items-center">
                <div />
                <Button onClick={() => navigate('/capas/novo')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Capa
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Lista de Capas
                    </CardTitle>
                    <CardDescription>
                        {capasData?.meta?.total || 0} capas cadastradas
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={capas}
                        columns={columns}
                        loading={isLoading}
                        getRowKey={(c) => c.id}
                        onSearch={setSearch}
                        searchPlaceholder="Buscar por produto, referência, cliente..."
                        pagination={capasData?.meta}
                        onPageChange={setPage}
                        actions={getRowActions}
                        emptyMessage="Nenhuma capa encontrada"
                        emptyIcon={<Palette className="h-12 w-12 text-muted-foreground" />}
                    />
                </CardContent>
            </Card>

            {/* Bulk action bar (admin only) */}
            {isAdmin && (
                <BulkActionBar
                    selectedIds={selectedIds}
                    onClearSelection={() => setSelectedIds([])}
                    onStatusChange={handleBulkStatusChange}
                    onSendToProduction={handleSendToProduction}
                    onAddToCart={handleAddToCart}
                    eligibleForCart={eligibleForCart}
                    statusOptions={CAPA_STATUS_OPTIONS}
                    type="capa"
                />
            )}

            <ConfirmDialog
                open={!!confirmDelete}
                onOpenChange={() => setConfirmDelete(null)}
                title="Excluir Capa"
                description={
                    <p>
                        Tem certeza que deseja excluir a capa{' '}
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

            {/* Image Preview Modal */}
            <ImagePreviewModal
                open={!!previewCapa}
                onOpenChange={() => setPreviewCapa(null)}
                capa={previewCapa}
                onViewDetails={() => {
                    if (previewCapa) {
                        navigate(`/capas/${previewCapa.id}`);
                    }
                }}
            />
        </div>
    );
};

export default Capas;
