/**
 * WhatsApp Instance Form Page
 * 
 * Create/edit form for WhatsApp instances.
 * Follows the pattern from StoreForm.tsx with cards layout and tooltips.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, MessageSquare, Globe, Link, Key,
    Store, User, Star, Power, FileText, HelpCircle, Trash2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    useWhatsAppInstance,
    useCreateWhatsAppInstance,
    useUpdateWhatsAppInstance,
    useClearApiKey,
    useClearToken,
} from '@/hooks/api/use-whatsapp-instances';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { useAdminUsers } from '@/hooks/api/use-admin-users';
import type { InstanceScope } from '@/types/whatsapp-instances.types';
import { SCOPE_BADGE_MAP } from '@/types/whatsapp-instances.types';

// ============================================================
// Types
// ============================================================

interface FormState {
    name: string;
    base_url: string;
    api_key: string;
    provider: 'evolution';
    store_id: number | null;
    user_id: number | null;
    is_default: boolean;
    is_active: boolean;
    notes: string;
}

const initialForm: FormState = {
    name: '',
    base_url: '',
    api_key: '',
    provider: 'evolution',
    store_id: null,
    user_id: null,
    is_default: false,
    is_active: true,
    notes: '',
};

// ============================================================
// Helper Components
// ============================================================

interface TooltipLabelProps {
    icon: React.ReactNode;
    label: string;
    tooltip: string;
    required?: boolean;
}

const TooltipLabel: React.FC<TooltipLabelProps> = ({ icon, label, tooltip, required }) => (
    <div className="flex items-center gap-2 mb-1.5">
        <Label className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {label}
            {required && <span className="text-destructive">*</span>}
        </Label>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                        <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                    <p className="text-sm">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </div>
);

// ============================================================
// Main Component
// ============================================================

const WhatsAppInstanceForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const instanceId = isEditing ? parseInt(id) : null;

    // Form state
    const [form, setForm] = useState<FormState>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Queries
    const { data: instanceData, isLoading: isLoadingInstance } = useWhatsAppInstance(instanceId || 0);
    const { data: storesData } = useAdminStores({ per_page: 100 });
    const { data: usersData } = useAdminUsers({ per_page: 100 });

    // Mutations
    const createMutation = useCreateWhatsAppInstance();
    const updateMutation = useUpdateWhatsAppInstance();
    const clearApiKeyMutation = useClearApiKey();
    const clearTokenMutation = useClearToken();

    // Derived data
    const stores = storesData?.data || [];
    const users = usersData?.data || [];

    // Compute current scope
    const currentScope: InstanceScope = useMemo(() => {
        if (form.store_id) return 'store';
        if (form.user_id) return 'user';
        return 'global';
    }, [form.store_id, form.user_id]);

    const scopeConfig = SCOPE_BADGE_MAP[currentScope];

    // Load instance data when editing
    useEffect(() => {
        if (instanceData) {
            setForm({
                name: instanceData.name,
                base_url: instanceData.base_url,
                api_key: '', // Never show actual key
                provider: instanceData.provider || 'evolution',
                store_id: instanceData.store?.id || null,
                user_id: instanceData.user?.id || null,
                is_default: instanceData.is_default,
                is_active: instanceData.is_active,
                notes: instanceData.notes || '',
            });
        }
    }, [instanceData]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(form.name)) {
            newErrors.name = 'Use apenas letras, números, _ e -';
        }

        if (!form.base_url.trim()) {
            newErrors.base_url = 'URL é obrigatória';
        } else {
            try {
                new URL(form.base_url);
            } catch {
                newErrors.base_url = 'URL inválida';
            }
        }

        if (form.notes && form.notes.length > 1000) {
            newErrors.notes = 'Máximo de 1000 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const payload = {
                name: form.name,
                base_url: form.base_url,
                provider: form.provider,
                store_id: form.store_id,
                user_id: form.user_id,
                is_default: form.is_default,
                is_active: form.is_active,
                notes: form.notes || undefined,
                // Only send api_key if provided (to avoid clearing on update)
                ...(form.api_key && { api_key: form.api_key }),
            };

            if (isEditing && instanceId) {
                await updateMutation.mutateAsync({ id: instanceId, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }

            navigate('/config/whatsapp');
        } catch (error) {
            // Error already handled by mutation
        }
    };

    // Handle scope change
    const handleStoreChange = (value: string) => {
        if (value === 'none') {
            setForm(f => ({ ...f, store_id: null }));
        } else {
            setForm(f => ({ ...f, store_id: parseInt(value), user_id: null }));
        }
    };

    const handleUserChange = (value: string) => {
        if (value === 'none') {
            setForm(f => ({ ...f, user_id: null }));
        } else {
            setForm(f => ({ ...f, user_id: parseInt(value), store_id: null }));
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    if (isEditing && isLoadingInstance) {
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
                    <Button variant="ghost" size="icon" onClick={() => navigate('/config/whatsapp')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={isEditing ? 'Editar Instância' : 'Nova Instância'}
                        description={isEditing ? `Editando ${instanceData?.name}` : 'Configure uma nova conexão WhatsApp'}
                        icon={MessageSquare}
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
                {/* Scope Info Card */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Escopo</CardTitle>
                        <CardDescription>Define quem pode usar esta instância</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                            <Badge variant="outline" className={cn('text-sm px-3 py-1', scopeConfig.className)}>
                                {currentScope === 'global' && <Globe className="h-4 w-4 mr-1" />}
                                {currentScope === 'store' && <Store className="h-4 w-4 mr-1" />}
                                {currentScope === 'user' && <User className="h-4 w-4 mr-1" />}
                                {scopeConfig.label}
                            </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {currentScope === 'global' && 'Esta instância está disponível para todo o sistema.'}
                            {currentScope === 'store' && 'Esta instância é exclusiva para a loja selecionada.'}
                            {currentScope === 'user' && 'Esta instância é exclusiva para o usuário selecionado.'}
                        </p>

                        {isEditing && instanceData?.has_api_key && (
                            <Alert>
                                <Key className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    API Key configurada: <code className="font-mono">{instanceData.api_key_masked}</code>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Identificação */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Identificação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <TooltipLabel
                                    icon={<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
                                    label="Nome da Instância"
                                    tooltip="Identificador único da instância. Use letras, números, _ e -. Ex: loja_01, global_notif"
                                    required
                                />
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="global_notif"
                                    className={cn(errors.name && "border-destructive")}
                                />
                                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <TooltipLabel
                                    icon={<Link className="h-3.5 w-3.5 text-muted-foreground" />}
                                    label="URL do Servidor Evolution"
                                    tooltip="Endereço do servidor Evolution API. Pergunte ao admin do servidor."
                                    required
                                />
                                <Input
                                    type="url"
                                    value={form.base_url}
                                    onChange={(e) => setForm(f => ({ ...f, base_url: e.target.value }))}
                                    placeholder="https://evolution.example.com"
                                    className={cn(errors.base_url && "border-destructive")}
                                />
                                {errors.base_url && <p className="text-xs text-destructive mt-1">{errors.base_url}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <TooltipLabel
                                    icon={<Key className="h-3.5 w-3.5 text-muted-foreground" />}
                                    label="API Key"
                                    tooltip="Chave de autenticação do Evolution. Nunca será exibida completa. Pode adicionar depois."
                                />
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        autoComplete="off"
                                        value={form.api_key}
                                        onChange={(e) => setForm(f => ({ ...f, api_key: e.target.value }))}
                                        placeholder={isEditing && instanceData?.has_api_key
                                            ? "Deixe vazio para manter a atual"
                                            : "Sua API Key do Evolution"
                                        }
                                    />
                                    {isEditing && instanceData?.has_api_key && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="shrink-0"
                                                    disabled={clearApiKeyMutation.isPending}
                                                >
                                                    {clearApiKeyMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    )}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remover API Key</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Isso irá remover a API Key desta instância.
                                                        A instância não funcionará até que uma nova chave seja configurada.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => clearApiKeyMutation.mutate(instanceId!)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Remover
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                                {isEditing && instanceData?.has_api_key && (
                                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Deixe vazio para manter a API Key atual
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vinculação */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                Vinculação
                            </CardTitle>
                            <CardDescription>
                                Vincule a instância a uma loja ou usuário específico, ou deixe vazio para Global.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <TooltipLabel
                                    icon={<Store className="h-3.5 w-3.5 text-muted-foreground" />}
                                    label="Loja"
                                    tooltip="Vincular a uma loja específica. Isso tornará a instância exclusiva para esta loja."
                                />
                                <Select
                                    value={form.store_id?.toString() || 'none'}
                                    onValueChange={handleStoreChange}
                                    disabled={!!form.user_id}
                                >
                                    <SelectTrigger className={cn(form.user_id && "opacity-50")}>
                                        <SelectValue placeholder="Nenhuma (Global)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma (Global)</SelectItem>
                                        {stores.map((store) => (
                                            <SelectItem key={store.id} value={store.id.toString()}>
                                                {store.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <TooltipLabel
                                    icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}
                                    label="Usuário"
                                    tooltip="Vincular a um usuário específico. Isso tornará a instância exclusiva para este usuário."
                                />
                                <Select
                                    value={form.user_id?.toString() || 'none'}
                                    onValueChange={handleUserChange}
                                    disabled={!!form.store_id}
                                >
                                    <SelectTrigger className={cn(form.store_id && "opacity-50")}>
                                        <SelectValue placeholder="Nenhum (Global)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum (Global)</SelectItem>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Power className="h-5 w-5 text-primary" />
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                <div className="flex items-center gap-3">
                                    <Power className={cn("h-5 w-5", form.is_active ? "text-green-500" : "text-muted-foreground")} />
                                    <div>
                                        <p className="font-medium">Instância Ativa</p>
                                        <p className="text-sm text-muted-foreground">
                                            Instâncias inativas não podem enviar mensagens
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.is_active}
                                    onCheckedChange={(checked) => setForm(f => ({ ...f, is_active: checked }))}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
                                <div className="flex items-center gap-3">
                                    <Star className={cn("h-5 w-5", form.is_default ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                                    <div>
                                        <p className="font-medium text-yellow-700 dark:text-yellow-400">Instância Favorita</p>
                                        <p className="text-sm text-muted-foreground">
                                            Usada quando não especificar outra no mesmo escopo
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.is_default}
                                    onCheckedChange={(checked) => setForm(f => ({ ...f, is_default: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Anotações
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TooltipLabel
                                icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                                label="Notas Internas"
                                tooltip="Anotações internas sobre esta instância. Máximo de 1000 caracteres."
                            />
                            <Textarea
                                value={form.notes}
                                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Anotações sobre esta instância..."
                                rows={3}
                                maxLength={1000}
                                className={cn(errors.notes && "border-destructive")}
                            />
                            <div className="flex justify-between mt-1">
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                                <p className="text-xs text-muted-foreground ml-auto">
                                    {form.notes.length}/1000
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default WhatsAppInstanceForm;
