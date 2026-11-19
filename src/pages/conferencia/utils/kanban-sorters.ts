/**
 * Kanban Sorters
 * 
 * Sorting logic for Kanban cards: divergent first → aging (oldest first) → date.
 */

import type { CashShift } from '@/types/conference.types';

function toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
}

function getTotalDiff(shift: CashShift): number {
    const lines = shift.cash_closing?.lines || [];
    return lines.reduce((s, l) => s + Math.abs(toNumber(l.diff_value)), 0);
}

/**
 * Sort kanban cards by priority:
 * 1. Cards with divergence come first (higher divergence = higher priority)
 * 2. Then by date ascending (oldest first — higher urgency)
 * 3. Then by shift_code ascending
 */
export function sortByPriority(a: CashShift, b: CashShift): number {
    const diffA = getTotalDiff(a);
    const diffB = getTotalDiff(b);

    // Divergent cards first
    if (diffA > 0 && diffB === 0) return -1;
    if (diffA === 0 && diffB > 0) return 1;
    if (diffA !== diffB) return diffB - diffA;

    // Older date first (more urgent)
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;

    // Same date: order by shift
    return a.shift_code.localeCompare(b.shift_code);
}

/**
 * Sort approved/rejected cards by date descending (most recent first)
 */
export function sortByRecent(a: CashShift, b: CashShift): number {
    const dateComp = b.date.localeCompare(a.date);
    if (dateComp !== 0) return dateComp;
    return b.shift_code.localeCompare(a.shift_code);
}
