/**
 * ModuleDetail Page
 * 
 * Shows detailed configuration for a specific module.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Package,
    ArrowLeft,
    ArrowRight,
    Store,
    Settings,
    Zap,
    Eye,
    CheckCircle,
    XCircle,
    Loader2,
    Clock,
    Edit2,
    Plus,
    Trash2,
    Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useModuleFull,
    useActivateModuleForStore,
    useDeactivateModuleForStore
} from '@/hooks/api/use-modules';
import { useQuery } from '@tanstack/react-query';
import { modulesService, type ModuleStoreInfo } from '@/services/admin/modules.service';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import TransitionMatrix from '@/components/permissions/TransitionMatrix';
import StatusEditDialog from '@/components/permissions/StatusEditDialog';
import StatusCreateDialog from '@/components/permissions/StatusCreateDialog';
import StatusDeleteDialog from '@/components/permissions/StatusDeleteDialog';
import ModuleTextsDialog from '@/components/permissions/ModuleTextsDialog';
import ModuleAuditLog from '@/components/permissions/ModuleAuditLog';
import ModuleAdvancedSettings from '@/components/permissions/ModuleAdvancedSettings';

function getIconComponent(iconName: string): LucideIcon {
    const icons = LucideIcons as Record<string, LucideIcon>;
    return icons[iconName] || Package;
}

const ModuleDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const moduleId = id ?? '';

    const { data: module, isLoading } = useModuleFull(moduleId);
    const { data: stores, isLoading: isLoadingStores } = useQuery({
        queryKey: ['modules', moduleId, 'stores'],
        queryFn: () => modulesService.getModuleStores(moduleId),
        enabled: !!moduleId,
    });

    const activateForStoreMutation = useActivateModuleForStore();
    const deactivateForStoreMutation = useDeactivateModuleForStore();

    // Status editing state
    const [selectedStatus, setSelectedStatus] = useState<{ key: string; status: any } | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState<{ key: string; status: any } | null>(null);
    const [showTextsDialog, setShowTextsDialog] = useState(false);

    const [togglingStoreId, setTogglingStoreId] = useState<number | null>(null);

    const handleToggleStore = async (store: ModuleStoreInfo) => {
        setTogglingStoreId(store.store_id);
        try {
            if (store.is_active) {
                await deactivateForStoreMutation.mutateAsync({ moduleId, storeId: store.store_id });
            } else {
                await activateForStoreMutation.mutateAsync({ moduleId, storeId: store.store_id });
            }
        } finally {
            setTogglingStoreId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!module) {
        return (
            <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Módulo não encontrado</p>
                <Button variant="link" onClick={() => navigate('/config/modules')}>
                    Voltar para módulos
                </Button>
            </div>
        );
    }

    const Icon = getIconComponent(module.icon || 'Package');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/config/modules')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <PageHeader
                        title={module.name}
                        description={module.texts?.page_description || 'Configuração do módulo'}
                    />
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                    <TabsTrigger value="overview" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="stores" className="gap-2">
                        <Store className="h-4 w-4" />
                        Lojas ({stores?.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="gap-2">
                        <Zap className="h-4 w-4" />
                        Permissões
                    </TabsTrigger>
                    <TabsTrigger value="transitions" className="gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Transições
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Configurações
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Histórico
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Informações</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={module.is_active ? 'default' : 'secondary'}>
                                        {module.is_active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Versão</span>
                                    <span className="font-mono">{module.version || '1.0.0'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Instalado</span>
                                    {module.is_installed ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Textos</CardTitle>
                                        <CardDescription>Labels configurados para o módulo</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowTextsDialog(true)}
                                    >
                                        <Type className="h-4 w-4 mr-1" />
                                        Editar
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {module.texts && Object.entries(module.texts).slice(0, 5).map(([key, value]) => (
                                    <div key={key} className="flex justify-between gap-4">
                                        <span className="text-muted-foreground text-sm truncate">{key}</span>
                                        <span className="text-sm truncate max-w-[200px]">{String(value)}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Statuses */}
                    {module.statuses && Object.keys(module.statuses).length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">Status Disponíveis</CardTitle>
                                        <CardDescription>{Object.keys(module.statuses).length} status configurados</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowCreateDialog(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Novo Status
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(module.statuses).map(([id, status]) => (
                                        <div
                                            key={id}
                                            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors group"
                                            style={{
                                                borderColor: `${status.color}30`,
                                            }}
                                            onClick={() => setSelectedStatus({ key: id, status })}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                                                style={{
                                                    backgroundColor: `${status.color}20`,
                                                }}
                                            >
                                                {status.icon ? (
                                                    (() => {
                                                        const Icon = getIconComponent(status.icon);
                                                        return <Icon className="h-4 w-4" style={{ color: status.color }} />;
                                                    })()
                                                ) : (
                                                    <span className="text-xs font-bold" style={{ color: status.color }}>{id}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{status.label}</p>
                                                {(status as any).tooltip && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {(status as any).tooltip}
                                                    </p>
                                                )}
                                            </div>
                                            <Edit2 className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Stores Tab */}
                <TabsContent value="stores" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Lojas</CardTitle>
                            <CardDescription>Ative ou desative o módulo por loja</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingStores ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : stores && stores.length > 0 ? (
                                <div className="space-y-3">
                                    {stores.map((store) => (
                                        <div
                                            key={store.store_id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Store className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{store.store_name}</p>
                                                    {store.config && Object.keys(store.config).length > 0 && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Configuração personalizada
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant={store.is_active ? 'default' : 'secondary'}>
                                                    {store.is_active ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                                {togglingStoreId === store.store_id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Switch
                                                        checked={store.is_active}
                                                        onCheckedChange={() => handleToggleStore(store)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    Nenhuma loja encontrada
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Permissões do Módulo</CardTitle>
                            <CardDescription>Permissões geradas por este módulo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {module.permissions && module.permissions.length > 0 ? (
                                <div className="grid gap-2 md:grid-cols-2">
                                    {module.permissions.map((perm, i) => {
                                        if (!perm) return null;

                                        // Handle both string and object formats
                                        const isObject = typeof perm === 'object' && perm !== null;
                                        const permObj = isObject ? perm as { name: string; display_name?: string; type?: string } : null;
                                        const permName = isObject ? permObj!.name : String(perm);
                                        const permDisplay = isObject ? (permObj!.display_name || permObj!.name) : String(perm);
                                        const permType = isObject ? permObj!.type : undefined;

                                        return (
                                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg border">
                                                <Zap className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <span className="text-sm font-mono">{permName}</span>
                                                    {permDisplay !== permName && (
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            ({permDisplay})
                                                        </span>
                                                    )}
                                                </div>
                                                {permType && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {permType}
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    Nenhuma permissão configurada
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Transitions Tab */}
                <TabsContent value="transitions" className="mt-4">
                    {module.statuses && module.transitions && (
                        <TransitionMatrix
                            moduleId={moduleId}
                            statuses={module.statuses}
                            transitions={module.transitions}
                            roleMatrix={module.transition_role_matrix || {}}
                        />
                    )}
                    {!module.statuses && (
                        <Card>
                            <CardContent className="text-center py-8 text-muted-foreground">
                                Este módulo não possui configuração de status
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-4">
                    <ModuleAdvancedSettings moduleId={moduleId} />
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-4">
                    <ModuleAuditLog moduleId={moduleId} />
                </TabsContent>
            </Tabs>

            {/* Status Edit Dialog */}
            {selectedStatus && module && (
                <StatusEditDialog
                    open={!!selectedStatus}
                    onOpenChange={(open) => !open && setSelectedStatus(null)}
                    moduleId={moduleId}
                    statusKey={selectedStatus.key}
                    status={selectedStatus.status}
                />
            )}

            {/* Status Create Dialog */}
            {module && (
                <StatusCreateDialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                    moduleId={moduleId}
                    existingStatuses={module.statuses || {}}
                />
            )}

            {/* Status Delete Dialog */}
            {deleteStatus && module && (
                <StatusDeleteDialog
                    open={!!deleteStatus}
                    onOpenChange={(open) => !open && setDeleteStatus(null)}
                    moduleId={moduleId}
                    statusKey={deleteStatus.key}
                    status={deleteStatus.status}
                />
            )}

            {/* Module Texts Dialog */}
            {module && (
                <ModuleTextsDialog
                    open={showTextsDialog}
                    onOpenChange={setShowTextsDialog}
                    moduleId={moduleId}
                    moduleName={module.name}
                />
            )}
        </div>
    );
};

export default ModuleDetail;
