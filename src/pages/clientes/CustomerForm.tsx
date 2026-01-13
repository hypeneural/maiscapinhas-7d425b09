/**
 * Customer Form Page
 * 
 * Create or edit a customer with address integration via ViaCEP.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { Separator } from '@/components/ui/separator';
import {
    useCustomer,
    useCreateCustomer,
    useUpdateCustomer,
} from '@/hooks/api/use-customers';
import type { CreateCustomerRequest, UpdateCustomerRequest } from '@/types/customers.types';

// ============================================================
// Helper Functions
// ============================================================

const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
};

const formatCEP = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/(\d{5})(\d{0,3})/, '$1-$2');
};

interface ViaCEPResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
}

async function fetchAddressByCep(cep: string): Promise<ViaCEPResponse | null> {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (data.erro) return null;
        return data;
    } catch {
        return null;
    }
}

const UF_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

// ============================================================
// Types
// ============================================================

interface FormState {
    name: string;
    email: string;
    phone: string;
    birth_date: string;
    zip_code: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
}

const initialForm: FormState = {
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
};

// ============================================================
// Component
// ============================================================

const CustomerForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const customerId = isEditing ? parseInt(id, 10) : null;

    const [form, setForm] = useState<FormState>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoadingCep, setIsLoadingCep] = useState(false);

    // Fetch customer data if editing
    const { data: customer, isLoading: isLoadingCustomer } = useCustomer(customerId || 0);
    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();

    // Populate form when customer data is loaded
    useEffect(() => {
        if (customer && isEditing) {
            setForm({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                birth_date: customer.birth_date || '',
                zip_code: customer.zip_code || '',
                street: customer.street || '',
                number: customer.number || '',
                complement: customer.complement || '',
                neighborhood: customer.neighborhood || '',
                city: customer.city || '',
                state: customer.state || '',
            });
        }
    }, [customer, isEditing]);

    // Handle CEP lookup
    const handleCepBlur = async () => {
        const cleanCep = form.zip_code.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setIsLoadingCep(true);
        const address = await fetchAddressByCep(cleanCep);
        setIsLoadingCep(false);

        if (address) {
            setForm((prev) => ({
                ...prev,
                street: address.logradouro || prev.street,
                neighborhood: address.bairro || prev.neighborhood,
                city: address.localidade || prev.city,
                state: address.uf || prev.state,
                complement: address.complemento || prev.complement,
            }));
        }
    };

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }
        if (!form.email.trim()) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = 'Email inválido';
        }
        if (form.state && form.state.length !== 2) {
            newErrors.state = 'Estado deve ter 2 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const data: CreateCustomerRequest | UpdateCustomerRequest = {
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            birth_date: form.birth_date || undefined,
            zip_code: form.zip_code.replace(/\D/g, '') || undefined,
            street: form.street || undefined,
            number: form.number || undefined,
            complement: form.complement || undefined,
            neighborhood: form.neighborhood || undefined,
            city: form.city || undefined,
            state: form.state || undefined,
        };

        try {
            if (isEditing && customerId) {
                await updateMutation.mutateAsync({ id: customerId, data });
            } else {
                await createMutation.mutateAsync(data as CreateCustomerRequest);
            }
            navigate('/clientes');
        } catch {
            // Error handled by mutation
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isEditing && isLoadingCustomer) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
                description={isEditing ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente'}
                icon={User}
            />

            <Button
                variant="ghost"
                onClick={() => navigate('/clientes')}
                className="gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar para lista
            </Button>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Data */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Dados Pessoais
                        </CardTitle>
                        <CardDescription>
                            Informações básicas do cliente
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome *</Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Nome completo"
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="email@exemplo.com"
                                        className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                                        placeholder="(00) 00000-0000"
                                        className="pl-10"
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Data de Nascimento</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={form.birth_date}
                                        onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Endereço
                        </CardTitle>
                        <CardDescription>
                            Endereço do cliente (opcional)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="zip_code">CEP</Label>
                                <div className="relative">
                                    <Input
                                        id="zip_code"
                                        value={form.zip_code}
                                        onChange={(e) => setForm({ ...form, zip_code: formatCEP(e.target.value) })}
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                        maxLength={9}
                                    />
                                    {isLoadingCep && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="street">Rua</Label>
                                <Input
                                    id="street"
                                    value={form.street}
                                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                                    placeholder="Nome da rua"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="number">Número</Label>
                                <Input
                                    id="number"
                                    value={form.number}
                                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                                    placeholder="123"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="complement">Complemento</Label>
                                <Input
                                    id="complement"
                                    value={form.complement}
                                    onChange={(e) => setForm({ ...form, complement: e.target.value })}
                                    placeholder="Apto, sala, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input
                                    id="neighborhood"
                                    value={form.neighborhood}
                                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                                    placeholder="Bairro"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input
                                    id="city"
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    placeholder="Cidade"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">Estado</Label>
                                <Select
                                    value={form.state}
                                    onValueChange={(value) => setForm({ ...form, state: value })}
                                >
                                    <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="UF" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UF_OPTIONS.map((uf) => (
                                            <SelectItem key={uf} value={uf}>
                                                {uf}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.state && (
                                    <p className="text-xs text-destructive">{errors.state}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/clientes')}
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
                        {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CustomerForm;
