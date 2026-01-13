/**
 * Production Order Detail Page
 * 
 * Admin page to view production order details, items, timeline, and take actions.
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    Factory,
    Calendar,
    DollarSign,
    Truck,
    CheckCircle,
    XCircle,
    Loader2,
    Image as ImageIcon,
    User,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { PedidoProducaoStatus, ProducaoTimeline } from '@/components/producao';
import {
    useProducaoPedido,
    useReceivePedido,
    useCancelPedido,
} from '@/hooks/api/use-producao';
import { PRODUCAO_STATUS } from '@/types/producao.types';
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
        return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
        return dateString;
    }
}

export function ProducaoPedidoDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const pedidoId = Number(id);

    const { data: pedido, isLoading, error } = useProducaoPedido(pedidoId);
    const receivePedido = useReceivePedido();
    const cancelPedido = useCancelPedido();

    const handleReceive = async () => {
        await receivePedido.mutateAsync({ id: pedidoId });
    };

    const handleCancel = async () => {
        await cancelPedido.mutateAsync({ id: pedidoId });
        navigate('/capas/pedidos');
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Error state
    if (error || !pedido) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Erro ao carregar pedido</p>
                <Button variant="outline" onClick={() => navigate('/capas/pedidos')}>
                    Voltar para lista
                </Button>
            </div>
        );
    }

    const canReceive = pedido.status === PRODUCAO_STATUS.PEDIDO_DESPACHADO;
    const canCancel = pedido.status === PRODUCAO_STATUS.ENCOMENDA_REALIZADA ||
        pedido.status === PRODUCAO_STATUS.PEDIDO_ACEITO;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/capas/pedidos">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader
                    title={`Pedido #${pedido.id}`}
                    icon={Factory}
                />
            </div>

            {/* Status and Summary */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-4">
                            <PedidoProducaoStatus status={pedido.status} size="lg" />

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">Itens</p>
                                    <p className="text-2xl font-bold">{pedido.total_itens}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Capas</p>
                                    <p className="text-2xl font-bold">{pedido.total_qtd}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Valor Fábrica</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(pedido.factory_total)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Criado em</p>
                                    <p className="text-sm font-medium">
                                        {formatDate(pedido.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                            {canReceive && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button disabled={receivePedido.isPending}>
                                            {receivePedido.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                            )}
                                            Marcar como Recebido
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar recebimento?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação irá marcar o pedido como recebido e atualizar
                                                o status de todas as capas para "Disponível na Loja".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleReceive}>
                                                Confirmar Recebimento
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {canCancel && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" disabled={cancelPedido.isPending}>
                                            {cancelPedido.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <XCircle className="h-4 w-4 mr-2" />
                                            )}
                                            Cancelar Pedido
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação irá cancelar o pedido de produção.
                                                As capas voltarão ao status "Encomenda Solicitada".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleCancel}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Cancelar Pedido
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>

                    {/* Observations */}
                    {(pedido.observation || pedido.factory_notes || pedido.tracking_code) && (
                        <div className="mt-6 pt-6 border-t space-y-3">
                            {pedido.observation && (
                                <div className="flex gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Observação</p>
                                        <p className="text-sm text-muted-foreground">{pedido.observation}</p>
                                    </div>
                                </div>
                            )}
                            {pedido.factory_notes && (
                                <div className="flex gap-2">
                                    <Factory className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Notas da Fábrica</p>
                                        <p className="text-sm text-muted-foreground">{pedido.factory_notes}</p>
                                    </div>
                                </div>
                            )}
                            {pedido.tracking_code && (
                                <div className="flex gap-2">
                                    <Truck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Código de Rastreio</p>
                                        <p className="text-sm text-muted-foreground font-mono">{pedido.tracking_code}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Main content grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Items List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="h-5 w-5" />
                                Itens do Pedido ({pedido.items?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pedido.items?.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 p-3 rounded-lg border"
                                    >
                                        {/* Photo */}
                                        <div className="flex-shrink-0">
                                            {item.photo_url ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <button className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
                                                            <img
                                                                src={item.photo_url}
                                                                alt="Foto"
                                                                className="h-16 w-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                            />
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl p-0">
                                                        <img
                                                            src={item.photo_url}
                                                            alt="Foto ampliada"
                                                            className="w-full h-auto rounded-lg"
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center">
                                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="font-medium text-sm truncate">
                                                {item.selected_product || 'Capa Personalizada'}
                                            </p>
                                            {(item.phone_brand || item.phone_model) && (
                                                <p className="text-sm text-muted-foreground">
                                                    {[item.phone_brand, item.phone_model].filter(Boolean).join(' ')}
                                                </p>
                                            )}
                                            {item.customer && (
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {item.customer.name}
                                                </p>
                                            )}
                                            {item.observation && (
                                                <p className="text-sm text-muted-foreground italic">
                                                    "{item.observation}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Quantity */}
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground">Qtd</p>
                                            <p className="font-bold">{item.qty}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Timeline */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="h-5 w-5" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProducaoTimeline events={pedido.timeline || []} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ProducaoPedidoDetail;
