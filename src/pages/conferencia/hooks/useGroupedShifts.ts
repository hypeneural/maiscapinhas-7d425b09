/**
 * useGroupedShifts Hook
 * 
 * Groups an array of CashShift items into Kanban columns by closing status.
 * Applies priority-based sorting to operational columns and recency to archive columns.
 */

import { useMemo } from 'react';
import type { CashShift } from '@/types/conference.types';
import { KANBAN_COLUMNS } from '../utils/kanban-columns';
import { sortByPriority, sortByRecent } from '../utils/kanban-sorters';

export interface GroupedShifts {
    columns: Record<string, CashShift[]>;
    counts: Record<string, number>;
    total: number;
}

const RECENCY_COLUMNS = new Set(['approved', 'rejected']);

export function useGroupedShifts(shifts: CashShift[]): GroupedShifts {
    return useMemo(() => {
        const columns: Record<string, CashShift[]> = {};
        for (const col of KANBAN_COLUMNS) {
            columns[col.id] = [];
        }

        for (const shift of shifts) {
            let placed = false;
            for (const col of KANBAN_COLUMNS) {
                if (col.match(shift)) {
                    columns[col.id].push(shift);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns['pending'].push(shift);
            }
        }

        // Sort: operational columns by priority, archive columns by recency
        for (const [colId, items] of Object.entries(columns)) {
            items.sort(RECENCY_COLUMNS.has(colId) ? sortByRecent : sortByPriority);
        }

        const counts = Object.fromEntries(
            Object.entries(columns).map(([k, v]) => [k, v.length])
        );

        return { columns, counts, total: shifts.length };
    }, [shifts]);
}
