/**
 * TrendBadge Component
 * 
 * Displays growth/decline indicators with icons for YoY/MoM comparisons.
 * Shows green with up arrow for positive, red with down arrow for negative.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './InfoTooltip';

interface TrendBadgeProps {
    /** The percentage value to display */
    value: number;
    /** Optional label (e.g., "YoY", "MoM") */
    label?: string;
    /** Optional tooltip content */
    tooltipContent?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Show the plus/minus sign */
    showSign?: boolean;
    /** Additional className */
    className?: string;
}

const sizeStyles = {
    sm: {
        container: 'text-xs gap-0.5',
        icon: 'w-3 h-3',
    },
    md: {
        container: 'text-sm gap-1',
        icon: 'w-4 h-4',
    },
    lg: {
        container: 'text-base gap-1.5',
        icon: 'w-5 h-5',
    },
};

export const TrendBadge: React.FC<TrendBadgeProps> = ({
    value,
    label,
    tooltipContent,
    size = 'sm',
    showSign = true,
    className,
}) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;
    const styles = sizeStyles[size];

    const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

    const colorClass = isNeutral
        ? 'text-muted-foreground'
        : isPositive
            ? 'text-green-600 dark:text-green-500'
            : 'text-red-600 dark:text-red-500';

    const bgClass = isNeutral
        ? 'bg-muted/50'
        : isPositive
            ? 'bg-green-50 dark:bg-green-950/30'
            : 'bg-red-50 dark:bg-red-950/30';

    const formattedValue = `${showSign && value > 0 ? '+' : ''}${value.toFixed(1)}%`;

    const badge = (
        <span
            className={cn(
                'inline-flex items-center font-medium px-2 py-0.5 rounded-full',
                styles.container,
                colorClass,
                bgClass,
                className
            )}
        >
            <Icon className={styles.icon} />
            <span>{formattedValue}</span>
            {label && <span className="text-muted-foreground ml-1">{label}</span>}
        </span>
    );

    if (tooltipContent) {
        return (
            <InfoTooltip content={tooltipContent}>
                {badge}
            </InfoTooltip>
        );
    }

    return badge;
};

export default TrendBadge;
