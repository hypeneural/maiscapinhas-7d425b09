/**
 * Goal Splits Form Page
 * 
 * Dedicated page for configuring goal distribution among sellers.
 * Provides better UX than modal for managing percentage splits.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, Users, Target, Store,
    Calendar, PieChart, Info, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/PageHeader';
import { PercentSplitter, type SplitUser, type SplitValue } from '@/components/crud';
import { toast } from 'sonner';
import { useGoal, useSetGoalSplits } from '@/hooks/api/use-goals';
import { useStoreUsers } from '@/hooks/api/use-admin-stores';
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

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
        const parsed = Number(value.replace(',', '.'));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

// ============================================================
// Main Component
// ============================================================

const GoalSplitsForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const goalId = id ? parseInt(id) : null;

    const [splits, setSplits] = useState<SplitValue[]>([]);

    // Queries and mutations
    const { data: goalData, isLoading: isLoadingGoal } = useGoal(goalId || 0);
    const { data: storeUsers } = useStoreUsers(goalData?.store_id || 0);
    const setSplitsMutation = useSetGoalSplits();

    // Load splits when goal data arrives
    useEffect(() => {
        if (goalData?.splits) {
            setSplits(goalData.splits.map(s => ({
                user_id: Number(s.user_id),
                percent: toNumber(s.percent),
            })));
        }
    }, [goalData]);

    // Filter only vendedor role
    const vendedores: SplitUser[] = useMemo(() => {
        return (storeUsers || [])
            .filter(u => u.role === 'vendedor')
            .map(u => ({
                id: u.user_id,
                name: u.user_name,
            }));
    }, [storeUsers]);

    // Calculate totals
    const splitsTotal = splits.reduce((acc, s) => acc + toNumber(s.percent), 0);
    const isSplitsValid = Math.abs(splitsTotal - 100) < 0.01;

    // Submit handler
    const handleSubmit = async () => {
        if (!isSplitsValid) {
            toast.error('A distribuição deve somar 100%');
            return;
        }

        if (!goalId) return;

        try {
            await setSplitsMutation.mutateAsync({
                id: goalId,
                splits: splits.map((split) => ({
                    user_id: Number(split.user_id),
                    percent: toNumber(split.percent),
                })),
            });
            navigate(`/config/metas/${goalId}`);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar distribuição');
        }
    };

    const isLoading = setSplitsMutation.isPending;

    if (isLoadingGoal) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!goalData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
                <p className="text-lg font-medium">Meta não encontrada</p>
                <Button onClick={() => navigate('/config/metas')}>
                    Voltar para Metas
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/config/metas/${goalId}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <PageHeader
                        title="Distribuição da Meta"
                        description="Configure quanto da meta cada vendedor deve atingir"
                        icon={Users}
                    />
                </div>
                <Button onClick={handleSubmit} disabled={isLoading || !isSplitsValid}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Distribuição
                </Button>
            </div>

            {/* Resumo da Meta */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Resumo da Meta
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                            <Store className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Loja</p>
                                <p className="font-medium">{goalData.store?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Período</p>
                                <p className="font-medium">{formatMonth(goalData.month)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                            <Target className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Meta Total</p>
                                <p className="font-bold text-primary">{formatCurrency(goalData.goal_amount)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status da Distribuição */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-primary" />
                        Status da Distribuição
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isSplitsValid ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                            )}
                            <span className="font-medium">
                                {splitsTotal.toFixed(1)}% distribuído
                            </span>
                        </div>
                        <Badge variant={isSplitsValid ? 'default' : 'destructive'}>
                            {isSplitsValid
                                ? 'Completa'
                                : splitsTotal > 100
                                    ? `Excede ${(splitsTotal - 100).toFixed(1)}%`
                                    : `Faltam ${(100 - splitsTotal).toFixed(1)}%`}
                        </Badge>
                    </div>
                    <Progress
                        value={Math.max(0, Math.min(splitsTotal, 100))}
                        className={cn(
                            "h-3",
                            !isSplitsValid && splitsTotal > 100 && "[&>div]:bg-destructive"
                        )}
                    />
                    {splitsTotal > 100 && (
                        <p className="text-sm text-destructive">
                            A distribuição excede 100%. Ajuste os valores.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Distribuição entre Vendedores */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Vendedores
                    </CardTitle>
                    <CardDescription>
                        Defina o percentual da meta para cada vendedor
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {vendedores.length === 0 ? (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Não há vendedores cadastrados nesta loja.
                                Adicione vendedores antes de configurar a distribuição.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <PercentSplitter
                                users={vendedores}
                                value={splits}
                                onChange={setSplits}
                                total={100}
                            />

                            {/* Valores individuais */}
                            {splits.length > 0 && (
                                <div className="mt-6 pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                        Metas Individuais
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {splits.map(split => {
                                            const user = vendedores.find(v => v.id === split.user_id);
                                            const individualGoal = (toNumber(goalData.goal_amount) * toNumber(split.percent)) / 100;
                                            return (
                                                <div
                                                    key={split.user_id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                                >
                                                    <span className="font-medium">{user?.name}</span>
                                                    <div className="text-right">
                                                        <span className="text-sm text-muted-foreground mr-2">
                                                            ({toNumber(split.percent)}%)
                                                        </span>
                                                        <span className="font-bold text-primary">
                                                            {formatCurrency(individualGoal)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Ajuda */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>Como funciona:</strong> A distribuição define quanto da meta mensal cada vendedor deve atingir.
                    <br />
                    <span className="text-muted-foreground">
                        Exemplo: Se a meta total é R$ 50.000 e um vendedor tem 25%, sua meta individual será R$ 12.500.
                    </span>
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default GoalSplitsForm;
