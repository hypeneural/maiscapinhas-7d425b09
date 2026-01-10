/**
 * SalesProjectionChart Component
 * 
 * Area chart showing sales progression with linear projection.
 * Displays current sales, goal line, and projected trajectory.
 */

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DASHBOARD_TOOLTIPS } from '@/lib/dashboard.constants';
import type { ForecastStatus } from '@/types/dashboard.types';

interface SalesProjectionChartProps {
    currentSales: number;
    goalAmount: number;
    linearProjection: number;
    daysElapsed: number;
    daysTotal: number;
    status?: ForecastStatus;
    className?: string;
}

const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        dataKey: string;
        value: number;
        color: string;
    }>;
    label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-semibold mb-2">Dia {label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">
                                {entry.dataKey === 'vendas' ? 'Vendas' : 'Projeção'}:
                            </span>
                            <span className="font-medium">
                                R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const StatusIcon: React.FC<{ status: ForecastStatus }> = ({ status }) => {
    switch (status) {
        case 'ON_TRACK':
            return <CheckCircle className="w-4 h-4 text-green-600" />;
        case 'AT_RISK':
            return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
        case 'BEHIND':
            return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
};

const getStatusConfig = (status: ForecastStatus) => {
    switch (status) {
        case 'ON_TRACK':
            return {
                label: 'No caminho',
                className: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30'
            };
        case 'AT_RISK':
            return {
                label: 'Atenção',
                className: 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30'
            };
        case 'BEHIND':
            return {
                label: 'Abaixo',
                className: 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30'
            };
    }
};

export const SalesProjectionChart: React.FC<SalesProjectionChartProps> = ({
    currentSales,
    goalAmount,
    linearProjection,
    daysElapsed,
    daysTotal,
    status = 'ON_TRACK',
    className,
}) => {
    // Generate chart data
    const dailyAverage = daysElapsed > 0 ? currentSales / daysElapsed : 0;

    const chartData = [];

    // Generate data points
    for (let day = 1; day <= daysTotal; day++) {
        const projectedValue = dailyAverage * day;

        if (day <= daysElapsed) {
            // Actual data (simplified as linear progression)
            chartData.push({
                dia: day,
                vendas: (currentSales / daysElapsed) * day,
                projecao: null,
            });
        } else {
            // Projected data
            chartData.push({
                dia: day,
                vendas: null,
                projecao: projectedValue,
            });
        }
    }

    // Add transition point
    if (daysElapsed > 0 && daysElapsed < daysTotal) {
        chartData[daysElapsed - 1].projecao = chartData[daysElapsed - 1].vendas;
    }

    const statusConfig = getStatusConfig(status);

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Projeção de Fechamento
                        <InfoTooltip content={DASHBOARD_TOOLTIPS.projection} />
                    </CardTitle>
                    <Badge variant="outline" className={cn("gap-1", statusConfig.className)}>
                        <StatusIcon status={status} />
                        {statusConfig.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Vendas Atuais</p>
                        <p className="text-lg font-bold">{formatCurrency(currentSales)}</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Meta</p>
                        <p className="text-lg font-bold">{formatCurrency(goalAmount)}</p>
                    </div>
                    <div className="text-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Projeção</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(linearProjection)}</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="dia"
                                tick={{ fontSize: 10 }}
                                tickFormatter={(value) => `${value}`}
                            />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                tickFormatter={formatCurrency}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine
                                y={goalAmount}
                                stroke="hsl(142, 76%, 36%)"
                                strokeDasharray="5 5"
                                label={{ value: 'Meta', position: 'right', fontSize: 10, fill: 'hsl(142, 76%, 36%)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="vendas"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorVendas)"
                                connectNulls={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="projecao"
                                stroke="hsl(var(--muted-foreground))"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#colorProjecao)"
                                connectNulls={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                    <span>Dia {daysElapsed} de {daysTotal}</span>
                    <span>{((daysElapsed / daysTotal) * 100).toFixed(0)}% do mês</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default SalesProjectionChart;
