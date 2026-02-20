/**
 * StorePerformanceChart Component
 *
 * Store-focused chart optimized for up to 12 stores.
 * Shows only stores with sales and compares sales vs goal.
 */

import React, { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { DASHBOARD_TOOLTIPS } from '@/lib/dashboard.constants';

interface StoreData {
    store_id: number;
    store_name: string;
    current_amount: number;
    goal_amount: number;
    achievement_rate: number;
}

interface StorePerformanceChartProps {
    stores: StoreData[];
    className?: string;
}

const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
    return `R$ ${value.toFixed(0)}`;
};

const getBarColor = (achievementRate: number): string => {
    if (achievementRate >= 100) return 'hsl(142, 76%, 36%)';
    if (achievementRate >= 80) return 'hsl(45, 93%, 47%)';
    return 'hsl(0, 84%, 60%)';
};

const getShortStoreName = (name: string): string => {
    const normalized = name.replace(/\s+/g, ' ').trim();
    if (normalized.length <= 18) {
        return normalized;
    }

    const dashIdx = normalized.indexOf(' - ');
    if (dashIdx > 0) {
        const prefix = normalized.slice(0, dashIdx);
        if (prefix.length >= 5 && prefix.length <= 16) {
            return prefix;
        }
    }

    return `${normalized.slice(0, 16)}...`;
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: {
            full_name: string;
            current_amount: number;
            goal_amount: number;
            achievement_rate: number;
        };
    }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (!active || !payload?.length) {
        return null;
    }

    const data = payload[0].payload;
    const missingToGoal = Math.max(0, data.goal_amount - data.current_amount);

    return (
        <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-lg">
            <p className="mb-2 font-semibold">{data.full_name}</p>
            <div className="space-y-1 text-muted-foreground">
                <p>
                    <span className="inline-block w-24">Vendas:</span>
                    <span className="font-medium text-foreground">
                        {data.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </p>
                <p>
                    <span className="inline-block w-24">Meta:</span>
                    <span className="font-medium text-foreground">
                        {data.goal_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </p>
                <p>
                    <span className="inline-block w-24">Atingimento:</span>
                    <span className="font-medium" style={{ color: getBarColor(data.achievement_rate) }}>
                        {data.achievement_rate.toFixed(1)}%
                    </span>
                </p>
                {missingToGoal > 0 && (
                    <p>
                        <span className="inline-block w-24">Falta:</span>
                        <span className="font-medium text-foreground">
                            {missingToGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};

export const StorePerformanceChart: React.FC<StorePerformanceChartProps> = ({
    stores,
    className,
}) => {
    const filtered = useMemo(
        () => stores.filter((store) => store.current_amount > 0),
        [stores]
    );

    const chartData = useMemo(
        () =>
            [...filtered]
                .sort((a, b) => b.current_amount - a.current_amount)
                .slice(0, 12)
                .map((store) => ({
                    ...store,
                    short_name: getShortStoreName(store.store_name),
                    full_name: store.store_name,
                })),
        [filtered]
    );

    if (chartData.length === 0) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Store className="h-5 w-5 text-secondary" />
                        Performance por Loja
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma loja com venda no periodo selecionado.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Store className="h-5 w-5 text-secondary" />
                    Performance por Loja
                    <InfoTooltip content={DASHBOARD_TOOLTIPS.storePerformanceChart} />
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{chartData.length} lojas com venda</Badge>
                    <Badge variant="outline">Top por faturamento</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 8, right: 12, left: 4, bottom: 28 }}
                            barCategoryGap={14}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                            <XAxis
                                dataKey="short_name"
                                tick={{ fontSize: 11 }}
                                interval={0}
                                angle={-22}
                                textAnchor="end"
                                height={52}
                            />
                            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={48} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="goal_amount"
                                name="Meta"
                                fill="hsl(var(--muted-foreground))"
                                fillOpacity={0.25}
                                radius={[6, 6, 0, 0]}
                                maxBarSize={38}
                            />
                            <Bar
                                dataKey="current_amount"
                                name="Vendas"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={32}
                            >
                                {chartData.map((entry) => (
                                    <Cell key={entry.store_id} fill={getBarColor(entry.achievement_rate)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default StorePerformanceChart;
