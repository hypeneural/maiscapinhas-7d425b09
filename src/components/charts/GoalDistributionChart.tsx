/**
 * GoalDistributionChart Component
 * 
 * Pie/Donut chart showing distribution of sellers above vs below goal.
 * Green for above goal, red for below goal.
 */

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { DASHBOARD_TOOLTIPS } from '@/lib/dashboard.constants';

interface GoalDistributionChartProps {
    aboveGoal: number;
    belowGoal: number;
    averageAchievement?: number;
    className?: string;
}

const COLORS = {
    above: 'hsl(142, 76%, 36%)', // Green
    below: 'hsl(0, 84%, 60%)',   // Red
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
        payload: {
            name: string;
            value: number;
            percentage: number;
        };
    }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-semibold">{data.name}</p>
                <p className="text-muted-foreground">
                    {data.value} vendedores ({data.percentage.toFixed(0)}%)
                </p>
            </div>
        );
    }
    return null;
};

interface LegendPayloadItem {
    value: string;
    color: string;
    payload?: {
        value: number;
        percentage: number;
    };
}

const CustomLegend: React.FC<{ payload?: LegendPayloadItem[] }> = ({ payload }) => {
    if (!payload) return null;

    return (
        <div className="flex justify-center gap-6 mt-4">
            {payload.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                        {entry.value}: <span className="font-medium text-foreground">{entry.payload?.value || 0}</span>
                    </span>
                </div>
            ))}
        </div>
    );
};

export const GoalDistributionChart: React.FC<GoalDistributionChartProps> = ({
    aboveGoal,
    belowGoal,
    averageAchievement,
    className,
}) => {
    const total = aboveGoal + belowGoal;

    const data = [
        {
            name: 'Acima da meta',
            value: aboveGoal,
            color: COLORS.above,
            percentage: total > 0 ? (aboveGoal / total) * 100 : 0,
        },
        {
            name: 'Abaixo da meta',
            value: belowGoal,
            color: COLORS.below,
            percentage: total > 0 ? (belowGoal / total) * 100 : 0,
        },
    ];

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-5 h-5 text-primary" />
                    Atingimento de Meta
                    <InfoTooltip content={DASHBOARD_TOOLTIPS.goalDistributionChart} />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-52 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend content={<CustomLegend />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-16px' }}>
                        <span className="text-2xl font-bold">{total}</span>
                        <span className="text-xs text-muted-foreground">vendedores</span>
                    </div>
                </div>

                {averageAchievement !== undefined && (
                    <div className="text-center mt-2 text-sm text-muted-foreground">
                        Atingimento médio: <span className="font-semibold text-foreground">{averageAchievement.toFixed(1)}%</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GoalDistributionChart;
