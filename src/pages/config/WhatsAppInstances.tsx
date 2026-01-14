/**
 * WhatsApp Instances Page
 * 
 * Super Admin page for managing WhatsApp instances via Evolution API.
 * Displays a list of instances with filters, status indicators, and actions.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Plus, Search, Star, StarOff, MoreVertical, Eye, Edit2, Trash2,
    QrCode, RefreshCw, TestTube, Loader2, Phone, Check, X, Power, PowerOff,
    Globe, Store, User, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/PageHeader';
import { WhatsAppConnectModal } from '@/components/admin/WhatsAppConnectModal';
import { cn } from '@/lib/utils';
import {
    useWhatsAppInstances,
    useDeleteWhatsAppInstance,
    useSetDefaultInstance,
    useUpdateWhatsAppInstance,
    useTestConnection,
    useCheckInstanceState,
} from '@/hooks/api/use-whatsapp-instances';
import type {
    WhatsAppInstanceResponse,
    WhatsAppInstanceFilters,
    InstanceScope,
    InstanceStatus,
} from '@/types/whatsapp-instances.types';
import { SCOPE_BADGE_MAP, STATUS_BADGE_MAP } from '@/types/whatsapp-instances.types';

// ============================================================
// Constants
// ============================================================

const SCOPE_OPTIONS: { value: InstanceScope | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos os Escopos' },
    { value: 'global', label: 'Global' },
    { value: 'store', label: 'Por Loja' },
    { value: 'user', label: 'Por Usuário' },
];

const STATUS_OPTIONS: { value: InstanceStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'connected', label: '🟢 Conectado' },
    { value: 'disconnected', label: '🔴 Desconectado' },
    { value: 'connecting', label: '🟡 Conectando' },
    { value: 'unknown', label: '⚪ Desconhecido' },
];

// ============================================================
// Helper Components
// ============================================================

/**
 * Scope badge with appropriate icon and color
 */
function ScopeBadge({ scope, storeName, userName }: {
    scope: InstanceScope;
    storeName?: string | null;
    userName?: string | null;
}) {
    const config = SCOPE_BADGE_MAP[scope];
    const Icon = scope === 'global' ? Globe : scope === 'store' ? Store : User;

    const label = scope === 'store' && storeName
        ? storeName
        : scope === 'user' && userName
            ? userName
            : config.label;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-flex">
                        <Badge variant="outline" className={cn('gap-1', config.className)}>
                            <Icon className="h-3 w-3" />
                            <span className="max-w-[100px] truncate">{label}</span>
                        </Badge>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {scope === 'global' && 'Disponível para todo o sistema'}
                        {scope === 'store' && `Exclusivo para: ${storeName || 'Loja específica'}`}
                        {scope === 'user' && `Exclusivo para: ${userName || 'Usuário específico'}`}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Status indicator with icon and tooltip
 */
function StatusIndicator({ status }: { status: InstanceStatus }) {
    const config = STATUS_BADGE_MAP[status];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className={cn(
                            'text-sm font-medium',
                            status === 'connected' && 'text-green-600',
                            status === 'disconnected' && 'text-red-600',
                            status === 'connecting' && 'text-yellow-600',
                            status === 'unknown' && 'text-gray-500',
                        )}>
                            {config.label}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {status === 'connected' && 'WhatsApp online e pronto para enviar'}
                        {status === 'disconnected' && 'Precisa reconectar via QR Code'}
                        {status === 'connecting' && 'Aguardando conexão...'}
                        {status === 'unknown' && 'Estado desconhecido - verifique a conexão'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// ============================================================
// Main Page Component
// ============================================================

const WhatsAppInstances: React.FC = () => {
    const navigate = useNavigate();

    // Filters state
    const [search, setSearch] = useState('');
    const [scopeFilter, setScopeFilter] = useState<InstanceScope | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<InstanceStatus | 'all'>('all');
    const [activeFilter, setActiveFilter] = useState<boolean | 'all'>('all');

    // Modal states
    const [deleteInstance, setDeleteInstance] = useState<WhatsAppInstanceResponse | null>(null);
    const [connectInstance, setConnectInstance] = useState<WhatsAppInstanceResponse | null>(null);

    // Build filters object
    const filters: WhatsAppInstanceFilters = useMemo(() => ({
        search: search || undefined,
        scope: scopeFilter !== 'all' ? scopeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        is_active: activeFilter !== 'all' ? activeFilter : undefined,
        per_page: 50,
    }), [search, scopeFilter, statusFilter, activeFilter]);

    // Queries and mutations
    const { data, isLoading, refetch } = useWhatsAppInstances(filters);
    const deleteMutation = useDeleteWhatsAppInstance();
    const setDefaultMutation = useSetDefaultInstance();
    const updateMutation = useUpdateWhatsAppInstance();
    const testMutation = useTestConnection();

    const instances = data?.data || [];

    // Handlers
    const handleDelete = async () => {
        if (!deleteInstance) return;
        await deleteMutation.mutateAsync(deleteInstance.id);
        setDeleteInstance(null);
    };

    const handleSetDefault = async (instance: WhatsAppInstanceResponse) => {
        await setDefaultMutation.mutateAsync(instance.id);
    };

    const handleToggleActive = async (instance: WhatsAppInstanceResponse) => {
        await updateMutation.mutateAsync({
            id: instance.id,
            data: { is_active: !instance.is_active },
        });
    };

    const handleTest = async (instance: WhatsAppInstanceResponse) => {
        await testMutation.mutateAsync(instance.id);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Instâncias WhatsApp"
                    description="Gerencie conexões com o WhatsApp via Evolution API"
                    icon={MessageSquare}
                />
                <Button onClick={() => navigate('/config/whatsapp/novo')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Instância
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, URL ou telefone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={scopeFilter} onValueChange={(v) => setScopeFilter(v as InstanceScope | 'all')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Escopo" />
                    </SelectTrigger>
                    <SelectContent>
                        {SCOPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InstanceStatus | 'all')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={activeFilter === 'all' ? 'all' : activeFilter ? 'true' : 'false'}
                    onValueChange={(v) => setActiveFilter(v === 'all' ? 'all' : v === 'true')}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Ativo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Ativos</SelectItem>
                        <SelectItem value="false">Inativos</SelectItem>
                    </SelectContent>
                </Select>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => refetch()}>
                                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Atualizar lista</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="flex items-center gap-1">
                                            <Star className="h-4 w-4" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Instância padrão usada quando não especificar outra</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Escopo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Número</TableHead>
                            <TableHead className="w-[80px]">Ativo</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : instances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>Nenhuma instância encontrada</p>
                                    <p className="text-sm mt-1">
                                        Clique em "Nova Instância" para criar uma conexão WhatsApp
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            instances.map((instance) => (
                                <TableRow key={instance.id}>
                                    {/* Favorite */}
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleSetDefault(instance)}
                                                        disabled={setDefaultMutation.isPending}
                                                    >
                                                        {instance.is_default ? (
                                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        ) : (
                                                            <StarOff className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        {instance.is_default
                                                            ? 'Esta é a instância favorita'
                                                            : 'Definir como favorita'}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>

                                    {/* Name */}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{instance.name}</span>
                                            {instance.has_api_key && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="inline-flex">
                                                                <Badge variant="outline" className="text-xs">
                                                                    🔑
                                                                </Badge>
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>API Key configurada</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Scope */}
                                    <TableCell>
                                        <ScopeBadge
                                            scope={instance.scope}
                                            storeName={instance.store?.name}
                                            userName={instance.user?.name}
                                        />
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        <StatusIndicator status={instance.status} />
                                    </TableCell>

                                    {/* Phone */}
                                    <TableCell>
                                        {instance.phone_e164 ? (
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{instance.phone_e164}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>

                                    {/* Active Toggle */}
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div>
                                                        <Switch
                                                            checked={instance.is_active}
                                                            onCheckedChange={() => handleToggleActive(instance)}
                                                            disabled={updateMutation.isPending}
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        {instance.is_active
                                                            ? 'Clique para desativar'
                                                            : 'Instâncias inativas não podem enviar mensagens'}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/config/whatsapp/${instance.id}`)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ver detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate(`/config/whatsapp/${instance.id}`)}>
                                                    <Edit2 className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSetDefault(instance)}>
                                                    <Star className="h-4 w-4 mr-2" />
                                                    Definir como favorita
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => setConnectInstance(instance)}>
                                                    <QrCode className="h-4 w-4 mr-2" />
                                                    Conectar WhatsApp
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTest(instance)}>
                                                    <TestTube className="h-4 w-4 mr-2" />
                                                    Testar conexão
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setDeleteInstance(instance)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination info */}
            {data?.meta && (
                <div className="text-sm text-muted-foreground text-center">
                    Mostrando {instances.length} de {data.meta.total} instâncias
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteInstance} onOpenChange={() => setDeleteInstance(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Instância</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja excluir a instância "{deleteInstance?.name}"?
                            Esta ação pode ser revertida pelo administrador do banco de dados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Connect Modal */}
            {connectInstance && (
                <WhatsAppConnectModal
                    instance={connectInstance}
                    open={!!connectInstance}
                    onOpenChange={(open) => !open && setConnectInstance(null)}
                />
            )}
        </div>
    );
};

export default WhatsAppInstances;
