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
    MessageSquare,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { PEDIDO_STATUS_OPTIONS, PEDIDO_STATUS, getStatusColorClasses } from '@/lib/constants/status.constants';
import type { PedidoStatus } from '@/types/pedidos.types';
import { toast } from 'sonner';

const PedidoDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const pedidoId = id ? parseInt(id, 10) : 0;

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);

    const { data: pedido, isLoading } = usePedido(pedidoId);
    const deleteMutation = useDeletePedido();
    const updateStatusMutation = useUpdatePedidoStatus();

    const handleDelete = async () => {
        await deleteMutation.mutateAsync(pedidoId);
        navigate('/pedidos');
    };

    /**
     * Handle status change button click
     * If status 3 (Disponível na Loja) is selected, open WhatsApp notification modal
     * Otherwise, update status directly
     */
    const handleStatusChangeClick = () => {
        if (!newStatus) return;
        const statusValue = parseInt(newStatus, 10);

        // If status is "Disponível na Loja", show WhatsApp notification modal
        if (statusValue === PEDIDO_STATUS.DISPONIVEL_LOJA) {
            setIsWhatsAppModalOpen(true);
        } else {
            handleStatusChange(false);
        }
    };

    /**
     * Perform the actual status change
     */
    const handleStatusChange = async (shouldNotifyWhatsApp: boolean = false) => {
        if (!newStatus) return;

        const statusValue = parseInt(newStatus, 10) as PedidoStatus;

        try {
            const response = await updateStatusMutation.mutateAsync({
                id: pedidoId,
                data: {
                    status: statusValue,
                    notify_whatsapp: statusValue === PEDIDO_STATUS.DISPONIVEL_LOJA ? shouldNotifyWhatsApp : undefined,
                },
            });

            // Handle feedback based on notification result
            if (response.whatsapp_notification) {
                if (response.whatsapp_notification.sent) {
                    toast.success(
                        `Status atualizado! Notificação enviada para ${response.whatsapp_notification.phone}`,
                        { duration: 5000 }
                    );
                } else {
                    toast.warning(
                        `Status atualizado, mas notificação não enviada: ${response.whatsapp_notification.error}`,
                        { duration: 5000 }
                    );
                }
            } else {
                toast.success(`Status alterado para "${response.data.status_label}"`);
            }

            setNewStatus('');
            setIsWhatsAppModalOpen(false);
            setNotifyWhatsApp(true); // Reset for next time
        } catch (error) {
            // Error is handled by the mutation's onError
        }
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
                            onClick={handleStatusChangeClick}
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

            {/* WhatsApp Notification Modal */}
            <Dialog open={isWhatsAppModalOpen} onOpenChange={setIsWhatsAppModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                            Alterar Status do Pedido
                        </DialogTitle>
                        <DialogDescription>
                            Você está alterando o status para <strong>"Disponível na Loja"</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Customer info */}
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{pedido?.customer?.name || 'Cliente'}</span>
                            </div>
                            {pedido?.customer?.phone ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Smartphone className="h-4 w-4" />
                                    <span>{pedido.customer.phone}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-amber-600 mt-1">
                                    <Smartphone className="h-4 w-4" />
                                    <span>Cliente não possui telefone cadastrado</span>
                                </div>
                            )}
                        </div>

                        {/* Notify checkbox */}
                        <div className="flex items-start gap-3 p-3 border rounded-lg">
                            <Checkbox
                                id="notify_whatsapp"
                                checked={notifyWhatsApp}
                                onCheckedChange={(checked) => setNotifyWhatsApp(checked as boolean)}
                                disabled={!pedido?.customer?.phone}
                            />
                            <div className="flex-1">
                                <Label
                                    htmlFor="notify_whatsapp"
                                    className={cn(
                                        "font-medium cursor-pointer",
                                        !pedido?.customer?.phone && "text-muted-foreground"
                                    )}
                                >
                                    Notificar cliente por WhatsApp
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Será enviada uma mensagem informando que o pedido está pronto para retirada.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsWhatsAppModalOpen(false);
                                setNotifyWhatsApp(true); // Reset
                            }}
                            disabled={updateStatusMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => handleStatusChange(notifyWhatsApp && !!pedido?.customer?.phone)}
                            disabled={updateStatusMutation.isPending}
                            className="gap-2"
                        >
                            {updateStatusMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {notifyWhatsApp && pedido?.customer?.phone ? (
                                <>
                                    <MessageSquare className="h-4 w-4" />
                                    Confirmar e Notificar
                                </>
                            ) : (
                                'Confirmar Alteração'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PedidoDetail;
