/**
 * ModuleInstallWizard Component
 * 
 * 3-step wizard for installing a module:
 * 1. Confirm installation (name, description, dependencies)
 * 2. Initial configuration (optional)
 * 3. Activate for stores (optional)
 */

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Loader2,
    Package,
    Check,
    ChevronRight,
    ChevronLeft,
    Settings,
    Store,
    AlertTriangle,
    CheckCircle2,
    Rocket,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Module } from '@/types/modules.types';
import { useInstallModule, useActivateModuleForStore } from '@/hooks/api/use-modules';
import { modulesService, type ModuleStoreInfo } from '@/services/admin/modules.service';
import { useQuery } from '@tanstack/react-query';

interface ModuleInstallWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    module: Module;
}

type WizardStep = 'confirm' | 'config' | 'stores' | 'complete';

function getIconComponent(iconName: string): LucideIcon {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Package;
}

export const ModuleInstallWizard: React.FC<ModuleInstallWizardProps> = ({
    open,
    onOpenChange,
    module,
}) => {
    const [step, setStep] = useState<WizardStep>('confirm');
    const [selectedStores, setSelectedStores] = useState<number[]>([]);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const installMutation = useInstallModule();
    const activateStoreMutation = useActivateModuleForStore();

    // Fetch stores when on stores step
    const { data: stores, isLoading: isLoadingStores } = useQuery({
        queryKey: ['modules', module.id, 'stores'],
        queryFn: () => modulesService.getModuleStores(module.id),
        enabled: step === 'stores' && open,
    });

    const Icon = getIconComponent(module.icon);

    // Reset state when dialog closes
    const handleClose = () => {
        setStep('confirm');
        setSelectedStores([]);
        setIsInstalling(false);
        setIsComplete(false);
        onOpenChange(false);
    };

    // Handle install
    const handleInstall = async () => {
        setIsInstalling(true);
        try {
            await installMutation.mutateAsync(module.id);
            // Skip to stores step (config is optional in v1)
            setStep('stores');
        } catch (error) {
            // Error handled by mutation
        }
        setIsInstalling(false);
    };

    // Handle store selection
    const toggleStore = (storeId: number) => {
        setSelectedStores((prev) =>
            prev.includes(storeId)
                ? prev.filter((id) => id !== storeId)
                : [...prev, storeId]
        );
    };

    // Handle activate stores
    const handleActivateStores = async () => {
        setIsInstalling(true);
        try {
            for (const storeId of selectedStores) {
                await activateStoreMutation.mutateAsync({
                    moduleId: module.id,
                    storeId,
                });
            }
            setStep('complete');
            setIsComplete(true);
        } catch (error) {
            // Error handled by mutation
        }
        setIsInstalling(false);
    };

    // Skip stores step
    const handleSkipStores = () => {
        setStep('complete');
        setIsComplete(true);
    };

    // Get progress percentage
    const getProgress = () => {
        switch (step) {
            case 'confirm': return 0;
            case 'config': return 33;
            case 'stores': return 66;
            case 'complete': return 100;
        }
    };

    // Render step content
    const renderStep = () => {
        switch (step) {
            case 'confirm':
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Rocket className="h-5 w-5" />
                                Instalar Módulo
                            </DialogTitle>
                            <DialogDescription>
                                Confirme a instalação do módulo no sistema
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-6">
                            {/* Module info */}
                            <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <Icon className="h-8 w-8 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {module.name}
                                        <Badge variant="outline">v{module.version}</Badge>
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {module.description}
                                    </p>
                                </div>
                            </div>

                            {/* Dependencies warning */}
                            {module.dependencies && module.dependencies.length > 0 && (
                                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-amber-700">Dependências</p>
                                        <p className="text-sm text-muted-foreground">
                                            Este módulo depende de: {module.dependencies.join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* What will happen */}
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium">O que acontecerá:</p>
                                <ul className="text-sm text-muted-foreground space-y-1.5 ml-4">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-600" />
                                        O módulo será instalado e ativado globalmente
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-600" />
                                        Status e configurações padrão serão criados
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-600" />
                                        Você poderá ativar para lojas específicas
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button onClick={handleInstall} disabled={isInstalling}>
                                {isInstalling ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Package className="h-4 w-4 mr-2" />
                                )}
                                Instalar Módulo
                            </Button>
                        </DialogFooter>
                    </>
                );

            case 'stores':
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Ativar para Lojas
                            </DialogTitle>
                            <DialogDescription>
                                Selecione as lojas onde o módulo ficará disponível
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            {/* Success message */}
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3 mb-4">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                    Módulo instalado com sucesso!
                                </span>
                            </div>

                            {/* Stores list */}
                            {isLoadingStores ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-12 w-full" />
                                    ))}
                                </div>
                            ) : stores && stores.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {stores.map((store: ModuleStoreInfo) => (
                                        <div
                                            key={store.store_id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedStores.includes(store.store_id)
                                                    ? 'bg-primary/5 border-primary/50'
                                                    : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => toggleStore(store.store_id)}
                                        >
                                            <Checkbox
                                                checked={selectedStores.includes(store.store_id)}
                                                onCheckedChange={() => toggleStore(store.store_id)}
                                            />
                                            <Store className="h-4 w-4 text-muted-foreground" />
                                            <span className="flex-1">{store.store_name}</span>
                                            {store.is_active && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Já ativo
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Store className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p>Nenhuma loja disponível</p>
                                </div>
                            )}

                            {selectedStores.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-3">
                                    {selectedStores.length} loja(s) selecionada(s)
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button variant="ghost" onClick={handleSkipStores}>
                                Pular
                            </Button>
                            <Button
                                onClick={handleActivateStores}
                                disabled={selectedStores.length === 0 || isInstalling}
                            >
                                {isInstalling ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                )}
                                Ativar para {selectedStores.length} loja(s)
                            </Button>
                        </DialogFooter>
                    </>
                );

            case 'complete':
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                Instalação Concluída!
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <Icon className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{module.name}</h3>
                            <p className="text-muted-foreground">
                                O módulo foi instalado e está pronto para uso.
                            </p>
                            {selectedStores.length > 0 && (
                                <p className="text-sm text-green-600 mt-2">
                                    ✓ Ativado para {selectedStores.length} loja(s)
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Fechar
                            </Button>
                            <Button onClick={() => {
                                handleClose();
                                // Navigate to module config could be added here
                            }}>
                                <Settings className="h-4 w-4 mr-2" />
                                Configurar Módulo
                            </Button>
                        </DialogFooter>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                {/* Progress bar */}
                {!isComplete && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Passo {step === 'confirm' ? 1 : step === 'stores' ? 2 : 3} de 3</span>
                            <span>{getProgress()}%</span>
                        </div>
                        <Progress value={getProgress()} className="h-1.5" />
                    </div>
                )}

                {renderStep()}
            </DialogContent>
        </Dialog>
    );
};

export default ModuleInstallWizard;
