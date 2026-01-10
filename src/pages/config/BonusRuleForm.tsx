/**
 * Bonus Rule Form Page
 * 
 * Dedicated page for creating/editing bonus rules.
 * Provides better UX than modal with organized sections and icons.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Gift, FileText, Globe, Store,
    Calendar, Layers, Calculator, Power, DollarSign, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/PageHeader';
import { TierBuilder, type TierField } from '@/components/crud';
import { toast } from 'sonner';
import {
    useBonusRule,
    useCreateBonusRule,
    useUpdateBonusRule,
} from '@/hooks/api/use-rules';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { cn } from '@/lib/utils';
import type { BonusTier, CreateBonusRuleRequest } from '@/types/admin.types';

// ============================================================
// Constants
// ============================================================

const TIER_FIELDS: TierField[] = [
    { key: 'min_sales', label: 'Vendas Mínimas', type: 'number', prefix: 'R$', min: 0, step: 100 },
    { key: 'bonus', label: 'Bônus', type: 'number', prefix: 'R$', min: 0, step: 5 },
];

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// Helper to format ISO date to yyyy-MM-dd for date inputs
const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    // Handle ISO format like "2025-12-09T00:00:00.000000Z"
    if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
    }
    return dateStr;
};

// ============================================================
// Types
// ============================================================

interface FormState {
    name: string;
    store_id: string | null;
    effective_from: string;
    effective_to: string;
    active: boolean;
}

const initialForm: FormState = {
    name: '',
    store_id: null,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    active: true,
};

// ============================================================
// Bonus Simulator Component
// ============================================================

interface SimulatorProps {
    tiers: BonusTier[];
}

function BonusSimulator({ tiers }: SimulatorProps) {
    const [testValue, setTestValue] = useState<string>('');

    const result = useMemo(() => {
        const value = parseFloat(testValue) || 0;
        if (value === 0 || tiers.length === 0) return null;

        const sortedTiers = [...tiers].sort((a, b) => b.min_sales - a.min_sales);
        const applicableTier = sortedTiers.find(t => value >= t.min_sales);

        return applicableTier || null;
    }, [testValue, tiers]);

    return (
        <div className="flex items-center gap-4">
            <div className="flex-1">
                <Label className="text-sm flex items-center gap-2 mb-2">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    Valor das Vendas
                </Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                        type="number"
                        value={testValue}
                        onChange={(e) => setTestValue(e.target.value)}
                        placeholder="50000"
                        className="pl-10"
                    />
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-end">
                {result ? (
                    <div className="text-right p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-xs text-muted-foreground">
                            Faixa: ≥ {formatCurrency(result.min_sales)}
                        </p>
                        <p className="text-xl font-bold text-primary">
                            {formatCurrency(result.bonus)}
                        </p>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground text-center p-3 rounded-lg border border-dashed">
                        {tiers.length === 0 ? 'Adicione faixas' : 'Digite um valor'}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// Main Component
// ============================================================

const BonusRuleForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const ruleId = isEditing ? parseInt(id) : null;

    const [form, setForm] = useState<FormState>(initialForm);
    const [tiers, setTiers] = useState<BonusTier[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Queries and mutations
    const { data: ruleData, isLoading: isLoadingRule } = useBonusRule(ruleId || 0);
    const { data: storesData } = useAdminStores({ per_page: 100 });
    const createMutation = useCreateBonusRule();
    const updateMutation = useUpdateBonusRule();

    // Load rule data when editing
    useEffect(() => {
        if (ruleData) {
            setForm({
                name: ruleData.name || '',
                store_id: ruleData.store_id ? String(ruleData.store_id) : null,
                effective_from: formatDateForInput(ruleData.effective_from),
                effective_to: formatDateForInput(ruleData.effective_to),
                active: ruleData.active ?? true,
            });
            setTiers(ruleData.config_json || []);
        }
    }, [ruleData]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name || !form.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!form.effective_from) newErrors.effective_from = 'Data de início é obrigatória';
        if (tiers.length === 0) newErrors.tiers = 'Adicione pelo menos uma faixa de bônus';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const data: CreateBonusRuleRequest = {
                name: form.name,
                store_id: form.store_id ? parseInt(form.store_id) : null,
                config_json: tiers,
                effective_from: form.effective_from,
                effective_to: form.effective_to || null,
                active: form.active,
            };

            if (isEditing && ruleId) {
                await updateMutation.mutateAsync({ id: ruleId, data });
            } else {
                await createMutation.mutateAsync(data);
            }

            navigate('/config/bonus');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar regra');
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    if (isEditing && isLoadingRule) {
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
                    <Button variant="ghost" size="icon" onClick={() => navigate('/config/bonus')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={isEditing ? 'Editar Regra de Bônus' : 'Nova Regra de Bônus'}
                        description={isEditing ? `Editando ${ruleData?.name}` : 'Configure a regra de bonificação por volume de vendas'}
                        icon={Gift}
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identificação */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Identificação
                        </CardTitle>
                        <CardDescription>
                            Defina o nome e o escopo de aplicação desta regra
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                Nome da Regra *
                            </Label>
                            <Input
                                value={form.name || ''}
                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Bônus Vendas Q1 2026"
                                className={cn(errors.name && "border-destructive")}
                            />
                            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label className="flex items-center gap-2">
                                {form.store_id ? (
                                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                Escopo
                            </Label>
                            <Select
                                value={form.store_id || 'global'}
                                onValueChange={(v) => setForm(f => ({ ...f, store_id: v === 'global' ? null : v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-blue-600" />
                                            Global (todas as lojas)
                                        </div>
                                    </SelectItem>
                                    {storesData?.data.map(store => (
                                        <SelectItem key={store.id} value={String(store.id)}>
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4" />
                                                {store.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Regras específicas de loja sobrescrevem regras globais
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Vigência */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Vigência
                        </CardTitle>
                        <CardDescription>
                            Defina o período em que esta regra estará ativa
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                Data de Início *
                            </Label>
                            <Input
                                type="date"
                                value={form.effective_from || ''}
                                onChange={(e) => setForm(f => ({ ...f, effective_from: e.target.value }))}
                                className={cn(errors.effective_from && "border-destructive")}
                            />
                            {errors.effective_from && <p className="text-xs text-destructive mt-1">{errors.effective_from}</p>}
                        </div>

                        <div>
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                Data de Fim (opcional)
                            </Label>
                            <Input
                                type="date"
                                value={form.effective_to || ''}
                                onChange={(e) => setForm(f => ({ ...f, effective_to: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Deixe em branco para vigência indeterminada
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Faixas de Bônus */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Faixas de Bônus
                        </CardTitle>
                        <CardDescription>
                            Configure as faixas progressivas de bonificação
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Vendas Mínimas:</strong> Valor total de vendas que o vendedor precisa atingir.
                                <br />
                                <strong>Bônus:</strong> Valor fixo de bonificação que o vendedor receberá.
                                <br />
                                <span className="text-muted-foreground">
                                    O vendedor recebe o bônus da maior faixa que atingir.
                                </span>
                            </AlertDescription>
                        </Alert>

                        <TierBuilder
                            value={tiers as unknown as Record<string, unknown>[]}
                            onChange={(newTiers) => setTiers(newTiers as unknown as BonusTier[])}
                            fields={TIER_FIELDS}
                            addLabel="Adicionar Faixa"
                            defaultTier={{ min_sales: 0, bonus: 0 }}
                        />

                        {errors.tiers && (
                            <p className="text-sm text-destructive">{errors.tiers}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Simulador */}
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            Simulador de Bônus
                        </CardTitle>
                        <CardDescription>
                            Teste os valores antes de salvar a regra
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BonusSimulator tiers={tiers} />
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
                    <CardContent>
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-full",
                                    form.active ? "bg-green-500/10" : "bg-muted"
                                )}>
                                    <Power className={cn(
                                        "h-5 w-5",
                                        form.active ? "text-green-500" : "text-muted-foreground"
                                    )} />
                                </div>
                                <div>
                                    <p className="font-medium">Regra Ativa</p>
                                    <p className="text-sm text-muted-foreground">
                                        {form.active
                                            ? 'Esta regra será aplicada nos cálculos de bônus'
                                            : 'Esta regra está desativada e não será usada'}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={form.active ?? true}
                                onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default BonusRuleForm;
