/**
 * StatusEditDialog Component
 * 
 * Dialog for editing module status properties.
 * Supports editing: label, color, icon, badge variant, tooltip, help_text
 */

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, HelpCircle, Palette, Save, X, Trash2, AlertTriangle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ModuleStatus, UpdateStatusRequest, ModuleSchema, PreviewImpactResponse } from '@/types/modules.types';
import { useUpdateModuleStatus, useModuleSchema, usePreviewImpact, useDeleteModuleStatus } from '@/hooks/api/use-modules';

interface StatusEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleId: string;
    statusKey: string;
    status: ModuleStatus;
}

// Available colors
const COLORS = [
    { value: 'blue', label: 'Azul', hex: '#3b82f6' },
    { value: 'red', label: 'Vermelho', hex: '#ef4444' },
    { value: 'yellow', label: 'Amarelo', hex: '#eab308' },
    { value: 'green', label: 'Verde', hex: '#22c55e' },
    { value: 'purple', label: 'Roxo', hex: '#a855f7' },
    { value: 'gray', label: 'Cinza', hex: '#6b7280' },
    { value: 'orange', label: 'Laranja', hex: '#f97316' },
    { value: 'cyan', label: 'Ciano', hex: '#06b6d4' },
    { value: 'pink', label: 'Rosa', hex: '#ec4899' },
];

// Common icons for status
const STATUS_ICONS = [
    'FileCheck', 'Truck', 'Store', 'Bell', 'CheckCircle', 'XCircle',
    'AlertCircle', 'Clock', 'User', 'UserCheck', 'Package', 'Send',
    'Plus', 'Edit', 'Trash', 'Eye', 'Settings', 'Shield', 'Key',
    'Palette', 'LayoutDashboard', 'ClipboardList', 'CreditCard',
    'RefreshCw', 'ArrowRight', 'Loader', 'Hourglass', 'Star',
];

// Badge variants
const BADGE_VARIANTS = [
    { value: 'default', label: 'Padrão' },
    { value: 'secondary', label: 'Secundário' },
    { value: 'destructive', label: 'Destrutivo' },
    { value: 'outline', label: 'Contorno' },
    { value: 'success', label: 'Sucesso' },
    { value: 'warning', label: 'Aviso' },
];

function getIconComponent(iconName: string): LucideIcon {
    const icons = LucideIcons as Record<string, LucideIcon>;
    return icons[iconName] || LucideIcons.HelpCircle;
}

export const StatusEditDialog: React.FC<StatusEditDialogProps> = ({
    open,
    onOpenChange,
    moduleId,
    statusKey,
    status,
}) => {
    // Form state
    const [label, setLabel] = useState(status.label);
    const [description, setDescription] = useState(status.description || '');
    const [color, setColor] = useState(status.color);
    const [icon, setIcon] = useState(status.icon || 'FileCheck');
    const [badgeVariant, setBadgeVariant] = useState(status.badge_variant);
    const [canEdit, setCanEdit] = useState(status.can_edit);
    const [isFinal, setIsFinal] = useState(status.final);
    const [tooltip, setTooltip] = useState((status as any).tooltip || '');
    const [helpText, setHelpText] = useState((status as any).help_text || '');

    // Hooks
    const { data: schema } = useModuleSchema(moduleId);
    const updateMutation = useUpdateModuleStatus();
    const previewMutation = usePreviewImpact();
    const deleteMutation = useDeleteModuleStatus();

    // Delete state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteImpact, setDeleteImpact] = useState<PreviewImpactResponse | null>(null);
    const [isLoadingImpact, setIsLoadingImpact] = useState(false);

    // Reset form when status changes
    useEffect(() => {
        setLabel(status.label);
        setDescription(status.description || '');
        setColor(status.color);
        setIcon(status.icon || 'FileCheck');
        setBadgeVariant(status.badge_variant);
        setCanEdit(status.can_edit);
        setIsFinal(status.final);
        setTooltip((status as any).tooltip || '');
        setHelpText((status as any).help_text || '');
        // Reset delete state
        setShowDeleteConfirm(false);
        setDeleteImpact(null);
    }, [status]);

    // Handle delete click - load impact first
    const handleDeleteClick = async () => {
        setIsLoadingImpact(true);
        try {
            const impact = await previewMutation.mutateAsync({
                moduleId,
                data: {
                    action: 'delete_status',
                    status_key: statusKey,
                },
            });
            setDeleteImpact(impact);
        } catch {
            // If preview fails, allow delete anyway
            setDeleteImpact({
                action: 'delete_status',
                status_key: statusKey,
                can_proceed: true,
                affected_records: 0,
                warnings: [],
                suggestions: [],
            });
        }
        setIsLoadingImpact(false);
        setShowDeleteConfirm(true);
    };

    // Handle delete confirm
    const handleDelete = async () => {
        await deleteMutation.mutateAsync({
            moduleId,
            statusKey,
            force: deleteImpact ? !deleteImpact.can_proceed : false,
        });
        onOpenChange(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: UpdateStatusRequest = {
            label,
            description: description || undefined,
            color,
            icon,
            badge_variant: badgeVariant,
            can_edit: canEdit,
            final: isFinal,
            tooltip: tooltip || undefined,
            help_text: helpText || undefined,
        };

        await updateMutation.mutateAsync({
            moduleId,
            statusKey,
            data,
        });

        onOpenChange(false);
    };

    // Get color hex for preview
    const selectedColor = COLORS.find(c => c.value === color);
    const colorHex = selectedColor?.hex || '#6b7280';
    const IconComponent = getIconComponent(icon);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Editar Status
                        </DialogTitle>
                        <DialogDescription>
                            Altere as propriedades do status "{status.label}"
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Preview */}
                        <div className="p-4 rounded-lg bg-muted/30 border">
                            <p className="text-xs text-muted-foreground mb-2">Preview</p>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${colorHex}20` }}
                                >
                                    <IconComponent className="h-5 w-5" style={{ color: colorHex }} />
                                </div>
                                <div>
                                    <Badge
                                        variant={badgeVariant as any}
                                        style={{
                                            backgroundColor: `${colorHex}15`,
                                            borderColor: `${colorHex}40`,
                                            color: colorHex
                                        }}
                                    >
                                        {label || 'Nome do Status'}
                                    </Badge>
                                    {tooltip && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            💬 {tooltip}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Label */}
                        <div className="space-y-2">
                            <Label htmlFor="label">
                                Nome do Status *
                            </Label>
                            <Input
                                id="label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="Ex: Disponível para Retirada"
                                maxLength={50}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                {label.length}/50 caracteres
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Descrição
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descrição interna do status"
                                maxLength={255}
                                rows={2}
                            />
                        </div>

                        {/* Color and Icon Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Color */}
                            <div className="space-y-2">
                                <Label>Cor</Label>
                                <Select value={color} onValueChange={setColor}>
                                    <SelectTrigger>
                                        <SelectValue>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: colorHex }}
                                                />
                                                {selectedColor?.label}
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COLORS.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: c.hex }}
                                                    />
                                                    {c.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Icon */}
                            <div className="space-y-2">
                                <Label>Ícone</Label>
                                <Select value={icon} onValueChange={setIcon}>
                                    <SelectTrigger>
                                        <SelectValue>
                                            <div className="flex items-center gap-2">
                                                <IconComponent className="h-4 w-4" />
                                                {icon}
                                            </div>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {STATUS_ICONS.map((iconName) => {
                                            const Icon = getIconComponent(iconName);
                                            return (
                                                <SelectItem key={iconName} value={iconName}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        {iconName}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Badge Variant */}
                        <div className="space-y-2">
                            <Label>Estilo do Badge</Label>
                            <Select value={badgeVariant} onValueChange={setBadgeVariant}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {BADGE_VARIANTS.map((v) => (
                                        <SelectItem key={v.value} value={v.value}>
                                            {v.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tooltip */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="tooltip">Tooltip</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger type="button">
                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Texto exibido ao passar o mouse sobre o status
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Input
                                id="tooltip"
                                value={tooltip}
                                onChange={(e) => setTooltip(e.target.value)}
                                placeholder="Ex: Produto pronto para ser retirado pelo cliente"
                                maxLength={255}
                            />
                        </div>

                        {/* Help Text */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="helpText">Texto de Ajuda</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger type="button">
                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Texto de ajuda exibido abaixo do status para orientar o usuário
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Textarea
                                id="helpText"
                                value={helpText}
                                onChange={(e) => setHelpText(e.target.value)}
                                placeholder="Ex: O vendedor deve avisar o cliente via WhatsApp"
                                maxLength={500}
                                rows={2}
                            />
                        </div>

                        {/* Switches Row */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                    <p className="text-sm font-medium">Editável</p>
                                    <p className="text-xs text-muted-foreground">
                                        Permite editar registros neste status
                                    </p>
                                </div>
                                <Switch
                                    checked={canEdit}
                                    onCheckedChange={setCanEdit}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                    <p className="text-sm font-medium">Status Final</p>
                                    <p className="text-xs text-muted-foreground">
                                        Encerra o fluxo de trabalho
                                    </p>
                                </div>
                                <Switch
                                    checked={isFinal}
                                    onCheckedChange={setIsFinal}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <div className="flex-1">
                            {!showDeleteConfirm ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteClick()}
                                    disabled={updateMutation.isPending || isLoadingImpact || deleteMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Deletar
                                </Button>
                            ) : (
                                <div className="text-left space-y-2">
                                    <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                                        <AlertTriangle className="h-4 w-4" />
                                        Confirmar deleção?
                                    </div>
                                    {deleteImpact && deleteImpact.affected_records > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            ⚠️ {deleteImpact.affected_records} registros afetados
                                        </p>
                                    )}
                                    {deleteImpact && deleteImpact.warnings.length > 0 && (
                                        <ul className="text-xs text-muted-foreground list-disc ml-4">
                                            {deleteImpact.warnings.slice(0, 2).map((w, i) => (
                                                <li key={i}>{w}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleDelete}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {deleteMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 mr-1" />
                                            )}
                                            Confirmar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!showDeleteConfirm && (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={updateMutation.isPending}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending || !label.trim()}
                                >
                                    {updateMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-1" />
                                    )}
                                    Salvar Alterações
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StatusEditDialog;
