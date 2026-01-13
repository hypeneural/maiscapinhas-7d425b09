/**
 * Customer Detail Page
 * 
 * View customer details with tabs for info and devices.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Smartphone,
    Plus,
    Star,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/crud';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    useCustomer,
    useCustomerDevices,
    useAddDevice,
    useRemoveDevice,
    useDeleteCustomer,
} from '@/hooks/api/use-customers';
import { usePhoneBrands, usePhoneModels } from '@/hooks/api/use-phone-catalog';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CustomerDevice } from '@/types/customers.types';

const CustomerDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const customerId = id ? parseInt(id, 10) : 0;

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmRemoveDevice, setConfirmRemoveDevice] = useState<CustomerDevice | null>(null);
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [deviceNickname, setDeviceNickname] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);

    const { data: customer, isLoading } = useCustomer(customerId);
    const { data: devices, isLoading: isLoadingDevices } = useCustomerDevices(customerId);
    const { data: brandsData } = usePhoneBrands({ per_page: 100 });
    const { data: modelsData } = usePhoneModels({
        brand_id: selectedBrandId || undefined,
        per_page: 100,
    });

    const deleteMutation = useDeleteCustomer();
    const addDeviceMutation = useAddDevice();
    const removeDeviceMutation = useRemoveDevice();

    const brands = brandsData?.data || [];
    const models = modelsData?.data || [];

    const handleDelete = async () => {
        await deleteMutation.mutateAsync(customerId);
        navigate('/clientes');
    };

    const handleRemoveDevice = async () => {
        if (confirmRemoveDevice) {
            await removeDeviceMutation.mutateAsync({
                customerId,
                deviceId: confirmRemoveDevice.id,
            });
            setConfirmRemoveDevice(null);
        }
    };

    const handleAddDevice = async () => {
        if (!selectedModelId) return;

        await addDeviceMutation.mutateAsync({
            customerId,
            data: {
                phone_model_id: selectedModelId,
                nickname: deviceNickname || undefined,
                is_primary: isPrimary,
            },
        });

        setIsAddDeviceOpen(false);
        setSelectedBrandId(null);
        setSelectedModelId(null);
        setDeviceNickname('');
        setIsPrimary(false);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
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

    if (!customer) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Cliente não encontrado</p>
                <Button variant="link" onClick={() => navigate('/clientes')}>
                    Voltar para lista
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title={customer.name}
                description="Visualize e gerencie as informações do cliente"
                icon={User}
            />

            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/clientes')}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para lista
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/clientes/${customerId}/editar`)}
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

            <Tabs defaultValue="info" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="info" className="gap-2">
                        <User className="h-4 w-4" />
                        Informações
                    </TabsTrigger>
                    <TabsTrigger value="devices" className="gap-2">
                        <Smartphone className="h-4 w-4" />
                        Aparelhos ({devices?.length || 0})
                    </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Contact Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Contato</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{customer.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{customer.phone || '-'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Nascimento: {formatDate(customer.birth_date)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Address Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Endereço
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {customer.street ? (
                                    <div className="space-y-1 text-sm">
                                        <p>
                                            {customer.street}
                                            {customer.number && `, ${customer.number}`}
                                            {customer.complement && ` - ${customer.complement}`}
                                        </p>
                                        <p>{customer.neighborhood}</p>
                                        <p>
                                            {customer.city}
                                            {customer.state && ` - ${customer.state}`}
                                        </p>
                                        {customer.zip_code && (
                                            <p className="text-muted-foreground">
                                                CEP: {customer.zip_code}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        Endereço não cadastrado
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Meta info */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                                <span>
                                    Cadastrado em: {formatDate(customer.created_at)}
                                </span>
                                {customer.created_by && (
                                    <span>
                                        Cadastrado por: {customer.created_by.name}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Devices Tab */}
                <TabsContent value="devices">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-primary" />
                                    Aparelhos Vinculados
                                </CardTitle>
                                <CardDescription>
                                    Aparelhos cadastrados para este cliente
                                </CardDescription>
                            </div>
                            <Button onClick={() => setIsAddDeviceOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Adicionar Aparelho
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingDevices ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : devices && devices.length > 0 ? (
                                <div className="space-y-3">
                                    {devices.map((device) => (
                                        <div
                                            key={device.id}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Smartphone className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {device.display_name}
                                                        </span>
                                                        {device.is_primary && (
                                                            <Badge variant="secondary" className="gap-1">
                                                                <Star className="h-3 w-3" />
                                                                Principal
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {device.nickname && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {device.nickname}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setConfirmRemoveDevice(device)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsAddDeviceOpen(true)}
                                    className="w-full text-center py-8 text-muted-foreground hover:bg-accent/50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">Nenhum aparelho cadastrado</p>
                                    <p className="text-sm text-primary mt-1">Clique aqui para adicionar</p>
                                </button>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete confirmation */}
            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Excluir Cliente"
                description={
                    <p>
                        Tem certeza que deseja excluir <strong>{customer.name}</strong>?
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

            {/* Remove device confirmation */}
            <ConfirmDialog
                open={!!confirmRemoveDevice}
                onOpenChange={() => setConfirmRemoveDevice(null)}
                title="Remover Aparelho"
                description={
                    <p>
                        Tem certeza que deseja remover o aparelho{' '}
                        <strong>{confirmRemoveDevice?.display_name}</strong>?
                    </p>
                }
                confirmText="Remover"
                onConfirm={handleRemoveDevice}
                loading={removeDeviceMutation.isPending}
                variant="destructive"
            />

            {/* Add device dialog */}
            <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            Adicionar Aparelho
                        </DialogTitle>
                        <DialogDescription className="flex flex-col gap-1">
                            <span>Vincule um aparelho ao cliente:</span>
                            <span className="text-primary font-medium text-base">{customer.name}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Marca</Label>
                            <Select
                                value={selectedBrandId?.toString() || ''}
                                onValueChange={(v) => {
                                    setSelectedBrandId(parseInt(v, 10));
                                    setSelectedModelId(null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a marca" />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.id.toString()}>
                                            {brand.brand_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Modelo</Label>
                            <Select
                                value={selectedModelId?.toString() || ''}
                                onValueChange={(v) => setSelectedModelId(parseInt(v, 10))}
                                disabled={!selectedBrandId}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            selectedBrandId
                                                ? 'Selecione o modelo'
                                                : 'Selecione a marca primeiro'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.id} value={model.id.toString()}>
                                            {model.marketing_name}
                                            {model.release_year && ` (${model.release_year})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Apelido (opcional)</Label>
                            <Input
                                value={deviceNickname}
                                onChange={(e) => setDeviceNickname(e.target.value)}
                                placeholder="Ex: Celular do Trabalho"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="is_primary"
                                checked={isPrimary}
                                onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
                            />
                            <Label htmlFor="is_primary" className="font-normal">
                                Definir como aparelho principal
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddDeviceOpen(false)}
                            disabled={addDeviceMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddDevice}
                            disabled={!selectedModelId || addDeviceMutation.isPending}
                        >
                            {addDeviceMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Adicionar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CustomerDetail;
