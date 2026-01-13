/**
 * Capa Detail Page
 * 
 * View capa details with photo, payment info, and status actions.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Palette,
    User,
    Store,
    Calendar,
    Smartphone,
    Loader2,
    RefreshCw,
    DollarSign,
    Image,
    Package,
    CreditCard,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/crud';
import {
    useCapa,
    useDeleteCapa,
    useUpdateCapaStatus,
    useRegisterPayment,
} from '@/hooks/api/use-capas';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CAPA_STATUS_OPTIONS, getStatusColorClasses } from '@/lib/constants/status.constants';
import type { CapaStatus } from '@/types/capas.types';

const CapaDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const capaId = id ? parseInt(id, 10) : 0;

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [newStatus, setNewStatus] = useState<string>('');
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({
        payed: true,
        payday: format(new Date(), 'yyyy-MM-dd'),
    });

    const { data: capa, isLoading } = useCapa(capaId);
    const deleteMutation = useDeleteCapa();
    const updateStatusMutation = useUpdateCapaStatus();
    const registerPaymentMutation = useRegisterPayment();

    const handleDelete = async () => {
        await deleteMutation.mutateAsync(capaId);
        navigate('/capas');
    };

    const handleStatusChange = async () => {
        if (!newStatus) return;
        await updateStatusMutation.mutateAsync({
            id: capaId,
            data: { status: parseInt(newStatus, 10) as CapaStatus },
        });
        setNewStatus('');
    };

    const handlePayment = async () => {
        await registerPaymentMutation.mutateAsync({
            id: capaId,
            data: paymentData,
        });
        setIsPaymentDialogOpen(false);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
            });
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!capa) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Capa não encontrada</p>
                <Button variant="link" onClick={() => navigate('/capas')}>
                    Voltar para lista
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title={`Capa #${capa.id}`}
                description={capa.selected_product}
                icon={Palette}
            />

            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/capas')}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para lista
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/capas/${capaId}/editar`)}
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
                {/* Photo */}
                <Card className="md:row-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="h-5 w-5" />
                            Foto da Capa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {capa.photo_url ? (
                            <img
                                src={capa.photo_url}
                                alt={capa.selected_product}
                                className="w-full rounded-lg border object-contain bg-muted"
                                style={{ maxHeight: '400px' }}
                            />
                        ) : (
                            <div className="w-full h-64 bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                                <Image className="h-12 w-12 mb-2" />
                                <span>Sem foto</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Product Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Informações do Produto
                            </div>
                            <Badge
                                variant="outline"
                                className={cn('border', getStatusColorClasses(capa.status_color))}
                            >
                                {capa.status_label}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Produto</p>
                            <p className="text-lg">{capa.selected_product}</p>
                        </div>

                        {capa.product_reference && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Referência
                                </p>
                                <p>{capa.product_reference}</p>
                            </div>
                        )}

                        {capa.obs && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Observações
                                </p>
                                <p className="text-sm">{capa.obs}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                                Criado em {formatDate(capa.created_at)}
                            </span>
                        </div>

                        {capa.sended_to_production_at && (
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                <span className="text-sm text-purple-600">
                                    Enviado para produção em {formatDate(capa.sended_to_production_at)}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pricing & Payment */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Financeiro
                            </div>
                            <Badge variant={capa.payed ? 'default' : 'outline'}>
                                {capa.payed ? 'Pago' : 'Pendente'}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold">{capa.qty}</p>
                                <p className="text-xs text-muted-foreground">Quantidade</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(capa.price)}</p>
                                <p className="text-xs text-muted-foreground">Preço Unit.</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(capa.total)}
                                </p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>

                        {capa.payed && (
                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm text-emerald-600">
                                    <DollarSign className="h-4 w-4" />
                                    Pago em {formatDate(capa.payday)}
                                    {capa.received_by && (
                                        <span className="text-muted-foreground">
                                            • Recebido por {capa.received_by.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {!capa.payed && (
                            <Button
                                onClick={() => setIsPaymentDialogOpen(true)}
                                className="w-full gap-2"
                            >
                                <DollarSign className="h-4 w-4" />
                                Registrar Pagamento
                            </Button>
                        )}
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
                                <p className="font-medium">{capa.customer?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {capa.customer?.email}
                                </p>
                                {capa.customer?.phone && (
                                    <p className="text-sm text-muted-foreground">
                                        {capa.customer.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Device */}
                        {capa.customer_device && (
                            <div className="flex items-start gap-3">
                                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">
                                        {capa.customer_device.display_name}
                                    </p>
                                    {capa.customer_device.nickname && (
                                        <p className="text-sm text-muted-foreground">
                                            {capa.customer_device.nickname}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Store */}
                        <div className="flex items-start gap-3">
                            <Store className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">{capa.store?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {capa.store?.city}
                                </p>
                            </div>
                        </div>

                        {/* Seller */}
                        {capa.user && (
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Vendedor</p>
                                    <p className="font-medium">{capa.user.name}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Change */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Alterar Status
                        </CardTitle>
                        <CardDescription>
                            Atualize o status da capa personalizada
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione o novo status" />
                            </SelectTrigger>
                            <SelectContent>
                                {CAPA_STATUS_OPTIONS.filter(
                                    (opt) => opt.value !== capa.status
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
                        >
                            {updateStatusMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirmar
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation */}
            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Excluir Capa"
                description={
                    <p>
                        Tem certeza que deseja excluir a capa{' '}
                        <strong>{capa.selected_product}</strong>?
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

            {/* Payment dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Pagamento</DialogTitle>
                        <DialogDescription>
                            Marque esta capa como paga
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="payment_payed"
                                checked={paymentData.payed}
                                onCheckedChange={(checked) =>
                                    setPaymentData({ ...paymentData, payed: checked as boolean })
                                }
                            />
                            <Label htmlFor="payment_payed">Confirmar pagamento</Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_date">Data do Pagamento</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                value={paymentData.payday}
                                onChange={(e) =>
                                    setPaymentData({ ...paymentData, payday: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsPaymentDialogOpen(false)}
                            disabled={registerPaymentMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={registerPaymentMutation.isPending}
                        >
                            {registerPaymentMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CapaDetail;
