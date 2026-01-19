/**
 * Prize Rule Dialog Component
 * 
 * Create/Edit dialog for prize rules with tooltips from glossary.
 */

import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreatePrizeRule, useUpdatePrizeRule } from '@/hooks/api/use-prize-rules';
import { useWheelPrizes } from '@/hooks/api/use-wheel';
import { LabelWithTooltip } from '@/components/GlossaryTooltip';
import { COOLDOWN_SCOPE_LABELS } from '@/lib/config/prize-rules-glossary';
import type { PrizeRule, CreatePrizeRuleRequest, CooldownScope } from '@/types/wheel.types';

interface PrizeRuleDialogProps {
    campaignKey: string;
    rule: PrizeRule | null; // null = create mode
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface FormData {
    prize_id: number | null;
    min_gap_spins: number;
    cooldown_seconds: number;
    cooldown_scope: CooldownScope;
    max_per_hour: number | null;
    max_per_day: number | null;
    pacing_enabled: boolean;
    pacing_buffer: number;
    priority: number;
    active: boolean;
}

const defaultFormData: FormData = {
    prize_id: null,
    min_gap_spins: 0,
    cooldown_seconds: 0,
    cooldown_scope: 'campaign',
    max_per_hour: null,
    max_per_day: null,
    pacing_enabled: false,
    pacing_buffer: 1.20,
    priority: 100,
    active: true,
};

export function PrizeRuleDialog({ campaignKey, rule, open, onOpenChange }: PrizeRuleDialogProps) {
    const { toast } = useToast();
    const createRule = useCreatePrizeRule(campaignKey);
    const updateRule = useUpdatePrizeRule(campaignKey);
    const { data: prizesData } = useWheelPrizes();

    const isEditing = !!rule;
    const prizes = prizesData?.data || [];

    const [formData, setFormData] = useState<FormData>(defaultFormData);

    // Reset form when dialog opens/closes or rule changes
    useEffect(() => {
        if (open) {
            if (rule) {
                setFormData({
                    prize_id: rule.prize_id,
                    min_gap_spins: rule.min_gap_spins,
                    cooldown_seconds: rule.cooldown_seconds,
                    cooldown_scope: rule.cooldown_scope,
                    max_per_hour: rule.max_per_hour,
                    max_per_day: rule.max_per_day,
                    pacing_enabled: rule.pacing_enabled,
                    pacing_buffer: rule.pacing_buffer,
                    priority: rule.priority,
                    active: rule.active,
                });
            } else {
                setFormData(defaultFormData);
            }
        }
    }, [open, rule]);

    const handleSubmit = async () => {
        if (!isEditing && !formData.prize_id) {
            toast({
                title: 'Campo obrigatório',
                description: 'Selecione um prêmio.',
                variant: 'destructive',
            });
            return;
        }

        try {
            if (isEditing && rule) {
                // Update mode - don't send prize_id
                const { prize_id: _, ...updateData } = formData;
                await updateRule.mutateAsync({
                    ruleId: rule.id,
                    data: updateData,
                });
                toast({
                    title: 'Regra atualizada',
                    description: 'As alterações foram salvas.',
                });
            } else {
                // Create mode
                const payload: CreatePrizeRuleRequest = {
                    prize_id: formData.prize_id!,
                    min_gap_spins: formData.min_gap_spins,
                    cooldown_seconds: formData.cooldown_seconds,
                    cooldown_scope: formData.cooldown_scope,
                    max_per_hour: formData.max_per_hour,
                    max_per_day: formData.max_per_day,
                    pacing_enabled: formData.pacing_enabled,
                    pacing_buffer: formData.pacing_buffer,
                    priority: formData.priority,
                    active: formData.active,
                };
                await createRule.mutateAsync(payload);
                toast({
                    title: 'Regra criada',
                    description: 'A nova regra foi configurada.',
                });
            }
            onOpenChange(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Ocorreu um erro.';
            toast({
                title: 'Erro',
                description: message,
                variant: 'destructive',
            });
        }
    };

    const isPending = createRule.isPending || updateRule.isPending;

    // Helper to format seconds as minutes for display
    const secondsToMinutes = (seconds: number) => Math.round(seconds / 60);
    const minutesToSeconds = (minutes: number) => minutes * 60;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? `Editar Regra: ${rule?.prize.name}` : 'Nova Regra de Prêmio'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Configure quando e com que frequência este prêmio pode sair.'
                            : 'Selecione um prêmio e configure as regras de distribuição.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Prize Selection (only for create) */}
                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="prize_id">Prêmio *</Label>
                            <Select
                                value={formData.prize_id?.toString() || ''}
                                onValueChange={(v) => setFormData({ ...formData, prize_id: Number(v) })}
                            >
                                <SelectTrigger id="prize_id">
                                    <SelectValue placeholder="Selecione um prêmio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {prizes.map((prize) => (
                                        <SelectItem key={prize.id} value={prize.id.toString()}>
                                            {prize.icon && `${prize.icon} `}{prize.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Separator />

                    {/* Cooldown Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            🔄 Cooldown
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <LabelWithTooltip
                                    label="Mínimo de jogadas"
                                    term="min_gap_spins"
                                    htmlFor="min_gap_spins"
                                />
                                <Input
                                    id="min_gap_spins"
                                    type="number"
                                    min={0}
                                    value={formData.min_gap_spins}
                                    onChange={(e) => setFormData({ ...formData, min_gap_spins: Number(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <LabelWithTooltip
                                    label="Tempo mínimo (min)"
                                    term="cooldown_seconds"
                                    htmlFor="cooldown_minutes"
                                />
                                <Input
                                    id="cooldown_minutes"
                                    type="number"
                                    min={0}
                                    value={secondsToMinutes(formData.cooldown_seconds)}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        cooldown_seconds: minutesToSeconds(Number(e.target.value))
                                    })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <LabelWithTooltip
                                label="Escopo do cooldown"
                                term="cooldown_scope"
                                htmlFor="cooldown_scope"
                            />
                            <Select
                                value={formData.cooldown_scope}
                                onValueChange={(v) => setFormData({ ...formData, cooldown_scope: v as CooldownScope })}
                            >
                                <SelectTrigger id="cooldown_scope">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(COOLDOWN_SCOPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    {/* Limits Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            📊 Limites
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <LabelWithTooltip
                                    label="Máximo por hora"
                                    term="max_per_hour"
                                    htmlFor="max_per_hour"
                                />
                                <Input
                                    id="max_per_hour"
                                    type="number"
                                    min={0}
                                    placeholder="Sem limite"
                                    value={formData.max_per_hour ?? ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        max_per_hour: e.target.value ? Number(e.target.value) : null
                                    })}
                                />
                            </div>

                            <div className="space-y-2">
                                <LabelWithTooltip
                                    label="Máximo por dia"
                                    term="max_per_day"
                                    htmlFor="max_per_day"
                                />
                                <Input
                                    id="max_per_day"
                                    type="number"
                                    min={0}
                                    placeholder="Sem limite"
                                    value={formData.max_per_day ?? ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        max_per_day: e.target.value ? Number(e.target.value) : null
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Pacing Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            🎯 Pacing
                        </h4>

                        <div className="flex items-center justify-between">
                            <LabelWithTooltip
                                label="Distribuir ao longo da campanha"
                                term="pacing_enabled"
                            />
                            <Switch
                                checked={formData.pacing_enabled}
                                onCheckedChange={(checked) => setFormData({ ...formData, pacing_enabled: checked })}
                            />
                        </div>

                        {formData.pacing_enabled && (
                            <div className="space-y-2">
                                <LabelWithTooltip
                                    label="Buffer (%)"
                                    term="pacing_buffer"
                                    htmlFor="pacing_buffer"
                                />
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="pacing_buffer"
                                        type="number"
                                        min={100}
                                        max={200}
                                        value={Math.round(formData.pacing_buffer * 100)}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            pacing_buffer: Number(e.target.value) / 100
                                        })}
                                        className="w-24"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        ({Math.round((formData.pacing_buffer - 1) * 100)}% acima do ritmo ideal)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Other Settings */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            ⚡ Outros
                        </h4>

                        <div className="space-y-2">
                            <LabelWithTooltip
                                label="Prioridade"
                                term="priority"
                                htmlFor="priority"
                            />
                            <Input
                                id="priority"
                                type="number"
                                min={1}
                                max={1000}
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                                className="w-24"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Regra ativa</Label>
                            <Switch
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Salvar' : 'Criar Regra'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
