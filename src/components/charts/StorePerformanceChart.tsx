/**
 * StorePerformanceChart Component
 * 
 * Horizontal bar chart comparing current sales vs goal by store.
 * Uses color coding (green/yellow/red) based on achievement rate.
 */

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const getBarColor = (achievementRate: number): string => {
    if (achievementRate >= 100) return 'hsl(142, 76%, 36%)'; // Green
    if (achievementRate >= 80) return 'hsl(45, 93%, 47%)';   // Yellow
    return 'hsl(0, 84%, 60%)';                                // Red
};

const formatCurrency = (value: number): string => {
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: StoreData;
        value: number;
    }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const remaining = Math.max(0, data.goal_amount - data.current_amount);

        return (
            <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-semibold mb-2">{data.store_name}</p>
                <div className="space-y-1 text-muted-foreground">
                    <p>
                        <span className="inline-block w-20">Vendas:</span>
                        <span className="font-medium text-foreground">
                            R$ {data.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </p>
                    <p>
                        <span className="inline-block w-20">Meta:</span>
                        <span className="font-medium text-foreground">
                            R$ {data.goal_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </p>
                    <p>
                        <span className="inline-block w-20">Atingimento:</span>
                        <span
                            className="font-medium"
                            style={{ color: getBarColor(data.achievement_rate) }}
                        >
                            {data.achievement_rate.toFixed(1)}%
                        </span>
                    </p>
                    {remaining > 0 && (
                        <p>
                            <span className="inline-block w-20">Faltam:</span>
                            <span className="font-medium text-foreground">
                                R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export const StorePerformanceChart: React.FC<StorePerformanceChartProps> = ({
    stores,
    className,
}) => {
    // Prepare data with percentage for visualization
    const chartData = stores.map((store) => ({
        ...store,
        // For the bar, we show achievement rate capped at 120% for visual clarity
        displayValue: Math.min(store.achievement_rate, 120),
    }));

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Store className="w-5 h-5 text-secondary" />
                    Performance por Loja
                    <InfoTooltip content={DASHBOARD_TOOLTIPS.storePerformanceChart} />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                            <XAxis
                                type="number"
                                domain={[0, 120]}
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="store_name"
                                tick={{ fontSize: 12 }}
                                width={55}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine
                                x={100}
                                stroke="hsl(var(--muted-foreground))"
                                strokeDasharray="5 5"
                                label={{ value: 'Meta', position: 'top', fontSize: 10 }}
                            />
                            <Bar
                                dataKey="displayValue"
                                radius={[0, 4, 4, 0]}
                                maxBarSize={28}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.achievement_rate)} />
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
