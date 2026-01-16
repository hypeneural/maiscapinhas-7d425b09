/**
 * ModuleAdvancedSettings Component
 * 
 * Dynamic form for module configuration based on schema from backend.
 * Renders fields dynamically with proper types and dependencies.
 */

import React, { useState, useEffect } from 'react';
import {
    Bell,
    Clock,
    CheckSquare,
    GitBranch,
    Settings,
    RefreshCw,
    Save,
    Loader2,
    AlertTriangle,
    HelpCircle,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useModuleConfig, useUpdateModuleConfig, useResetModuleConfig } from '@/hooks/api/use-modules';
import type { ConfigField, ConfigSection } from '@/types/modules.types';

interface ModuleAdvancedSettingsProps {
    moduleId: string;
}

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
    Bell,
    Clock,
    CheckSquare,
    GitBranch,
    Settings,
};

function getIconComponent(iconName: string): LucideIcon {
    if (ICON_MAP[iconName]) return ICON_MAP[iconName];
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || Settings;
}

// Dynamic field renderer
interface ConfigFieldInputProps {
    field: ConfigField;
    fieldKey: string;
    value: unknown;
    onChange: (value: unknown) => void;
    disabled?: boolean;
}

const ConfigFieldInput: React.FC<ConfigFieldInputProps> = ({
    field,
    fieldKey,
    value,
    onChange,
    disabled = false,
}) => {
    switch (field.type) {
        case 'switch':
            return (
                <Switch
                    id={fieldKey}
                    checked={Boolean(value)}
                    onCheckedChange={onChange}
                    disabled={disabled}
                />
            );

        case 'number':
            return (
                <Input
                    id={fieldKey}
                    type="number"
                    value={Number(value ?? field.default ?? 0)}
                    min={field.min}
                    max={field.max}
                    onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-24"
                />
            );

        case 'select':
            return (
                <Select
                    value={String(value ?? field.default ?? '')}
                    onValueChange={onChange}
                    disabled={disabled}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options && Object.entries(field.options).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );

        case 'text':
            return (
                <Input
                    id={fieldKey}
                    type="text"
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="max-w-xs"
                />
            );

        case 'textarea':
            return (
                <Textarea
                    id={fieldKey}
                    value={String(value ?? '')}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    rows={3}
                    className="max-w-md"
                />
            );

        default:
            return null;
    }
};

export const ModuleAdvancedSettings: React.FC<ModuleAdvancedSettingsProps> = ({
    moduleId,
}) => {
    const { data, isLoading, isError } = useModuleConfig(moduleId);
    const updateMutation = useUpdateModuleConfig();
    const resetMutation = useResetModuleConfig();

    const [localConfig, setLocalConfig] = useState<Record<string, unknown>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);

    // Sync local config with server
    useEffect(() => {
        if (data?.config) {
            setLocalConfig(data.config);
            setHasChanges(false);
        }
    }, [data?.config]);

    // Handle field change
    const handleFieldChange = (fieldKey: string, value: unknown) => {
        setLocalConfig((prev) => ({
            ...prev,
            [fieldKey]: value,
        }));
        setHasChanges(true);
    };

    // Check if field should be visible (depends_on logic)
    const isFieldVisible = (field: ConfigField): boolean => {
        if (!field.depends_on) return true;
        return Boolean(localConfig[field.depends_on]);
    };

    // Handle save
    const handleSave = async () => {
        await updateMutation.mutateAsync({
            moduleId,
            config: localConfig,
        });
        setHasChanges(false);
    };

    // Handle reset
    const handleReset = async () => {
        await resetMutation.mutateAsync(moduleId);
        setShowResetDialog(false);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-6 w-12" />
                            </div>
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-56" />
                                <Skeleton className="h-6 w-12" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Error state
    if (isError || !data?.schema) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive/50" />
                    <p className="text-muted-foreground">
                        Não foi possível carregar as configurações.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar Novamente
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const { schema } = data;

    // Empty schema - no configs available yet
    const hasSections = Object.keys(schema.sections).length > 0;

    if (!hasSections) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="font-medium mb-1">Nenhuma configuração disponível</p>
                    <p className="text-sm text-muted-foreground">
                        O endpoint de configurações para este módulo ainda não foi implementado no backend.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sections */}
            {Object.entries(schema.sections).map(([sectionKey, section]) => {
                const Icon = getIconComponent(section.icon);

                return (
                    <Card key={sectionKey}>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Icon className="h-4 w-4" />
                                {section.label}
                            </CardTitle>
                            {section.description && (
                                <CardDescription>{section.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(section.fields).map(([fieldKey, field]) => {
                                if (!isFieldVisible(field)) return null;

                                return (
                                    <div
                                        key={fieldKey}
                                        className="flex items-start justify-between gap-4 py-2"
                                    >
                                        <div className="space-y-0.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Label
                                                    htmlFor={fieldKey}
                                                    className="font-medium"
                                                >
                                                    {field.label}
                                                </Label>
                                                {field.hint && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger type="button">
                                                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {field.hint}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            {field.hint && field.type !== 'switch' && (
                                                <p className="text-xs text-muted-foreground">
                                                    {field.hint}
                                                </p>
                                            )}
                                        </div>
                                        <ConfigFieldInput
                                            field={field}
                                            fieldKey={fieldKey}
                                            value={localConfig[fieldKey]}
                                            onChange={(value) => handleFieldChange(fieldKey, value)}
                                            disabled={updateMutation.isPending || resetMutation.isPending}
                                        />
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                );
            })}

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <Button
                    variant="outline"
                    onClick={() => setShowResetDialog(true)}
                    disabled={updateMutation.isPending || resetMutation.isPending}
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restaurar Padrões
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || updateMutation.isPending || resetMutation.isPending}
                >
                    {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Alterações
                </Button>
            </div>

            {/* Reset Confirmation Dialog */}
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurar Configurações Padrão?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso irá reverter todas as configurações para os valores padrão do sistema.
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={resetMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReset}
                            disabled={resetMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {resetMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Restaurar Padrões
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ModuleAdvancedSettings;
