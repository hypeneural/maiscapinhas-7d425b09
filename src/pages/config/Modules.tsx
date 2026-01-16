/**
 * Modules Page
 * 
 * Lists all modules in the system with activation status.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package,
    PackageCheck,
    PackageX,
    Play,
    Pause,
    Settings,
    Store,
    Zap,
    AlertTriangle,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/crud';
import {
    useModules,
    useActivateModule,
    useDeactivateModule
} from '@/hooks/api/use-modules';
import * as LucideIcons from 'lucide-react';
import type { Module } from '@/types/modules.types';
import type { LucideIcon } from 'lucide-react';
import ModuleInstallWizard from '@/components/permissions/ModuleInstallWizard';

const STATUS_COLORS = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    inactive: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    not_installed: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

const STATUS_LABELS = {
    active: 'Ativo',
    inactive: 'Inativo',
    not_installed: 'Não instalado',
};

function getIconComponent(iconName: string): LucideIcon {
    const icons = LucideIcons as Record<string, LucideIcon>;
    return icons[iconName] || Package;
}

interface ModuleCardProps {
    module: Module;
    onActivate: () => void;
    onDeactivate: () => void;
    onConfigure: () => void;
    onInstall: () => void;
    isToggling: boolean;
}

function ModuleCard({ module, onActivate, onDeactivate, onConfigure, onInstall, isToggling }: ModuleCardProps) {
    const Icon = getIconComponent(module.icon);
    const isActive = module.status === 'active';
    const isInstalled = module.is_installed;

    return (
        <Card className={`transition-all ${!isActive && 'opacity-75'}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${isActive
                            ? 'bg-gradient-to-br from-primary/20 to-primary/5'
                            : 'bg-muted'
                            }`}>
                            <Icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                {module.name}
                                {module.is_core && (
                                    <Badge variant="outline" className="text-xs">
                                        Core
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {module.description}
                            </CardDescription>
                        </div>
                    </div>

                    {isInstalled && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={isActive}
                                            onCheckedChange={(checked) => checked ? onActivate() : onDeactivate()}
                                            disabled={isToggling || module.is_core}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {module.is_core ? 'Módulo core não pode ser desativado' : (isActive ? 'Desativar' : 'Ativar')}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={STATUS_COLORS[module.status]}>
                            {STATUS_LABELS[module.status]}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                            <Store className="h-3 w-3" />
                            {module.stores_count} lojas
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                            <Zap className="h-3 w-3" />
                            {module.permission_count} permissões
                        </Badge>
                    </div>

                    {isInstalled ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onConfigure}
                            className="gap-1"
                        >
                            <Settings className="h-4 w-4" />
                            Configurar
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={onInstall}
                            className="gap-1"
                        >
                            <Download className="h-4 w-4" />
                            Instalar
                        </Button>
                    )}
                </div>

                {module.dependencies && module.dependencies.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Depende de: {module.dependencies.join(', ')}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const Modules: React.FC = () => {
    const navigate = useNavigate();
    const [confirmAction, setConfirmAction] = useState<{ module: Module; action: 'activate' | 'deactivate' } | null>(null);
    const [installModule, setInstallModule] = useState<Module | null>(null);

    const { data: modules, isLoading } = useModules();
    const activateMutation = useActivateModule();
    const deactivateMutation = useDeactivateModule();

    const handleActivate = (module: Module) => {
        setConfirmAction({ module, action: 'activate' });
    };

    const handleDeactivate = (module: Module) => {
        setConfirmAction({ module, action: 'deactivate' });
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;

        const { module, action } = confirmAction;

        if (action === 'activate') {
            await activateMutation.mutateAsync(module.id);
        } else {
            await deactivateMutation.mutateAsync(module.id);
        }

        setConfirmAction(null);
    };

    const isToggling = activateMutation.isPending || deactivateMutation.isPending;

    // Stats
    const activeModules = modules?.filter(m => m.status === 'active').length ?? 0;
    const totalModules = modules?.length ?? 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Módulos"
                description="Gerencie os módulos instalados no sistema"
                icon={Package}
            />

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 rounded-lg bg-green-500/10">
                            <PackageCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{activeModules}</p>
                            <p className="text-sm text-muted-foreground">Módulos ativos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 rounded-lg bg-slate-500/10">
                            <PackageX className="h-6 w-6 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalModules - activeModules}</p>
                            <p className="text-sm text-muted-foreground">Módulos inativos</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalModules}</p>
                            <p className="text-sm text-muted-foreground">Total de módulos</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modules List */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            ) : modules && modules.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {modules.map((module) => (
                        <ModuleCard
                            key={module.id}
                            module={module}
                            onActivate={() => handleActivate(module)}
                            onDeactivate={() => handleDeactivate(module)}
                            onConfigure={() => navigate(`/config/modules/${module.id}`)}
                            onInstall={() => setInstallModule(module)}
                            isToggling={isToggling}
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum módulo encontrado</p>
                    </CardContent>
                </Card>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={() => setConfirmAction(null)}
                title={confirmAction?.action === 'activate' ? 'Ativar Módulo' : 'Desativar Módulo'}
                description={
                    <p>
                        Tem certeza que deseja {confirmAction?.action === 'activate' ? 'ativar' : 'desativar'}{' '}
                        <strong>{confirmAction?.module.name}</strong>?
                        <br />
                        <span className="text-muted-foreground text-sm">
                            {confirmAction?.action === 'activate'
                                ? 'O módulo será habilitado para todas as lojas.'
                                : 'O módulo será desabilitado para todas as lojas.'}
                        </span>
                    </p>
                }
                confirmText={confirmAction?.action === 'activate' ? 'Ativar' : 'Desativar'}
                onConfirm={handleConfirm}
                loading={isToggling}
                variant={confirmAction?.action === 'deactivate' ? 'destructive' : 'default'}
            />

            {/* Install Wizard */}
            {installModule && (
                <ModuleInstallWizard
                    open={!!installModule}
                    onOpenChange={(open) => !open && setInstallModule(null)}
                    module={installModule}
                />
            )}
        </div>
    );
};

export default Modules;
