/**
 * Pedido Detail Page
 * 
 * View pedido details with status timeline and actions.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    ClipboardList,
    User,
    Store,
    Calendar,
    Smartphone,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/crud';
import { StatusTimeline } from '@/components/StatusTimeline';
import {
    usePedido,
    useDeletePedido,
    useUpdatePedidoStatus,
} from '@/hooks/api/use-pedidos';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PEDIDO_STATUS_OPTIONS, getStatusColorClasses } from '@/lib/constants/status.constants';
import type { PedidoStatus } from '@/types/pedidos.types';

const PedidoDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const pedidoId = id ? parseInt(id, 10) : 0;

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');

    const { data: pedido, isLoading } = usePedido(pedidoId);
    const deleteMutation = useDeletePedido();
    const updateStatusMutation = useUpdatePedidoStatus();

    const handleDelete = async () => {
        await deleteMutation.mutateAsync(pedidoId);
        navigate('/pedidos');
    };

    const handleStatusChange = async () => {
        if (!newStatus) return;
        await updateStatusMutation.mutateAsync({
            id: pedidoId,
            data: { status: parseInt(newStatus, 10) as PedidoStatus },
        });
        setNewStatus('');
    };

    const formatDate = (dateString: string) => {
        try {
            return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
            });
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!pedido) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Pedido não encontrado</p>
                <Button variant="link" onClick={() => navigate('/pedidos')}>
                    Voltar para lista
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title={`Pedido #${pedido.id}`}
                description={pedido.selected_product}
                icon={ClipboardList}
            />

            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/pedidos')}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para lista
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/pedidos/${pedidoId}/editar`)}
                        className="gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Editar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setConfirmDelete(true)}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Main Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Informações do Pedido</span>
                            <Badge
                                variant="outline"
                                className={cn('border', getStatusColorClasses(pedido.status_color))}
                            >
                                {pedido.status_label}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Produto</p>
                            <p className="text-lg">{pedido.selected_product}</p>
                        </div>

                        {pedido.obs && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Observações
                                </p>
                                <p className="text-sm">{pedido.obs}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                                Criado em {formatDate(pedido.created_at)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer & Store */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cliente & Loja</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Customer */}
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">{pedido.customer?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {pedido.customer?.email}
                                </p>
                                {pedido.customer?.phone && (
                                    <p className="text-sm text-muted-foreground">
                                        {pedido.customer.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Device */}
                        {pedido.customer_device && (
                            <div className="flex items-start gap-3">
                                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">
                                        {pedido.customer_device.display_name}
                                    </p>
                                    {pedido.customer_device.nickname && (
                                        <p className="text-sm text-muted-foreground">
                                            {pedido.customer_device.nickname}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Store */}
                        <div className="flex items-start gap-3">
                            <Store className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">{pedido.store?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {pedido.store?.city}
                                </p>
                            </div>
                        </div>

                        {/* Seller */}
                        {pedido.user && (
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Vendedor</p>
                                    <p className="font-medium">{pedido.user.name}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Change */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Alterar Status
                        </CardTitle>
                        <CardDescription>
                            Atualize o status do pedido
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o novo status" />
                            </SelectTrigger>
                            <SelectContent>
                                {PEDIDO_STATUS_OPTIONS.filter(
                                    (opt) => opt.value !== pedido.status
                                ).map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value.toString()}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    'inline-block h-2 w-2 rounded-full',
                                                    getStatusColorClasses(option.color).split(' ')[0]
                                                )}
                                            />
                                            {option.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleStatusChange}
                            disabled={!newStatus || updateStatusMutation.isPending}
                            className="w-full"
                        >
                            {updateStatusMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirmar Alteração
                        </Button>
                    </CardContent>
                </Card>

                {/* Status History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Status</CardTitle>
                        <CardDescription>
                            Linha do tempo das alterações de status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StatusTimeline history={pedido.status_history || []} />
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation */}
            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Excluir Pedido"
                description={
                    <p>
                        Tem certeza que deseja excluir o pedido{' '}
                        <strong>{pedido.selected_product}</strong>?
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

export default PedidoDetail;
