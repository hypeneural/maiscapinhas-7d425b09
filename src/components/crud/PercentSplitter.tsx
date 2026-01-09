/**
 * PercentSplitter Component
 * 
 * A component for distributing percentages across multiple users.
 * Used for goal splits in the monthly goals feature.
 */

import React from 'react';
import { AlertCircle, CheckCircle2, Percent, Users, Scale } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface SplitUser {
    id: number;
    name: string;
    avatar_url?: string;
}

export interface SplitValue {
    user_id: number;
    percent: number;
}

export interface PercentSplitterProps {
    /** Available users to split between */
    users: SplitUser[];
    /** Current split values */
    value: SplitValue[];
    /** Callback when splits change */
    onChange: (splits: SplitValue[]) => void;
    /** Target total (default: 100) */
    total?: number;
    /** Minimum percent per user */
    min?: number;
    /** Maximum percent per user */
    max?: number;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Custom class name */
    className?: string;
}

// ============================================================
// Component
// ============================================================

export function PercentSplitter({
    users,
    value,
    onChange,
    total = 100,
    min = 0,
    max = 100,
    disabled = false,
    className,
}: PercentSplitterProps) {
    // Calculate current total
    const currentTotal = value.reduce((sum, s) => sum + s.percent, 0);
    const isValid = Math.abs(currentTotal - total) < 0.01; // Allow floating point tolerance
    const remaining = total - currentTotal;

    // Get user's initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    // Get current percent for a user
    const getUserPercent = (userId: number): number => {
        const split = value.find((s) => s.user_id === userId);
        return split?.percent ?? 0;
    };

    // Update percent for a user
    const handlePercentChange = (userId: number, percent: number) => {
        const clampedPercent = Math.max(min, Math.min(max, percent));

        const existing = value.find((s) => s.user_id === userId);
        if (existing) {
            if (clampedPercent === 0) {
                // Remove if zero
                onChange(value.filter((s) => s.user_id !== userId));
            } else {
                // Update
                onChange(value.map((s) => (s.user_id === userId ? { ...s, percent: clampedPercent } : s)));
            }
        } else if (clampedPercent > 0) {
            // Add new
            onChange([...value, { user_id: userId, percent: clampedPercent }]);
        }
    };

    // Distribute equally among all users
    const handleDistributeEqually = () => {
        const perUser = Math.floor((total / users.length) * 100) / 100;
        const remainder = total - perUser * users.length;

        const newSplits = users.map((user, index) => ({
            user_id: user.id,
            percent: index === 0 ? perUser + remainder : perUser,
        }));

        onChange(newSplits);
    };

    // Clear all splits
    const handleClear = () => {
        onChange([]);
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Status bar */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                    {isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">
                        Total: <span className={cn(
                            'font-bold',
                            isValid ? 'text-green-600' : 'text-yellow-600'
                        )}>{currentTotal.toFixed(1)}%</span>
                        {!isValid && (
                            <span className="text-muted-foreground ml-1">
                                ({remaining > 0 ? `faltam ${remaining.toFixed(1)}%` : `excede ${Math.abs(remaining).toFixed(1)}%`})
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDistributeEqually}
                        disabled={disabled || users.length === 0}
                    >
                        <Scale className="h-4 w-4 mr-1" />
                        Distribuir Igual
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        disabled={disabled || value.length === 0}
                    >
                        Limpar
                    </Button>
                </div>
            </div>

            {/* User list */}
            {users.length === 0 ? (
                <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                        Nenhum vendedor vinculado a esta loja.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-2">
                    {users.map((user) => {
                        const percent = getUserPercent(user.id);
                        const hasValue = percent > 0;

                        return (
                            <div
                                key={user.id}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                                    hasValue ? 'bg-primary/5 border-primary/20' : 'bg-background',
                                    disabled && 'opacity-50'
                                )}
                            >
                                {/* Avatar */}
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar_url} alt={user.name} />
                                    <AvatarFallback className="text-xs">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium truncate block">{user.name}</span>
                                </div>

                                {/* Percent input */}
                                <div className="relative w-28">
                                    <Input
                                        type="number"
                                        value={percent || ''}
                                        onChange={(e) =>
                                            handlePercentChange(user.id, parseFloat(e.target.value) || 0)
                                        }
                                        placeholder="0"
                                        min={min}
                                        max={max}
                                        step={0.5}
                                        disabled={disabled}
                                        className="pr-8 text-right"
                                    />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Validation message */}
            {!isValid && value.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        A soma dos percentuais deve ser exatamente {total}%.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

export default PercentSplitter;
