/**
 * Factory Order Detail Page
 * 
 * Factory portal page to view order details, accept orders, and dispatch.
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    Factory,
    Calendar,
    DollarSign,
    Truck,
    CheckCircle,
    Clock,
    Download,
    Loader2,
    Image as ImageIcon,
    User,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { PedidoProducaoStatus, ProducaoTimeline } from '@/components/producao';
import {
    useFabricaPedido,
    useAcceptPedido,
    useDispatchPedido,
} from '@/hooks/api/use-fabrica';
import { fabricaService } from '@/services/fabrica.service';
import { PRODUCAO_STATUS } from '@/types/producao.types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

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

export function FabricaPedidoDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const pedidoId = Number(id);

    // Form states
    const [factoryTotal, setFactoryTotal] = useState('');
    const [factoryNotes, setFactoryNotes] = useState('');
    const [trackingCode, setTrackingCode] = useState('');
    const [dispatchNotes, setDispatchNotes] = useState('');

    const { data: pedido, isLoading, error } = useFabricaPedido(pedidoId);
    const acceptPedido = useAcceptPedido();
    const dispatchPedido = useDispatchPedido();

    const handleAccept = async () => {
        const total = parseFloat(factoryTotal.replace(',', '.'));
        if (isNaN(total) || total <= 0) {
            toast.error('Informe um valor válido');
            return;
        }

        await acceptPedido.mutateAsync({
            id: pedidoId,
            data: {
                factory_total: total,
                factory_notes: factoryNotes || undefined,
            },
        });
    };

    const handleDispatch = async () => {
        await dispatchPedido.mutateAsync({
            id: pedidoId,
            data: {
                tracking_code: trackingCode || undefined,
                factory_notes: dispatchNotes || undefined,
            },
        });
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
                <Button variant="outline" onClick={() => navigate('/fabrica/pedidos')}>
                    Voltar para lista
                </Button>
            </div>
        );
    }

    const isWaitingAccept = pedido.status === PRODUCAO_STATUS.ENCOMENDA_REALIZADA;
    const isWaitingDispatch = pedido.status === PRODUCAO_STATUS.PEDIDO_ACEITO;
    const isDispatched = pedido.status === PRODUCAO_STATUS.PEDIDO_DESPACHADO;
    const isReceived = pedido.status === PRODUCAO_STATUS.RECEBIDO;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/fabrica/pedidos">
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
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <PedidoProducaoStatus status={pedido.status} size="lg" />
                            {isWaitingAccept && (
                                <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Aguardando seu aceite
                                </span>
                            )}
                            {isDispatched && (
                                <span className="text-sm text-indigo-600 font-medium flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Aguardando confirmação de recebimento
                                </span>
                            )}
                        </div>

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
                                <p className="text-sm text-muted-foreground">Valor Definido</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(pedido.factory_total)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Data do Pedido</p>
                                <p className="text-sm font-medium">
                                    {formatDate(pedido.created_at)}
                                </p>
                            </div>
                        </div>

                        {/* Observation from admin */}
                        {pedido.observation && (
                            <div className="pt-4 border-t">
                                <div className="flex gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Observação do Cliente</p>
                                        <p className="text-sm text-muted-foreground">{pedido.observation}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tracking code if dispatched */}
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
                </CardContent>
            </Card>

            {/* Accept Form */}
            {isWaitingAccept && (
                <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-400">
                            <CheckCircle className="h-5 w-5" />
                            Aceitar Pedido
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="factoryTotal" className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    Valor Total do Pedido *
                                </Label>
                                <Input
                                    id="factoryTotal"
                                    type="text"
                                    placeholder="0,00"
                                    value={factoryTotal}
                                    onChange={(e) => setFactoryTotal(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="factoryNotes">Observação (opcional)</Label>
                                <Textarea
                                    id="factoryNotes"
                                    placeholder="Prazo de entrega, observações..."
                                    value={factoryNotes}
                                    onChange={(e) => setFactoryNotes(e.target.value)}
                                    rows={1}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleAccept}
                            disabled={acceptPedido.isPending || !factoryTotal}
                            className="w-full sm:w-auto"
                        >
                            {acceptPedido.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Aceitar Pedido
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Dispatch Form */}
            {isWaitingDispatch && (
                <Card className="border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 dark:border-teal-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-teal-700 dark:text-teal-400">
                            <Truck className="h-5 w-5" />
                            Despachar Pedido
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="trackingCode">Código de Rastreio (opcional)</Label>
                                <Input
                                    id="trackingCode"
                                    type="text"
                                    placeholder="BR123456789"
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dispatchNotes">Observação (opcional)</Label>
                                <Textarea
                                    id="dispatchNotes"
                                    placeholder="Enviado via Sedex..."
                                    value={dispatchNotes}
                                    onChange={(e) => setDispatchNotes(e.target.value)}
                                    rows={1}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleDispatch}
                            disabled={dispatchPedido.isPending}
                            className="w-full sm:w-auto"
                        >
                            {dispatchPedido.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Truck className="h-4 w-4 mr-2" />
                            )}
                            Despachar Pedido
                        </Button>
                    </CardContent>
                </Card>
            )}

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

                                        {/* Download button */}
                                        {item.photo_url && (
                                            <div className="flex-shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    asChild
                                                >
                                                    <a
                                                        href={item.photo_download_url || item.photo_url}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
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

export default FabricaPedidoDetail;
