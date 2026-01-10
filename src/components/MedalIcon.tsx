/**
 * MedalIcon Component
 * 
 * Stylized medal icons to replace emoji medals (🥇🥈🥉).
 * Uses SVG with proper colors for gold, silver, and bronze.
 */

import React from 'react';
import { Medal, Trophy, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedalIconProps {
    /** Position (1st, 2nd, or 3rd place) */
    position: 1 | 2 | 3;
    /** Size of the icon */
    size?: 'sm' | 'md' | 'lg';
    /** Additional className */
    className?: string;
    /** Show position number */
    showNumber?: boolean;
}

const positionConfig = {
    1: {
        Icon: Trophy,
        bgColor: 'bg-gradient-to-br from-yellow-400 to-amber-500',
        textColor: 'text-yellow-600',
        ringColor: 'ring-yellow-400/50',
        label: '1º',
    },
    2: {
        Icon: Medal,
        bgColor: 'bg-gradient-to-br from-slate-300 to-slate-400',
        textColor: 'text-slate-500',
        ringColor: 'ring-slate-300/50',
        label: '2º',
    },
    3: {
        Icon: Award,
        bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
        textColor: 'text-amber-700',
        ringColor: 'ring-amber-500/50',
        label: '3º',
    },
};

const sizeConfig = {
    sm: {
        container: 'w-6 h-6',
        icon: 'w-3.5 h-3.5',
        fontSize: 'text-[10px]',
    },
    md: {
        container: 'w-8 h-8',
        icon: 'w-4 h-4',
        fontSize: 'text-xs',
    },
    lg: {
        container: 'w-10 h-10',
        icon: 'w-5 h-5',
        fontSize: 'text-sm',
    },
};

export const MedalIcon: React.FC<MedalIconProps> = ({
    position,
    size = 'md',
    className,
    showNumber = false,
}) => {
    const config = positionConfig[position];
    const sizeStyles = sizeConfig[size];
    const { Icon } = config;

    if (showNumber) {
        return (
            <div
                className={cn(
                    'relative inline-flex items-center justify-center rounded-full ring-2',
                    config.bgColor,
                    config.ringColor,
                    sizeStyles.container,
                    className
                )}
            >
                <span className={cn('font-bold text-white drop-shadow-sm', sizeStyles.fontSize)}>
                    {config.label}
                </span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'inline-flex items-center justify-center rounded-full ring-2 shadow-md',
                config.bgColor,
                config.ringColor,
                sizeStyles.container,
                className
            )}
        >
            <Icon className={cn('text-white drop-shadow-sm', sizeStyles.icon)} />
        </div>
    );
};

export default MedalIcon;
