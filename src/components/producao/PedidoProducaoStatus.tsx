/**
 * Production Order Status Badge
 * 
 * Status badge with production-specific colors for production orders.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
    ShoppingCart,
    Send,
    CheckCircle,
    Truck,
    PackageCheck,
    XCircle,
} from 'lucide-react';
import { PRODUCAO_STATUS_LABELS, PRODUCAO_STATUS_COLORS } from '@/types/producao.types';

interface PedidoProducaoStatusProps {
    status: number;
    label?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const colorConfig: Record<string, { bg: string; text: string; border: string }> = {
    slate: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-600',
    },
    orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-300 dark:border-orange-700',
    },
    teal: {
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        text: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-300 dark:border-teal-700',
    },
    indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-300 dark:border-indigo-700',
    },
    green: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-300 dark:border-green-700',
    },
    red: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
    },
};

const sizeConfig = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
};

const iconSizeConfig = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
};

function getStatusIcon(status: number, size: 'sm' | 'md' | 'lg') {
    const iconClass = iconSizeConfig[size];

    switch (status) {
        case 1:
            return <ShoppingCart className={iconClass} />;
        case 2:
            return <Send className={iconClass} />;
        case 3:
            return <CheckCircle className={iconClass} />;
        case 4:
            return <Truck className={iconClass} />;
        case 5:
            return <PackageCheck className={iconClass} />;
        case 6:
            return <XCircle className={iconClass} />;
        default:
            return null;
    }
}

export function PedidoProducaoStatus({
    status,
    label,
    showIcon = true,
    size = 'md',
    className,
}: PedidoProducaoStatusProps) {
    const colorKey = PRODUCAO_STATUS_COLORS[status] || 'slate';
    const colors = colorConfig[colorKey];
    const displayLabel = label || PRODUCAO_STATUS_LABELS[status] || 'Desconhecido';

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border font-medium',
                colors.bg,
                colors.text,
                colors.border,
                sizeConfig[size],
                className
            )}
        >
            {showIcon && getStatusIcon(status, size)}
            {displayLabel}
        </span>
    );
}

export default PedidoProducaoStatus;
