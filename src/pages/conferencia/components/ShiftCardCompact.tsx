/**
 * ShiftCardCompact Component
 * 
 * Compact single-line card for approved/rejected columns.
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import type { CashShift } from '@/types/conference.types';
import { mapShiftToCardVM, formatCurrency } from '../utils/shift-card-vm';

interface ShiftCardCompactProps {
    shift: CashShift;
    onClick: () => void;
}

function ShiftCardCompactInner({ shift, onClick }: ShiftCardCompactProps) {
    const vm = mapShiftToCardVM(shift);

    return (
        <div
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border bg-card cursor-pointer',
                'transition-all duration-150 hover:shadow-sm hover:bg-accent/50',
                'border-l-4',
                vm.borderColor
            )}
        >
            <span className="text-xs font-medium truncate flex-1 min-w-0">
                {vm.storeName}
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0">
                {vm.dateFormatted} · {vm.shiftLabel}
            </span>
            <span className={cn(
                'text-xs font-mono font-medium shrink-0',
                vm.hasDivergence ? 'text-red-600' : 'text-green-600'
            )}>
                {vm.totalDiff > 0 ? '+' : ''}{formatCurrency(vm.totalDiff)}
            </span>
            {vm.hasDivergence ? (
                <span className="text-red-500 shrink-0">❌</span>
            ) : (
                <span className="text-green-500 shrink-0">✅</span>
            )}
        </div>
    );
}

export const ShiftCardCompact = memo(ShiftCardCompactInner);
