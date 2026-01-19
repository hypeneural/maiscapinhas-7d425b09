/**
 * Prize State Cards Component
 * 
 * Real-time eligibility monitoring cards with auto-refresh.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    RefreshCw,
    CheckCircle2,
    Clock,
    XCircle,
    Package,
    RotateCcw,
} from 'lucide-react';
import { usePrizeState, useResetPrizeRuleCooldown } from '@/hooks/api/use-prize-rules';
import { useToast } from '@/hooks/use-toast';
import type { PrizeState } from '@/types/wheel.types';
import { GlossaryTooltip } from '@/components/GlossaryTooltip';

interface PrizeStateCardsProps {
    campaignKey: string;
    screenId?: number;
    refetchInterval?: number;
}

function StatRow({ label, value, tooltip }: { label: string; value: React.ReactNode; tooltip?: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
                {label}
                {tooltip && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">ℹ️</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
                    </Tooltip>
                )}
            </span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

function StateCard({ state, campaignKey }: { state: PrizeState; campaignKey: string }) {
    const { toast } = useToast();
    const resetCooldown = useResetPrizeRuleCooldown(campaignKey);

    const handleResetCooldown = async () => {
        // We need the rule ID, but PrizeState doesn't have it directly
        // This is a UI limitation - would need to match with rules
        toast({
            title: 'Reset não disponível',
            description: 'Use a tabela de regras para resetar o cooldown.',
        });
    };

    // Calculate progress for inventory
    const inventoryPercent = state.inventory
        ? Math.round((state.inventory.remaining / state.inventory.total) * 100)
        : null;

    // Status indicator
    const StatusIcon = state.is_eligible
        ? CheckCircle2
        : state.inventory?.remaining === 0
            ? Package
            : state.state.spins_until_eligible > 0 || state.state.seconds_until_eligible > 0
                ? Clock
                : XCircle;

    const statusColor = state.is_eligible
        ? 'text-green-500'
        : state.inventory?.remaining === 0
            ? 'text-gray-500'
            : 'text-amber-500';

    return (
        <Card className={!state.is_eligible ? 'opacity-80' : ''}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-lg">{state.segment_label.split(' ')[0]}</span>
                        {state.prize_name}
                    </CardTitle>
                    <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Probability */}
                <StatRow
                    label="Probabilidade"
                    value={`${state.probability_weight}%`}
                />

                {/* Inventory */}
                {state.inventory && (
                    <div className="space-y-1">
                        <StatRow
                            label="Estoque"
                            value={`${state.inventory.remaining}/${state.inventory.total}`}
                        />
                        <Progress value={inventoryPercent!} className="h-1.5" />
                    </div>
                )}

                {/* Daily limit */}
                {state.inventory?.daily_limit && (
                    <StatRow
                        label="Hoje"
                        value={`${state.inventory.daily_remaining}/${state.inventory.daily_limit}`}
                    />
                )}

                {/* Status */}
                {!state.is_eligible && state.reason && (
                    <div className="pt-2 border-t">
                        <Badge
                            variant="outline"
                            className={`w-full justify-center ${state.inventory?.remaining === 0
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                        >
                            {state.reason}
                        </Badge>
                    </div>
                )}

                {/* Cooldown info */}
                {(state.state.spins_until_eligible > 0 || state.state.seconds_until_eligible > 0) && (
                    <div className="pt-2 border-t space-y-1">
                        {state.state.spins_until_eligible > 0 && (
                            <StatRow
                                label="Faltam jogadas"
                                value={state.state.spins_until_eligible}
                            />
                        )}
                        {state.state.seconds_until_eligible > 0 && (
                            <StatRow
                                label="Liberado em"
                                value={`${Math.ceil(state.state.seconds_until_eligible / 60)} min`}
                            />
                        )}
                    </div>
                )}

                {/* Counters */}
                <div className="pt-2 border-t space-y-1">
                    <StatRow
                        label="Esta hora"
                        value={state.state.awarded_count_hour}
                    />
                    <StatRow
                        label="Hoje"
                        value={state.state.awarded_count_day}
                    />
                    <StatRow
                        label="Total"
                        value={state.state.awarded_count_total}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

export function PrizeStateCards({ campaignKey, screenId, refetchInterval = 10000 }: PrizeStateCardsProps) {
    const { data, isLoading, refetch, isFetching } = usePrizeState(campaignKey, {
        screenId,
        refetchInterval,
    });

    const states = data?.data || [];

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Status em Tempo Real</h3>
                    <Skeleton className="h-9 w-24" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Status em Tempo Real</h3>
                    <GlossaryTooltip term="is_eligible" />
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {states.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                    <p className="text-muted-foreground">Nenhum prêmio configurado</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {states.map((state) => (
                        <StateCard
                            key={state.prize_key}
                            state={state}
                            campaignKey={campaignKey}
                        />
                    ))}
                </div>
            )}

            {data?.meta && (
                <p className="text-xs text-muted-foreground text-right">
                    Spin seq: {data.meta.current_spin_seq} •
                    Atualizado: {new Date(data.meta.timestamp).toLocaleTimeString('pt-BR')}
                </p>
            )}
        </div>
    );
}
