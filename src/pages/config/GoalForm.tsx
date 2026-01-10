/**
 * Goal Form Page
 * 
 * Dedicated page for creating/editing monthly goals.
 * Provides better UX than modal with organized sections and icons.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Target, Store, Calendar,
    DollarSign, Power, Users, Info, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { toast } from 'sonner';
import {
    useGoal,
    useCreateGoal,
    useUpdateGoal,
} from '@/hooks/api/use-goals';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { cn } from '@/lib/utils';

// ============================================================
// Constants
// ============================================================

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return `${MONTHS[parseInt(month) - 1]} ${year}`;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// ============================================================
// Types
// ============================================================

interface FormState {
    store_id: string;
    month: string;
    goal_amount: string;
    active: boolean;
}

const getInitialForm = (): FormState => {
    const now = new Date();
    return {
        store_id: '',
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        goal_amount: '',
        active: true,
    };
};

// ============================================================
// Main Component
// ============================================================

const GoalForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = id && id !== 'novo';
    const goalId = isEditing ? parseInt(id) : null;

    const [form, setForm] = useState<FormState>(getInitialForm());
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Queries and mutations
    const { data: goalData, isLoading: isLoadingGoal } = useGoal(goalId || 0);
    const { data: storesData } = useAdminStores({ per_page: 100 });
    const createMutation = useCreateGoal();
    const updateMutation = useUpdateGoal();

    // Load goal data when editing
    useEffect(() => {
        if (goalData) {
            setForm({
                store_id: String(goalData.store_id),
                month: goalData.month,
                goal_amount: String(goalData.goal_amount),
                active: goalData.active,
            });
        }
    }, [goalData]);

    // Validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!isEditing && !form.store_id) newErrors.store_id = 'Selecione uma loja';
        if (!isEditing && !form.month) newErrors.month = 'Selecione o mês';
        if (!form.goal_amount || parseFloat(form.goal_amount) <= 0) {
            newErrors.goal_amount = 'Informe um valor válido para a meta';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            if (isEditing && goalId) {
                await updateMutation.mutateAsync({
                    id: goalId,
                    data: {
                        goal_amount: parseFloat(form.goal_amount),
                        active: form.active,
                    },
                });
            } else {
                await createMutation.mutateAsync({
                    store_id: parseInt(form.store_id),
                    month: form.month,
                    goal_amount: parseFloat(form.goal_amount),
                    active: form.active,
                });
            }

            navigate('/config/metas');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar meta');
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    // Calculate splits status
    const splitsTotal = goalData?.splits?.reduce((acc, s) => acc + s.percent, 0) || 0;
    const hasSplits = goalData?.splits && goalData.splits.length > 0;
    const splitsComplete = Math.abs(splitsTotal - 100) < 0.01;

    if (isEditing && isLoadingGoal) {
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
                    <Button variant="ghost" size="icon" onClick={() => navigate('/config/metas')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title={isEditing ? 'Editar Meta' : 'Nova Meta Mensal'}
                        description={isEditing
                            ? `${goalData?.store?.name} - ${formatMonth(goalData?.month || '')}`
                            : 'Configure a meta de vendas para uma loja'}
                        icon={Target}
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
                {/* Loja e Período */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            Loja e Período
                        </CardTitle>
                        <CardDescription>
                            {isEditing
                                ? 'A loja e o mês não podem ser alterados após a criação'
                                : 'Selecione a loja e o mês de referência para esta meta'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label className="flex items-center gap-2">
                                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                Loja *
                            </Label>
                            {isEditing ? (
                                <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                    <span>{goalData?.store?.name}</span>
                                </div>
                            ) : (
                                <>
                                    <Select
                                        value={form.store_id}
                                        onValueChange={(v) => setForm(f => ({ ...f, store_id: v }))}
                                    >
                                        <SelectTrigger className={cn(errors.store_id && "border-destructive")}>
                                            <SelectValue placeholder="Selecione uma loja" />
                                        </SelectTrigger>
                                        <SelectContent>
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
                                    {errors.store_id && <p className="text-xs text-destructive mt-1">{errors.store_id}</p>}
                                </>
                            )}
                        </div>

                        <div>
                            <Label className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                Mês de Referência *
                            </Label>
                            {isEditing ? (
                                <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatMonth(goalData?.month || '')}</span>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        type="month"
                                        value={form.month}
                                        onChange={(e) => setForm(f => ({ ...f, month: e.target.value }))}
                                        className={cn(errors.month && "border-destructive")}
                                    />
                                    {errors.month && <p className="text-xs text-destructive mt-1">{errors.month}</p>}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Valor da Meta */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Valor da Meta
                        </CardTitle>
                        <CardDescription>
                            Defina o valor total de vendas esperado para o mês
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-w-md">
                            <Label className="flex items-center gap-2">
                                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                                Valor da Meta (R$) *
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                                <Input
                                    type="number"
                                    value={form.goal_amount}
                                    onChange={(e) => setForm(f => ({ ...f, goal_amount: e.target.value }))}
                                    placeholder="50000.00"
                                    min={0}
                                    step={100}
                                    className={cn("pl-10", errors.goal_amount && "border-destructive")}
                                />
                            </div>
                            {errors.goal_amount && <p className="text-xs text-destructive mt-1">{errors.goal_amount}</p>}
                        </div>

                        {form.goal_amount && parseFloat(form.goal_amount) > 0 && (
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-sm text-muted-foreground">Meta definida:</p>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(parseFloat(form.goal_amount))}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Distribuição - Only show when editing */}
                {isEditing && goalData && (
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Distribuição entre Vendedores
                            </CardTitle>
                            <CardDescription>
                                Defina quanto da meta cada vendedor deve atingir
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-full",
                                        splitsComplete ? "bg-green-500/10" : "bg-amber-500/10"
                                    )}>
                                        <Users className={cn(
                                            "h-5 w-5",
                                            splitsComplete ? "text-green-500" : "text-amber-500"
                                        )} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">
                                                {hasSplits ? `${goalData.splits?.length} vendedores` : 'Não configurada'}
                                            </p>
                                            <Badge variant={splitsComplete ? 'default' : 'destructive'}>
                                                {splitsComplete ? 'Completa (100%)' : `${splitsTotal.toFixed(0)}%`}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {splitsComplete
                                                ? 'A distribuição está completa'
                                                : 'Configure a distribuição para que os vendedores vejam suas metas individuais'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(`/config/metas/${goalId}/splits`)}
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Configurar Splits
                                    <ExternalLink className="h-3 w-3 ml-2" />
                                </Button>
                            </div>

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    A distribuição divide a meta entre os vendedores da loja.
                                    Cada vendedor verá sua meta individual no dashboard.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                )}

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
                                    <p className="font-medium">Meta Ativa</p>
                                    <p className="text-sm text-muted-foreground">
                                        {form.active
                                            ? 'Esta meta será visível nos dashboards'
                                            : 'Esta meta está desativada'}
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

export default GoalForm;
