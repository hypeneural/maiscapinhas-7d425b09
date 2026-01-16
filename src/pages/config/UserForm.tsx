/**
 * User Form Page
 * 
 * Dedicated page for creating/editing users.
 * Provides better UX than modal for many fields.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, User, Mail, Lock, Phone, Instagram,
    Wallet, Calendar, Briefcase, CreditCard, Crown, CheckCircle, Upload, Trash2,
    Home, MapPin, Flag, Search, Factory, Store, Plus, X, Users, Zap, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    useAdminUser,
    useCreateUser,
    useUpdateUser,
    useUploadAvatar,
    useRemoveAvatar,
    useBulkAddStores,
    useBulkRemoveStores,
} from '@/hooks/api/use-admin-users';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import type { AdminUserResponse, GlobalRole, StoreRole, UserStoreBinding } from '@/types/admin.types';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddStoresToUserModal } from '@/components/admin/AddStoresToUserModal';
import UserPermissionsTab from '@/components/admin/UserPermissionsTab';
import UserRolesTab from '@/components/admin/UserRolesTab';

// ============================================================
// Helper Functions
// ============================================================

function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
    return value.replace(/\D/g, '').slice(0, 11);
}

function formatCEP(value: string): string {
    return value.replace(/\D/g, '').slice(0, 8);
}

// ViaCEP API
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
        const data: ViaCEPResponse = await response.json();
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

interface UserFormState {
    name: string;
    email: string;
    password: string;
    active: boolean;
    is_super_admin: boolean;
    has_fabrica_role: boolean;  // Global role: fabrica
    cpf: string;
    birth_date: string;
    hire_date: string;
    whatsapp: string;
    instagram: string;
    pix_key: string;
    // Address
    zip_code: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
}

const initialForm: UserFormState = {
    name: '',
    email: '',
    password: '',
    active: true,
    is_super_admin: false,
    has_fabrica_role: false,
    cpf: '',
    birth_date: '',
    hire_date: '',
    whatsapp: '',
    instagram: '',
    pix_key: '',
    // Address
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

const UserForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const userId = isEditing ? parseInt(id) : null;

    const { user: currentUser } = useAuth();
    const { canManageSuperAdmins } = usePermissions();

    const [form, setForm] = useState<UserFormState>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [loadingCep, setLoadingCep] = useState(false);
    const [removingStoreId, setRemovingStoreId] = useState<number | null>(null);
    const [addStoresModalOpen, setAddStoresModalOpen] = useState(false);

    // Queries and mutations
    const { data: userData, isLoading: isLoadingUser } = useAdminUser(userId || 0);
    const { data: allStoresData } = useAdminStores({ per_page: 100 });
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();
    const uploadAvatarMutation = useUploadAvatar();
    const removeAvatarMutation = useRemoveAvatar();
    const bulkRemoveStoresMutation = useBulkRemoveStores(userId || 0);

    // Get role badge color
    const getRoleBadge = (role: StoreRole) => {
        const badges: Record<StoreRole, { label: string; className: string }> = {
            admin: { label: 'Admin', className: 'bg-red-100 text-red-700 border-red-200' },
            gerente: { label: 'Gerente', className: 'bg-blue-100 text-blue-700 border-blue-200' },
            conferente: { label: 'Conferente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            vendedor: { label: 'Vendedor', className: 'bg-green-100 text-green-700 border-green-200' },
            fabrica: { label: 'Fábrica', className: 'bg-purple-100 text-purple-700 border-purple-200' },
        };
        return badges[role] || { label: role, className: 'bg-gray-100 text-gray-700' };
    };

    // Handle remove from store
    const handleRemoveFromStore = async (storeId: number) => {
        setRemovingStoreId(storeId);
        try {
            await bulkRemoveStoresMutation.mutateAsync({ store_ids: [storeId] });
        } finally {
            setRemovingStoreId(null);
        }
    };

    // Load user data when editing
    useEffect(() => {
        if (userData) {
            setForm({
                name: userData.name,
                email: userData.email,
                password: '',
                active: userData.active,
                is_super_admin: userData.is_super_admin,
                has_fabrica_role: userData.roles?.includes('fabrica') ?? false,
                cpf: userData.cpf || '',
                birth_date: userData.birth_date || '',
                hire_date: userData.hire_date || '',
                whatsapp: userData.whatsapp || '',
                instagram: userData.instagram || '',
                pix_key: userData.pix_key || '',
                // Address
                zip_code: userData.zip_code || '',
                street: userData.street || '',
                number: userData.number || '',
                complement: userData.complement || '',
                neighborhood: userData.neighborhood || '',
                city: userData.city || '',
                state: userData.state || '',
            });
            if (userData.avatar_url) {
                setAvatarPreview(userData.avatar_url);
            }
        }
    }, [userData]);

    // Handle CEP lookup
    const handleCepBlur = async () => {
        const cep = form.zip_code.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setLoadingCep(true);
        const address = await fetchAddressByCep(cep);
        setLoadingCep(false);

        if (address) {
            setForm(f => ({
                ...f,
                street: address.logradouro || f.street,
                neighborhood: address.bairro || f.neighborhood,
                city: address.localidade || f.city,
                state: address.uf || f.state,
            }));
            toast.success('Endereço preenchido automaticamente!');
        } else if (cep.length === 8) {
            toast.error('CEP não encontrado');
        }
    };

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!form.email.trim()) newErrors.email = 'Email é obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido';

        if (!isEditing && !form.password) newErrors.password = 'Senha é obrigatória';
        else if (form.password && form.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';

        if (form.birth_date && new Date(form.birth_date) >= new Date()) {
            newErrors.birth_date = 'Data deve ser no passado';
        }

        if (form.hire_date && new Date(form.hire_date) > new Date()) {
            newErrors.hire_date = 'Data não pode ser futura';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle avatar file selection
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const userPayload = {
                name: form.name,
                email: form.email,
                password: form.password || undefined,
                active: form.active,
                cpf: form.cpf || undefined,
                birth_date: form.birth_date || undefined,
                hire_date: form.hire_date || undefined,
                whatsapp: form.whatsapp || undefined,
                instagram: form.instagram || undefined,
                pix_key: form.pix_key || undefined,
                // Address
                zip_code: form.zip_code || undefined,
                street: form.street || undefined,
                number: form.number || undefined,
                complement: form.complement || undefined,
                neighborhood: form.neighborhood || undefined,
                city: form.city || undefined,
                state: form.state || undefined,
                // Permissions
                ...(canManageSuperAdmins && { is_super_admin: form.is_super_admin }),
                // Global roles (fabrica)
                roles: form.has_fabrica_role ? ['fabrica'] as GlobalRole[] : [],
            };

            let savedUserId = userId;

            if (isEditing && userId) {
                await updateMutation.mutateAsync({ id: userId, data: userPayload });
            } else {
                const result = await createMutation.mutateAsync(userPayload as any);
                savedUserId = result.id;
            }

            // Upload avatar if changed
            if (avatarFile && savedUserId) {
                await uploadAvatarMutation.mutateAsync({ id: savedUserId, file: avatarFile });
            }

            toast.success(isEditing ? 'Usuário atualizado!' : 'Usuário criado!');
            navigate('/config/usuarios');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar usuário');
        }
    };

    const handleRemoveAvatar = async () => {
        if (userId) {
            await removeAvatarMutation.mutateAsync(userId);
            setAvatarPreview(null);
            setAvatarFile(null);
            toast.success('Avatar removido');
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    if (isEditing && isLoadingUser) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/config/usuarios')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                        description={isEditing ? `Editando ${userData?.name}` : 'Preencha os dados do novo usuário'}
                        icon={User}
                    />
                </div>
                <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                {/* Avatar Card */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Foto</CardTitle>
                        <CardDescription>Avatar do usuário</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                            <AvatarImage src={avatarPreview || undefined} />
                            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/5">
                                {form.name ? form.name.split(' ').map(n => n[0]).slice(0, 2).join('') : <User className="h-12 w-12" />}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <label className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                            </Button>
                            {(avatarPreview || userData?.avatar_url) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveAvatar}
                                    disabled={removeAvatarMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados Pessoais */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Dados Pessoais
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    Nome Completo *
                                </Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="João Silva Santos"
                                    className={cn(errors.name && "border-destructive")}
                                />
                                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    Email *
                                </Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="joao@maiscapinhas.com.br"
                                    className={cn(errors.email && "border-destructive")}
                                />
                                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                                    CPF
                                </Label>
                                <Input
                                    value={form.cpf}
                                    onChange={(e) => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))}
                                    placeholder="123.456.789-00"
                                    maxLength={14}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                    {isEditing ? 'Nova Senha' : 'Senha *'}
                                </Label>
                                <Input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder={isEditing ? 'Em branco = manter' : 'Mínimo 8 caracteres'}
                                    className={cn(errors.password && "border-destructive")}
                                />
                                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    Data de Nascimento
                                </Label>
                                <Input
                                    type="date"
                                    value={form.birth_date}
                                    onChange={(e) => setForm(f => ({ ...f, birth_date: e.target.value }))}
                                    className={cn(errors.birth_date && "border-destructive")}
                                />
                                {errors.birth_date && <p className="text-xs text-destructive mt-1">{errors.birth_date}</p>}
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                    Data de Contratação
                                </Label>
                                <Input
                                    type="date"
                                    value={form.hire_date}
                                    onChange={(e) => setForm(f => ({ ...f, hire_date: e.target.value }))}
                                    className={cn(errors.hire_date && "border-destructive")}
                                />
                                {errors.hire_date && <p className="text-xs text-destructive mt-1">{errors.hire_date}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contato */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary" />
                                Contato
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    WhatsApp
                                </Label>
                                <Input
                                    value={form.whatsapp}
                                    onChange={(e) => setForm(f => ({ ...f, whatsapp: formatPhone(e.target.value) }))}
                                    placeholder="47999999999"
                                    maxLength={11}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                                    Instagram
                                </Label>
                                <Input
                                    value={form.instagram}
                                    onChange={(e) => setForm(f => ({ ...f, instagram: e.target.value }))}
                                    placeholder="@usuario"
                                    maxLength={50}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Label className="flex items-center gap-2">
                                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                    Chave PIX
                                </Label>
                                <Input
                                    value={form.pix_key}
                                    onChange={(e) => setForm(f => ({ ...f, pix_key: e.target.value }))}
                                    placeholder="CPF, Email, Telefone ou Chave aleatória"
                                    maxLength={255}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Endereço */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Home className="h-5 w-5 text-primary" />
                                Endereço
                            </CardTitle>
                            <CardDescription>
                                Preencha o CEP para auto-completar
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    CEP
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={form.zip_code}
                                        onChange={(e) => setForm(f => ({ ...f, zip_code: formatCEP(e.target.value) }))}
                                        onBlur={handleCepBlur}
                                        placeholder="88220000"
                                        maxLength={8}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCepBlur}
                                        disabled={loadingCep || form.zip_code.length < 8}
                                    >
                                        {loadingCep ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <Label className="flex items-center gap-2">
                                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                                    Logradouro
                                </Label>
                                <Input
                                    value={form.street}
                                    onChange={(e) => setForm(f => ({ ...f, street: e.target.value }))}
                                    placeholder="Rua das Flores"
                                    maxLength={255}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                                    Número
                                </Label>
                                <Input
                                    value={form.number}
                                    onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))}
                                    placeholder="123"
                                    maxLength={20}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                                    Complemento
                                </Label>
                                <Input
                                    value={form.complement}
                                    onChange={(e) => setForm(f => ({ ...f, complement: e.target.value }))}
                                    placeholder="Apto 45"
                                    maxLength={255}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    Bairro
                                </Label>
                                <Input
                                    value={form.neighborhood}
                                    onChange={(e) => setForm(f => ({ ...f, neighborhood: e.target.value }))}
                                    placeholder="Centro"
                                    maxLength={100}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    Cidade
                                </Label>
                                <Input
                                    value={form.city}
                                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                                    placeholder="Itapema"
                                    maxLength={255}
                                />
                            </div>

                            <div>
                                <Label className="flex items-center gap-2">
                                    <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                                    UF
                                </Label>
                                <Select value={form.state} onValueChange={(v) => setForm(f => ({ ...f, state: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="UF" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UF_OPTIONS.map(uf => (
                                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Acesso */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-primary" />
                                Acesso e Permissões
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={cn("h-5 w-5", form.active ? "text-green-500" : "text-muted-foreground")} />
                                    <div>
                                        <p className="font-medium">Usuário Ativo</p>
                                        <p className="text-sm text-muted-foreground">Pode acessar o sistema</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.active}
                                    onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
                                />
                            </div>

                            {canManageSuperAdmins && (
                                <div className="flex items-center justify-between p-4 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                                    <div className="flex items-center gap-3">
                                        <Crown className="h-5 w-5 text-amber-500" />
                                        <div>
                                            <p className="font-medium text-amber-600">Super Administrador</p>
                                            <p className="text-sm text-muted-foreground">Acesso total a todas as lojas e funções</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={form.is_super_admin}
                                        onCheckedChange={(checked) => setForm(f => ({ ...f, is_super_admin: checked }))}
                                    />
                                </div>
                            )}

                            {/* Fabrica Role */}
                            <div className="flex items-center justify-between p-4 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
                                <div className="flex items-center gap-3">
                                    <Factory className="h-5 w-5 text-purple-500" />
                                    <div>
                                        <p className="font-medium text-purple-600">Acesso Fábrica</p>
                                        <p className="text-sm text-muted-foreground">Acesso ao Portal da Fábrica para produção</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.has_fabrica_role}
                                    onCheckedChange={(checked) => setForm(f => ({ ...f, has_fabrica_role: checked }))}
                                />
                            </div>

                            {form.has_fabrica_role && !form.is_super_admin && (
                                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        <strong>Nota:</strong> Usuários com apenas acesso à Fábrica verão somente o Portal da Fábrica,
                                        sem acesso a outras áreas como Vendas, Clientes ou Comunicados.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Lojas Vinculadas - Only show when editing */}
                    {isEditing && userData && (
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Store className="h-5 w-5 text-primary" />
                                            Lojas Vinculadas
                                            {userData.stores.length > 0 && (
                                                <Badge variant="secondary" className="ml-2">
                                                    {userData.stores.length}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Lojas onde este usuário tem acesso e seu cargo em cada uma
                                        </CardDescription>
                                    </div>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => setAddStoresModalOpen(true)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Adicionar Lojas
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left">
                                                <p>Vincular este usuário a uma ou mais lojas</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {userData.stores.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>Este usuário não está vinculado a nenhuma loja</p>
                                        <p className="text-sm mt-1">
                                            {form.has_fabrica_role
                                                ? 'Usuários da fábrica não precisam de vínculo com lojas'
                                                : 'Adicione vínculos para permitir acesso às lojas'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Loja</TableHead>
                                                    <TableHead>Cargo</TableHead>
                                                    <TableHead className="w-[60px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {userData.stores.map((store) => {
                                                    const badge = getRoleBadge(store.role);
                                                    return (
                                                        <TableRow key={store.store_id}>
                                                            <TableCell className="font-medium">
                                                                {store.store_name}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={badge.className}
                                                                >
                                                                    {badge.label}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                                onClick={() => handleRemoveFromStore(store.store_id)}
                                                                                disabled={removingStoreId === store.store_id}
                                                                            >
                                                                                {removingStoreId === store.store_id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <X className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="left">
                                                                            <p>Remover vínculo com esta loja</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Permissions Tab - Only show when editing */}
                    {isEditing && userId && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    Permissões
                                </CardTitle>
                                <CardDescription>
                                    Overrides de permissões específicas para este usuário
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserPermissionsTab userId={userId} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Roles Tab - Only show when editing */}
                    {isEditing && userId && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Key className="h-5 w-5 text-primary" />
                                    Roles
                                </CardTitle>
                                <CardDescription>
                                    Roles atribuídas por loja
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserRolesTab userId={userId} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </form>

            {/* Add Stores Modal */}
            {isEditing && userData && (
                <AddStoresToUserModal
                    userId={userId!}
                    userName={userData.name}
                    existingStores={userData.stores}
                    open={addStoresModalOpen}
                    onOpenChange={setAddStoresModalOpen}
                />
            )}
        </div>
    );
};

export default UserForm;
