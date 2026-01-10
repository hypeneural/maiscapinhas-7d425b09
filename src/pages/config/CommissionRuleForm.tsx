/**
 * Commission Rule Form Page
 * 
 * Dedicated page for creating/editing commission rules.
 * Provides better UX than modal with organized sections and icons.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Percent, FileText, Globe, Store,
    Calendar, Layers, Calculator, Power, Target, TrendingUp, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/PageHeader';
import { TierBuilder, type TierField } from '@/components/crud';
import { toast } from 'sonner';
import {
    useCommissionRule,
    useCreateCommissionRule,
    useUpdateCommissionRule,
} from '@/hooks/api/use-rules';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { cn } from '@/lib/utils';
import type { CommissionTier, CreateCommissionRuleRequest } from '@/types/admin.types';

// ============================================================
// Constants
// ============================================================

const TIER_FIELDS: TierField[] = [
    { key: 'min_rate', label: '% da Meta', type: 'number', suffix: '%', min: 0, max: 200, step: 5 },
    { key: 'commission_rate', label: '% Comissão', type: 'number', suffix: '%', min: 0, max: 100, step: 0.5 },
];

const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '0%';
    return `${value.toFixed(1)}%`;
};

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
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

const defaultTiers: CommissionTier[] = [
    { min_rate: 0, commission_rate: 1 },
    { min_rate: 80, commission_rate: 2 },
    { min_rate: 100, commission_rate: 3 },
];

// ============================================================
// Commission Simulator Component
// ============================================================

interface SimulatorProps {
    tiers: CommissionTier[];
}

function CommissionSimulator({ tiers }: SimulatorProps) {
    const [goalPercent, setGoalPercent] = useState<string>('');
    const [salesValue, setSalesValue] = useState<string>('');

    const result = useMemo(() => {
        const percent = parseFloat(goalPercent) || 0;
        const sales = parseFloat(salesValue) || 0;

        if (percent === 0 || sales === 0 || tiers.length === 0) return null;

        const sortedTiers = [...tiers].sort((a, b) => b.min_rate - a.min_rate);
        const applicableTier = sortedTiers.find(t => percent >= t.min_rate);

        if (!applicableTier) return null;

        const commission = (sales * applicableTier.commission_rate) / 100;
        return { tier: applicableTier, commission };
    }, [goalPercent, salesValue, tiers]);

    return (
        <div className="grid grid-cols-3 gap-4">
            <div>
                <Label className="text-sm flex items-center gap-2 mb-2">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    % Atingimento da Meta
                </Label>
                <div className="relative">
                    <Input
                        type="number"
                        value={goalPercent}
                        onChange={(e) => setGoalPercent(e.target.value)}
                        placeholder="100"
                        className="pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            <div>
                <Label className="text-sm flex items-center gap-2 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    Valor das Vendas
                </Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                        type="number"
                        value={salesValue}
                        onChange={(e) => setSalesValue(e.target.value)}
                        placeholder="50000"
                        className="pl-10"
                    />
                </div>
            </div>
            <div className="flex flex-col justify-end">
                {result ? (
                    <div className="text-right p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-xs text-muted-foreground">
                            Taxa: {formatPercent(result.tier.commission_rate)}
                        </p>
                        <p className="text-xl font-bold text-green-600">
                            {formatCurrency(result.commission)}
                        </p>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground text-center p-3 rounded-lg border border-dashed">
                        {tiers.length === 0 ? 'Adicione faixas' : 'Preencha os campos'}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// Main Component
// ============================================================

const CommissionRuleForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const ruleId = isEditing ? parseInt(id) : null;

    const [form, setForm] = useState<FormState>(initialForm);
    const [tiers, setTiers] = useState<CommissionTier[]>(defaultTiers);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Queries and mutations
    const { data: ruleData, isLoading: isLoadingRule } = useCommissionRule(ruleId || 0);
    const { data: storesData } = useAdminStores({ per_page: 100 });
    const createMutation = useCreateCommissionRule();
    const updateMutation = useUpdateCommissionRule();

    // Load rule data when editing
    useEffect(() => {
        if (ruleData) {
            setForm({
                name: ruleData.name,
                store_id: ruleData.store_id ? String(ruleData.store_id) : null,
                effective_from: ruleData.effective_from,
                effective_to: ruleData.effective_to || '',
                active: ruleData.active,
            });
            setTiers(ruleData.config_json || []);
        }
    }, [ruleData]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!form.effective_from) newErrors.effective_from = 'Data de início é obrigatória';
        if (tiers.length === 0) newErrors.tiers = 'Adicione pelo menos uma faixa de comissão';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const data: CreateCommissionRuleRequest = {
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

            navigate('/config/comissoes');
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
                    <Button variant="ghost" size="icon" onClick={() => navigate('/config/comissoes')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={isEditing ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
                        description={isEditing ? `Editando ${ruleData?.name}` : 'Configure a regra de comissão por atingimento de meta'}
                        icon={Percent}
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
                                value={form.name}
                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Comissão Padrão 2026"
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
                                            <Globe className="h-4 w-4 text-green-600" />
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
                                value={form.effective_from}
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
                                value={form.effective_to}
                                onChange={(e) => setForm(f => ({ ...f, effective_to: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Deixe em branco para vigência indeterminada
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Faixas de Comissão */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Faixas de Comissão
                        </CardTitle>
                        <CardDescription>
                            Configure as faixas progressivas de comissão
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>% da Meta:</strong> Percentual de atingimento da meta mensal do vendedor.
                                <br />
                                <strong>% Comissão:</strong> Taxa aplicada sobre o total de vendas do período.
                                <br />
                                <span className="text-muted-foreground">
                                    Exemplo: Se o vendedor atingiu 100% da meta e vendeu R$ 50.000, com 3% de comissão, receberá R$ 1.500.
                                </span>
                            </AlertDescription>
                        </Alert>

                        <TierBuilder
                            value={tiers as unknown as Record<string, unknown>[]}
                            onChange={(newTiers) => setTiers(newTiers as unknown as CommissionTier[])}
                            fields={TIER_FIELDS}
                            addLabel="Adicionar Faixa"
                            defaultTier={{ min_rate: 0, commission_rate: 0 }}
                        />

                        {errors.tiers && (
                            <p className="text-sm text-destructive">{errors.tiers}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Simulador */}
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-green-600" />
                            Simulador de Comissão
                        </CardTitle>
                        <CardDescription>
                            Teste os valores antes de salvar a regra
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CommissionSimulator tiers={tiers} />
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
                                            ? 'Esta regra será aplicada nos cálculos de comissão'
                                            : 'Esta regra está desativada e não será usada'}
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={form.active}
                                onCheckedChange={(checked) => setForm(f => ({ ...f, active: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default CommissionRuleForm;
