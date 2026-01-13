/**
 * ComunicadoForm Page
 * 
 * Create/Edit form for announcements with rich text editor,
 * target selection, and improved UX with tooltips.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { TargetSelector } from '@/components/announcements/TargetSelector';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    useAnnouncement,
    useCreateAnnouncement,
    useUpdateAnnouncement,
    usePublishAnnouncement,
} from '@/hooks/api/use-announcements';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Megaphone,
    Save,
    Send,
    ArrowLeft,
    Loader2,
    Info,
    AlertTriangle,
    AlertCircle,
    HelpCircle,
    MessageSquare,
    Bell,
    Monitor,
    Calendar,
    Users,
    User,
    Store,
    UserCheck,
    ShieldCheck,
} from 'lucide-react';
import type {
    AnnouncementType,
    AnnouncementSeverity,
    AnnouncementScope,
    AnnouncementDisplayMode,
    CreateAnnouncementPayload,
    AnnouncementTarget,
} from '@/types/announcements.types';

// Form schema
const formSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório').max(120, 'Máximo 120 caracteres'),
    message: z.string().min(1, 'Mensagem é obrigatória'),
    excerpt: z.string().max(200, 'Máximo 200 caracteres').optional(),
    type: z.enum(['recado', 'advertencia']),
    severity: z.enum(['info', 'warning', 'danger']),
    display_mode: z.enum(['banner', 'modal', 'both']),
    scope: z.enum(['global', 'store', 'user', 'role']),
    require_ack: z.boolean(),
    starts_at: z.string().optional(),
    expires_at: z.string().optional(),
    priority: z.number().min(0).max(100).optional(),
    targets: z.array(z.object({
        target_type: z.enum(['store', 'user', 'role']),
        target_id: z.string(),
    })).optional(),
}).refine((data) => {
    // Advertências devem ter severidade 'danger'
    if (data.type === 'advertencia' && data.severity !== 'danger') {
        return false;
    }
    return true;
}, {
    message: 'Advertências devem ter severidade "Urgente"',
    path: ['severity'],
}).refine((data) => {
    // Non-global scope requires targets
    if (data.scope !== 'global' && (!data.targets || data.targets.length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Selecione pelo menos um alvo',
    path: ['targets'],
});

type FormData = z.infer<typeof formSchema>;

// Simple tooltip using HTML title attribute - avoids Radix Slot ref issues completely
const InfoTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Extract text content from children for title
    const getTextContent = (node: React.ReactNode): string => {
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(getTextContent).join(' ');
        if (React.isValidElement(node) && node.props.children) {
            return getTextContent(node.props.children);
        }
        return '';
    };

    return (
        <span
            className="inline-flex cursor-help ml-1"
            title={getTextContent(children)}
        >
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </span>
    );
};

const ComunicadoForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isSuperAdmin, isAdmin } = usePermissions();

    const isEditing = !!id && id !== 'novo';
    const announcementId = isEditing ? parseInt(id, 10) : 0;

    // Fetch existing data if editing
    const { data: existingAnnouncement, isLoading: isLoadingAnnouncement } = useAnnouncement(announcementId);

    // Mutations
    const createMutation = useCreateAnnouncement();
    const updateMutation = useUpdateAnnouncement();
    const publishMutation = usePublishAnnouncement();

    // Form
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            message: '',
            excerpt: '',
            type: 'recado',
            severity: 'info',
            display_mode: 'banner',
            scope: 'global',
            require_ack: false,
            starts_at: '',
            expires_at: '',
            priority: 10,
            targets: [],
        },
    });

    // Populate form when editing
    useEffect(() => {
        if (existingAnnouncement) {
            form.reset({
                title: existingAnnouncement.title,
                message: existingAnnouncement.message,
                excerpt: existingAnnouncement.excerpt || '',
                type: existingAnnouncement.type.value,
                severity: existingAnnouncement.severity.value,
                display_mode: existingAnnouncement.display_mode.value,
                scope: existingAnnouncement.scope.value,
                require_ack: existingAnnouncement.require_ack,
                starts_at: existingAnnouncement.starts_at?.slice(0, 16) || '',
                expires_at: existingAnnouncement.expires_at?.slice(0, 16) || '',
                priority: existingAnnouncement.priority,
                targets: existingAnnouncement.targets || [],
            });
        }
    }, [existingAnnouncement, form]);

    // Watch type to auto-set severity for advertência
    const watchType = form.watch('type');
    const watchScope = form.watch('scope');
    const watchDisplayMode = form.watch('display_mode');

    useEffect(() => {
        if (watchType === 'advertencia') {
            form.setValue('severity', 'danger');
            form.setValue('require_ack', true);
        }
    }, [watchType, form]);

    // Watch display mode to auto-set require_ack for modal
    useEffect(() => {
        if (watchDisplayMode === 'modal' || watchDisplayMode === 'both') {
            form.setValue('require_ack', true);
        }
    }, [watchDisplayMode, form]);

    // Can create global scope?
    const canCreateGlobal = isSuperAdmin || isAdmin;

    // Submit handlers
    const onSubmit = async (data: FormData, publish: boolean = false) => {
        try {
            const payload: CreateAnnouncementPayload = {
                title: data.title,
                message: data.message,
                excerpt: data.excerpt || undefined,
                type: data.type,
                severity: data.severity,
                display_mode: data.display_mode,
                scope: data.scope,
                require_ack: data.require_ack,
                starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : undefined,
                expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
                priority: data.priority,
                targets: data.scope !== 'global' ? data.targets : undefined,
            };

            let createdId: number;

            if (isEditing) {
                await updateMutation.mutateAsync({ id: announcementId, data: payload });
                createdId = announcementId;
                toast({
                    title: 'Comunicado atualizado',
                    description: 'As alterações foram salvas.',
                });
            } else {
                const result = await createMutation.mutateAsync(payload);
                createdId = result.id;
                toast({
                    title: 'Comunicado criado',
                    description: 'O comunicado foi salvo como rascunho.',
                });
            }

            if (publish) {
                await publishMutation.mutateAsync(createdId);
                toast({
                    title: 'Comunicado publicado',
                    description: 'O comunicado está ativo agora.',
                });
            }

            navigate('/config/comunicados');
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar o comunicado.',
                variant: 'destructive',
            });
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

    // Loading state for editing
    if (isEditing && isLoadingAnnouncement) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <PageHeader
                    title={isEditing ? 'Editar Comunicado' : 'Novo Comunicado'}
                    description={isEditing ? 'Edite as informações do comunicado' : 'Crie um novo comunicado para sua equipe'}
                    icon={Megaphone}
                />
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-6">

                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Conteúdo do Comunicado
                            </CardTitle>
                            <CardDescription>
                                Defina o título e a mensagem que será exibida para os usuários.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Título *
                                            <InfoTooltip>
                                                Título curto e objetivo que aparecerá no carrossel e no topo do modal.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: Novo procedimento de vendas"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Mensagem *
                                            <InfoTooltip>
                                                Conteúdo completo do comunicado. Use a barra de ferramentas para formatação.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <RichTextEditor
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Escreva o conteúdo completo do comunicado..."
                                                minHeight="200px"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="excerpt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Resumo (opcional)
                                            <InfoTooltip>
                                                Resumo curto para exibição no carrossel. Se não informado, será gerado automaticamente.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Resumo curto para exibição no carrossel"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Type and Severity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Classificação
                            </CardTitle>
                            <CardDescription>
                                Define o tipo e a importância do comunicado.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Tipo *
                                            <InfoTooltip>
                                                <strong>Recado:</strong> Comunicado informativo geral.<br />
                                                <strong>Advertência:</strong> Aviso formal que exige confirmação.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="space-y-2"
                                            >
                                                <div className={cn(
                                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                                                    field.value === 'recado' ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/30' : 'hover:bg-muted/50'
                                                )}>
                                                    <RadioGroupItem value="recado" id="type-recado" />
                                                    <Label htmlFor="type-recado" className="flex items-center gap-2 cursor-pointer flex-1">
                                                        <Info className="w-4 h-4 text-blue-500" />
                                                        <div>
                                                            <p className="font-medium">Recado</p>
                                                            <p className="text-xs text-muted-foreground">Comunicado informativo</p>
                                                        </div>
                                                    </Label>
                                                </div>
                                                <div className={cn(
                                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                                                    field.value === 'advertencia' ? 'bg-red-50 border-red-300 dark:bg-red-950/30' : 'hover:bg-muted/50'
                                                )}>
                                                    <RadioGroupItem value="advertencia" id="type-advertencia" />
                                                    <Label htmlFor="type-advertencia" className="flex items-center gap-2 cursor-pointer flex-1">
                                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                                        <div>
                                                            <p className="font-medium">Advertência</p>
                                                            <p className="text-xs text-muted-foreground">Aviso formal (requer confirmação)</p>
                                                        </div>
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="severity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Severidade *
                                            <InfoTooltip>
                                                Define a cor e destaque visual do comunicado.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="space-y-2"
                                                disabled={watchType === 'advertencia'}
                                            >
                                                <div className={cn(
                                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                                                    field.value === 'info' ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/30' : 'hover:bg-muted/50',
                                                    watchType === 'advertencia' && 'opacity-50 cursor-not-allowed'
                                                )}>
                                                    <RadioGroupItem value="info" id="severity-info" disabled={watchType === 'advertencia'} />
                                                    <Label htmlFor="severity-info" className="flex items-center gap-2 cursor-pointer">
                                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                        Informativo
                                                    </Label>
                                                </div>
                                                <div className={cn(
                                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                                                    field.value === 'warning' ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/30' : 'hover:bg-muted/50',
                                                    watchType === 'advertencia' && 'opacity-50 cursor-not-allowed'
                                                )}>
                                                    <RadioGroupItem value="warning" id="severity-warning" disabled={watchType === 'advertencia'} />
                                                    <Label htmlFor="severity-warning" className="flex items-center gap-2 cursor-pointer">
                                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                                        Atenção
                                                    </Label>
                                                </div>
                                                <div className={cn(
                                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                                                    field.value === 'danger' ? 'bg-red-50 border-red-300 dark:bg-red-950/30' : 'hover:bg-muted/50'
                                                )}>
                                                    <RadioGroupItem value="danger" id="severity-danger" />
                                                    <Label htmlFor="severity-danger" className="flex items-center gap-2 cursor-pointer">
                                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                                        Urgente
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </FormControl>
                                        {watchType === 'advertencia' && (
                                            <FormDescription>
                                                Advertências sempre têm severidade "Urgente".
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Display Options */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="w-5 h-5" />
                                Modo de Exibição
                            </CardTitle>
                            <CardDescription>
                                Como o comunicado será apresentado para os usuários.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="display_mode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Onde exibir
                                            <InfoTooltip>
                                                <strong>Banner:</strong> Aparece no carrossel rotativo do dashboard.<br />
                                                <strong>Modal:</strong> Abre automaticamente como pop-up bloqueante.<br />
                                                <strong>Ambos:</strong> Combinação das duas opções.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="banner">
                                                    <div className="flex items-center gap-2">
                                                        <Bell className="w-4 h-4" />
                                                        Banner (carrossel no dashboard)
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="modal">
                                                    <div className="flex items-center gap-2">
                                                        <Monitor className="w-4 h-4" />
                                                        Modal (pop-up automático)
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="both">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" />
                                                        Ambos (banner + modal)
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="require_ack"
                                render={({ field }) => (
                                    <FormItem className={cn(
                                        'flex flex-row items-start space-x-3 space-y-0 p-4 rounded-lg border',
                                        field.value ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20' : ''
                                    )}>
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={watchDisplayMode === 'modal' || watchDisplayMode === 'both' || watchType === 'advertencia'}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4" />
                                                Exigir confirmação de leitura (ACK)
                                            </FormLabel>
                                            <FormDescription>
                                                O usuário precisará clicar em "Confirmar Recebimento" para fechar o aviso.
                                                {(watchDisplayMode === 'modal' || watchDisplayMode === 'both' || watchType === 'advertencia') && (
                                                    <span className="block text-amber-600 dark:text-amber-400 mt-1">
                                                        Obrigatório para modais e advertências.
                                                    </span>
                                                )}
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Scope */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Segmentação
                            </CardTitle>
                            <CardDescription>
                                Defina quem receberá este comunicado.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="scope"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Escopo *
                                            <InfoTooltip>
                                                <strong>Global:</strong> Todos os usuários do sistema.<br />
                                                <strong>Lojas:</strong> Usuários de lojas específicas.<br />
                                                <strong>Usuários:</strong> Usuários selecionados individualmente.<br />
                                                <strong>Cargos:</strong> Usuários com cargos específicos.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    // Clear targets when changing scope
                                                    form.setValue('targets', []);
                                                }}
                                                value={field.value}
                                                className="grid grid-cols-2 md:grid-cols-4 gap-2"
                                            >
                                                {canCreateGlobal && (
                                                    <div className={cn(
                                                        'flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer',
                                                        field.value === 'global' ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                                                    )}>
                                                        <RadioGroupItem value="global" id="scope-global" />
                                                        <Label htmlFor="scope-global" className="flex items-center gap-2 cursor-pointer">
                                                            <Users className="w-4 h-4" />
                                                            Global
                                                        </Label>
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    'flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer',
                                                    field.value === 'store' ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                                                )}>
                                                    <RadioGroupItem value="store" id="scope-store" />
                                                    <Label htmlFor="scope-store" className="flex items-center gap-2 cursor-pointer">
                                                        <Store className="w-4 h-4" />
                                                        Lojas
                                                    </Label>
                                                </div>
                                                <div className={cn(
                                                    'flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer',
                                                    field.value === 'role' ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                                                )}>
                                                    <RadioGroupItem value="role" id="scope-role" />
                                                    <Label htmlFor="scope-role" className="flex items-center gap-2 cursor-pointer">
                                                        <ShieldCheck className="w-4 h-4" />
                                                        Cargos
                                                    </Label>
                                                </div>
                                                {canCreateGlobal && (
                                                    <div className={cn(
                                                        'flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer',
                                                        field.value === 'user' ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                                                    )}>
                                                        <RadioGroupItem value="user" id="scope-user" />
                                                        <Label htmlFor="scope-user" className="flex items-center gap-2 cursor-pointer">
                                                            <User className="w-4 h-4" />
                                                            Usuários Específicos
                                                        </Label>
                                                    </div>
                                                )}
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Target Selector */}
                            <Controller
                                name="targets"
                                control={form.control}
                                render={({ field }) => (
                                    <TargetSelector
                                        scope={watchScope}
                                        value={field.value || []}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {form.formState.errors.targets && (
                                <p className="text-sm text-destructive">{form.formState.errors.targets.message}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Scheduling */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Agendamento
                            </CardTitle>
                            <CardDescription>
                                Defina quando o comunicado deve começar e expirar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="starts_at"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Data de início
                                            <InfoTooltip>
                                                Se não informado, o comunicado fica ativo imediatamente após publicação.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Deixe vazio para ativar imediatamente.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expires_at"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            Data de expiração
                                            <InfoTooltip>
                                                Após esta data, o comunicado não será mais exibido para os usuários.
                                            </InfoTooltip>
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Deixe vazio para não expirar automaticamente.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 sticky bottom-4 p-4 bg-background/95 backdrop-blur rounded-lg border shadow-lg">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="secondary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar Rascunho
                        </Button>
                        <Button
                            type="button"
                            onClick={form.handleSubmit((data) => onSubmit(data, true))}
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Salvar e Publicar
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default ComunicadoForm;
