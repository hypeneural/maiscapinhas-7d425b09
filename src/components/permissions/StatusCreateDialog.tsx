/**
 * StatusCreateDialog Component
 * 
 * Dialog for creating a new module status.
 * Includes transition configuration and validation.
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ModuleStatus, CreateStatusRequest } from '@/types/modules.types';
import { useCreateModuleStatus } from '@/hooks/api/use-modules';

interface StatusCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleId: string;
    existingStatuses: Record<string, ModuleStatus>;
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

// Backend allowed icons
const STATUS_ICONS = [
    'FileCheck', 'Truck', 'Store', 'Bell', 'CheckCircle', 'XCircle',
    'AlertCircle', 'Clock', 'User', 'UserCheck', 'Package', 'Send',
    'Plus', 'Edit', 'Trash', 'Eye', 'Settings', 'Shield', 'Key',
    'Palette', 'LayoutDashboard', 'ClipboardList', 'CreditCard',
];

const BADGE_VARIANTS = [
    { value: 'default', label: 'Padrão' },
    { value: 'secondary', label: 'Secundário' },
    { value: 'destructive', label: 'Destrutivo' },
    { value: 'outline', label: 'Contorno' },
    { value: 'success', label: 'Sucesso' },
    { value: 'warning', label: 'Aviso' },
];

function getIconComponent(iconName: string): LucideIcon {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    return icons[iconName] || LucideIcons.HelpCircle;
}

function generateSlug(label: string): string {
    return label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 50);
}

export const StatusCreateDialog: React.FC<StatusCreateDialogProps> = ({
    open,
    onOpenChange,
    moduleId,
    existingStatuses,
}) => {
    // Form state
    const [label, setLabel] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('blue');
    const [icon, setIcon] = useState('FileCheck');
    const [badgeVariant, setBadgeVariant] = useState('default');
    const [canEdit, setCanEdit] = useState(true);
    const [isFinal, setIsFinal] = useState(false);
    const [tooltip, setTooltip] = useState('');
    const [helpText, setHelpText] = useState('');
    const [transitionsTo, setTransitionsTo] = useState<string[]>([]);
    const [transitionsFrom, setTransitionsFrom] = useState<string[]>([]);

    const createMutation = useCreateModuleStatus();

    // Auto-generate name from label
    const handleLabelChange = (value: string) => {
        setLabel(value);
        if (!name || name === generateSlug(label)) {
            setName(generateSlug(value));
        }
    };

    // Reset form
    const resetForm = () => {
        setLabel('');
        setName('');
        setDescription('');
        setColor('blue');
        setIcon('FileCheck');
        setBadgeVariant('default');
        setCanEdit(true);
        setIsFinal(false);
        setTooltip('');
        setHelpText('');
        setTransitionsTo([]);
        setTransitionsFrom([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Generate next key (one more than max existing)
        const existingKeys = Object.keys(existingStatuses).map(k => parseInt(k)).filter(n => !isNaN(n));
        const nextKey = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 1;

        const data: CreateStatusRequest = {
            key: String(nextKey),
            status: {
                name,
                label,
                description: description || undefined,
                color,
                icon,
                badge_variant: badgeVariant,
                can_edit: canEdit,
                final: isFinal,
                tooltip: tooltip || undefined,
                help_text: helpText || undefined,
            },
            transitions_to: transitionsTo.length > 0 ? transitionsTo : undefined,
            transitions_from: transitionsFrom.length > 0 ? transitionsFrom : undefined,
        };

        await createMutation.mutateAsync({
            moduleId,
            data,
        });

        resetForm();
        onOpenChange(false);
    };

    // Get color hex for preview
    const selectedColor = COLORS.find(c => c.value === color);
    const colorHex = selectedColor?.hex || '#6b7280';
    const IconComponent = getIconComponent(icon);

    // Toggle transition
    const toggleTransitionTo = (statusKey: string) => {
        setTransitionsTo(prev =>
            prev.includes(statusKey)
                ? prev.filter(k => k !== statusKey)
                : [...prev, statusKey]
        );
    };

    const toggleTransitionFrom = (statusKey: string) => {
        setTransitionsFrom(prev =>
            prev.includes(statusKey)
                ? prev.filter(k => k !== statusKey)
                : [...prev, statusKey]
        );
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            onOpenChange(isOpen);
        }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Criar Novo Status
                        </DialogTitle>
                        <DialogDescription>
                            Adicione um novo status ao módulo com transições configuradas
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
                                <Badge
                                    variant={badgeVariant as any}
                                    style={{
                                        backgroundColor: `${colorHex}15`,
                                        borderColor: `${colorHex}40`,
                                        color: colorHex
                                    }}
                                >
                                    {label || 'Novo Status'}
                                </Badge>
                            </div>
                        </div>

                        {/* Label and Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">Nome Exibido *</Label>
                                <Input
                                    id="label"
                                    value={label}
                                    onChange={(e) => handleLabelChange(e.target.value)}
                                    placeholder="Ex: Em Análise"
                                    maxLength={50}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Slug (interno) *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                                    placeholder="em_analise"
                                    maxLength={50}
                                    pattern="^[a-z_]+$"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Apenas letras minúsculas e underscore
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
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

                        {/* Badge Variant and Switches */}
                        <div className="grid grid-cols-3 gap-4">
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

                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <Label htmlFor="canEdit" className="text-sm">Editável</Label>
                                <Switch id="canEdit" checked={canEdit} onCheckedChange={setCanEdit} />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <Label htmlFor="isFinal" className="text-sm">Status Final</Label>
                                <Switch id="isFinal" checked={isFinal} onCheckedChange={setIsFinal} />
                            </div>
                        </div>

                        {/* Tooltip and Help Text */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tooltip">Tooltip</Label>
                                <Input
                                    id="tooltip"
                                    value={tooltip}
                                    onChange={(e) => setTooltip(e.target.value)}
                                    placeholder="Texto exibido ao passar o mouse"
                                    maxLength={255}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="helpText">Texto de Ajuda</Label>
                                <Textarea
                                    id="helpText"
                                    value={helpText}
                                    onChange={(e) => setHelpText(e.target.value)}
                                    placeholder="Instruções detalhadas para o usuário"
                                    maxLength={500}
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Transitions */}
                        <div className="pt-4 border-t space-y-4">
                            <div>
                                <Label className="flex items-center gap-2 mb-3">
                                    <ArrowRight className="h-4 w-4" />
                                    Pode transicionar PARA
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(existingStatuses).map(([key, status]) => (
                                        <div
                                            key={key}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${transitionsTo.includes(key)
                                                    ? 'bg-green-500/10 border-green-500/50'
                                                    : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => toggleTransitionTo(key)}
                                        >
                                            <Checkbox checked={transitionsTo.includes(key)} />
                                            <span className="text-sm">{status.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="flex items-center gap-2 mb-3">
                                    <ArrowLeft className="h-4 w-4" />
                                    Pode receber transição DE
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(existingStatuses).map(([key, status]) => (
                                        <div
                                            key={key}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${transitionsFrom.includes(key)
                                                    ? 'bg-blue-500/10 border-blue-500/50'
                                                    : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => toggleTransitionFrom(key)}
                                        >
                                            <Checkbox checked={transitionsFrom.includes(key)} />
                                            <span className="text-sm">{status.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || !label.trim() || !name.trim()}
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Criar Status
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StatusCreateDialog;
