/**
 * Pedido Form Page
 * 
 * Create or edit a pedido (order).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Loader2,
    ClipboardList,
    Plus,
    Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { CustomerSelect } from '@/components/CustomerSelect';
import { DeviceSelect } from '@/components/DeviceSelect';
import { AddDeviceModal } from '@/components/AddDeviceModal';
import {
    usePedido,
    useCreatePedido,
    useUpdatePedido,
} from '@/hooks/api/use-pedidos';
import { PEDIDO_STATUS_OPTIONS, getStatusColorClasses } from '@/lib/constants/status.constants';
import { cn } from '@/lib/utils';
import type { CreatePedidoRequest, UpdatePedidoRequest, PedidoStatus } from '@/types/pedidos.types';
import type { Customer, CustomerDevice } from '@/types/customers.types';

// ============================================================
// Types
// ============================================================

interface FormState {
    customer_id: number | null;
    customer_device_id: number | null;
    selected_product: string;
    obs: string;
    status: PedidoStatus;
}

const initialForm: FormState = {
    customer_id: null,
    customer_device_id: null,
    selected_product: '',
    obs: '',
    status: 1,
};

// ============================================================
// Component
// ============================================================

const PedidoForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const pedidoId = isEditing ? parseInt(id, 10) : null;

    const [form, setForm] = useState<FormState>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
    const [deviceRefreshKey, setDeviceRefreshKey] = useState(0);

    // Fetch pedido data if editing
    const { data: pedido, isLoading: isLoadingPedido } = usePedido(pedidoId || 0);
    const createMutation = useCreatePedido();
    const updateMutation = useUpdatePedido();

    // Populate form when pedido data is loaded
    useEffect(() => {
        if (pedido && isEditing) {
            setForm({
                customer_id: pedido.customer_id,
                customer_device_id: pedido.customer_device_id,
                selected_product: pedido.selected_product,
                obs: pedido.obs || '',
                status: pedido.status,
            });
            // Set customer for modal
            if (pedido.customer) {
                setSelectedCustomer({
                    id: pedido.customer.id,
                    name: pedido.customer.name,
                    email: '',
                    phone: null,
                    zip_code: null,
                    street: null,
                    number: null,
                    complement: null,
                    neighborhood: null,
                    city: null,
                    state: null,
                    birth_date: null,
                    created_at: '',
                    updated_at: '',
                });
            }
        }
    }, [pedido, isEditing]);

    // Handlers
    const handleCustomerChange = (customerId: number | null, customer?: Customer) => {
        setForm((prev) => ({
            ...prev,
            customer_id: customerId,
            customer_device_id: null, // Reset device when customer changes
        }));
        setSelectedCustomer(customer || null);
    };

    const handleDeviceChange = (deviceId: number | null, device?: CustomerDevice) => {
        setForm((prev) => ({
            ...prev,
            customer_device_id: deviceId,
        }));
    };

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.customer_id) {
            newErrors.customer_id = 'Selecione um cliente';
        }
        if (!form.selected_product.trim()) {
            newErrors.selected_product = 'Produto é obrigatório';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const data: CreatePedidoRequest | UpdatePedidoRequest = {
            customer_id: form.customer_id!,
            selected_product: form.selected_product,
            customer_device_id: form.customer_device_id || undefined,
            obs: form.obs || undefined,
            status: form.status,
        };

        try {
            if (isEditing && pedidoId) {
                await updateMutation.mutateAsync({ id: pedidoId, data });
            } else {
                await createMutation.mutateAsync(data as CreatePedidoRequest);
            }
            navigate('/pedidos');
        } catch {
            // Error handled by mutation
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isEditing && isLoadingPedido) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title={isEditing ? 'Editar Pedido' : 'Novo Pedido'}
                description={isEditing ? 'Atualize as informações do pedido' : 'Registre um novo pedido'}
                icon={ClipboardList}
            />

            <Button
                variant="ghost"
                onClick={() => navigate('/pedidos')}
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar para lista
            </Button>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Pedido</CardTitle>
                        <CardDescription>
                            Preencha os dados do pedido
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Customer selection */}
                        <div className="space-y-2">
                            <Label>Cliente *</Label>
                            <CustomerSelect
                                value={form.customer_id}
                                onChange={handleCustomerChange}
                                onCreateNew={() => navigate('/clientes/novo')}
                            />
                            {errors.customer_id && (
                                <p className="text-xs text-destructive">{errors.customer_id}</p>
                            )}
                        </div>

                        {/* Device selection (optional) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Aparelho (opcional)</Label>
                                {form.customer_id && selectedCustomer && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsAddDeviceOpen(true)}
                                        className="gap-1 h-7 text-xs text-primary"
                                    >
                                        <Plus className="h-3 w-3" />
                                        <Smartphone className="h-3 w-3" />
                                        Cadastrar aparelho
                                    </Button>
                                )}
                            </div>
                            <DeviceSelect
                                key={deviceRefreshKey}
                                customerId={form.customer_id}
                                value={form.customer_device_id}
                                onChange={handleDeviceChange}
                            />
                            <p className="text-xs text-muted-foreground">
                                Selecione o aparelho do cliente para este pedido
                            </p>
                        </div>

                        {/* Product */}
                        <div className="space-y-2">
                            <Label htmlFor="selected_product">Produto *</Label>
                            <Input
                                id="selected_product"
                                value={form.selected_product}
                                onChange={(e) => setForm({ ...form, selected_product: e.target.value })}
                                placeholder="Ex: Capa iPhone 15 Pro Max"
                                className={errors.selected_product ? 'border-destructive' : ''}
                            />
                            {errors.selected_product && (
                                <p className="text-xs text-destructive">{errors.selected_product}</p>
                            )}
                        </div>

                        {/* Observations */}
                        <div className="space-y-2">
                            <Label htmlFor="obs">Observações</Label>
                            <Textarea
                                id="obs"
                                value={form.obs}
                                onChange={(e) => setForm({ ...form, obs: e.target.value })}
                                placeholder="Observações sobre o pedido..."
                                rows={3}
                            />
                        </div>

                        {/* Status (only for editing) */}
                        {isEditing && (
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={form.status.toString()}
                                    onValueChange={(v) =>
                                        setForm({ ...form, status: parseInt(v, 10) as PedidoStatus })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PEDIDO_STATUS_OPTIONS.map((option) => (
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
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/pedidos')}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {isEditing ? 'Salvar Alterações' : 'Criar Pedido'}
                    </Button>
                </div>
            </form>

            {/* Add Device Modal */}
            {selectedCustomer && (
                <AddDeviceModal
                    open={isAddDeviceOpen}
                    onOpenChange={setIsAddDeviceOpen}
                    customerId={selectedCustomer.id}
                    customerName={selectedCustomer.name}
                    onSuccess={() => setDeviceRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    );
};

export default PedidoForm;
