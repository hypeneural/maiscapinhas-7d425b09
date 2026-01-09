/**
 * StatusIndicator Component
 * 
 * Visual indicator for status levels:
 * - GREEN/ON_TRACK: Success state
 * - YELLOW/AT_RISK: Warning state  
 * - RED/BEHIND: Danger state
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, AlertCircle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type StatusType =
    | 'GREEN' | 'YELLOW' | 'RED'
    | 'ON_TRACK' | 'AT_RISK' | 'BEHIND';

interface StatusIndicatorProps {
    status: StatusType;
    label?: string;
    showIcon?: boolean;
    showLabel?: boolean;
    tooltip?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const statusConfig: Record<StatusType, {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    defaultLabel: string;
    defaultTooltip: string;
}> = {
    GREEN: {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-500',
        icon: <CheckCircle2 className="w-4 h-4" />,
        defaultLabel: 'Normal',
        defaultTooltip: 'Situação dentro do esperado',
    },
    ON_TRACK: {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-500',
        icon: <TrendingUp className="w-4 h-4" />,
        defaultLabel: 'No Caminho',
        defaultTooltip: 'Meta será atingida no ritmo atual',
    },
    YELLOW: {
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-500',
        icon: <AlertTriangle className="w-4 h-4" />,
        defaultLabel: 'Atenção',
        defaultTooltip: 'Situação requer atenção',
    },
    AT_RISK: {
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-500',
        icon: <AlertCircle className="w-4 h-4" />,
        defaultLabel: 'Em Risco',
        defaultTooltip: 'Meta pode não ser atingida',
    },
    RED: {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-500',
        icon: <XCircle className="w-4 h-4" />,
        defaultLabel: 'Crítico',
        defaultTooltip: 'Situação crítica que requer ação imediata',
    },
    BEHIND: {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-500',
        icon: <TrendingDown className="w-4 h-4" />,
        defaultLabel: 'Atrasado',
        defaultTooltip: 'Meta não será atingida no ritmo atual',
    },
};

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
    status,
    label,
    showIcon = true,
    showLabel = true,
    tooltip,
    size = 'md',
    className,
}) => {
    const config = statusConfig[status];
    const displayLabel = label ?? config.defaultLabel;
    const displayTooltip = tooltip ?? config.defaultTooltip;

    const indicator = (
        <div
            className={cn(
                'inline-flex items-center rounded-full font-medium',
                config.color,
                config.bgColor,
                sizeClasses[size],
                className
            )}
        >
            {showIcon && config.icon}
            {showLabel && <span>{displayLabel}</span>}
        </div>
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {indicator}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{displayTooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

/**
 * Simple dot indicator for tables
 */
export const StatusDot: React.FC<{
    status: StatusType;
    tooltip?: string;
    size?: 'sm' | 'md' | 'lg';
}> = ({ status, tooltip, size = 'md' }) => {
    const config = statusConfig[status];
    const displayTooltip = tooltip ?? config.defaultTooltip;

    const dotSizes = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    const dot = (
        <div
            className={cn(
                'rounded-full',
                dotSizes[size],
                status === 'GREEN' || status === 'ON_TRACK' ? 'bg-green-500' : '',
                status === 'YELLOW' || status === 'AT_RISK' ? 'bg-yellow-500' : '',
                status === 'RED' || status === 'BEHIND' ? 'bg-red-500' : ''
            )}
        />
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {dot}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{displayTooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default StatusIndicator;
