/**
 * KanbanBoard Component
 * 
 * Main Kanban board with 5 columns for the conference workflow.
 * Desktop: horizontal grid of columns.
 * Mobile (<768px): horizontal tabs showing one column at a time.
 * 
 * Fetches pending turns separately from /cash/conference-pending-turns for the 'Pendente' column.
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CashShift, ConferencePendingTurn } from '@/types/conference.types';
import { cashClosingsService } from '@/services/conference';
import { KANBAN_COLUMNS } from '../utils/kanban-columns';
import { useGroupedShifts } from '../hooks/useGroupedShifts';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
    shifts: CashShift[];
    isLoading: boolean;
    onShiftClick: (shift: CashShift) => void;
    storeFilter?: number;
}

export function KanbanBoard({ shifts, isLoading, onShiftClick, storeFilter }: KanbanBoardProps) {
    const { columns, counts } = useGroupedShifts(shifts);
    const [mobileTab, setMobileTab] = useState(KANBAN_COLUMNS[0].id);

    // Fetch pending turns from dedicated endpoint
    const { data: pendingTurnsData, isLoading: pendingLoading } = useQuery({
        queryKey: ['conference-pending-turns', storeFilter],
        queryFn: () => cashClosingsService.getConferencePendingTurns({
            store_id: storeFilter,
            limit: 200,
        }),
        staleTime: 15000,
        refetchInterval: 15000,
    });

    const pendingTurns: ConferencePendingTurn[] = pendingTurnsData?.data?.turns || [];
    const pendingCount = pendingTurns.length;

    // Merge counts: override pending with real pending count
    const mergedCounts = { ...counts, pending: pendingCount };
    const totalAll = Object.values(mergedCounts).reduce((s, n) => s + n, 0);

    const allLoading = isLoading || pendingLoading;

    if (allLoading && shifts.length === 0 && pendingTurns.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (totalAll === 0 && !allLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">Nenhum turno encontrado</p>
                <p className="text-sm mt-1">Ajuste os filtros para ver resultados</p>
            </div>
        );
    }

    // Handle pending turn click - we don't have a CashShift for it, so navigate to conference
    const handlePendingTurnClick = (turn: ConferencePendingTurn) => {
        // For now, show an info that this turn needs to be conferenced
        // In the future this could navigate to /conferencia/lancar with pre-filled data
        console.log('Pending turn clicked:', turn);
    };

    return (
        <div className="space-y-3">
            {/* Summary bar */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">
                    {totalAll} {totalAll === 1 ? 'turno' : 'turnos'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {KANBAN_COLUMNS.map((col) => {
                        const count = mergedCounts[col.id] || 0;
                        if (count === 0) return null;
                        const Icon = col.icon;
                        return (
                            <Badge
                                key={col.id}
                                variant="outline"
                                className={cn('text-xs gap-1 py-0.5', col.colorClasses.badge)}
                            >
                                <Icon className="h-3 w-3" />
                                {col.label}: {count}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Desktop: Grid of columns */}
            <div className="hidden md:grid md:grid-cols-5 gap-3">
                {KANBAN_COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        shifts={columns[col.id] || []}
                        onShiftClick={onShiftClick}
                        pendingTurns={col.id === 'pending' ? pendingTurns : undefined}
                        onPendingTurnClick={col.id === 'pending' ? handlePendingTurnClick : undefined}
                    />
                ))}
            </div>

            {/* Mobile: Tabs + Single Column */}
            <div className="md:hidden space-y-3">
                {/* Tab bar */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {KANBAN_COLUMNS.map((col) => {
                        const count = mergedCounts[col.id] || 0;
                        const isActive = mobileTab === col.id;
                        const Icon = col.icon;
                        return (
                            <button
                                key={col.id}
                                onClick={() => setMobileTab(col.id)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0',
                                    isActive
                                        ? cn('border shadow-sm', col.colorClasses.headerBg, col.colorClasses.border, col.colorClasses.text)
                                        : 'border border-transparent text-muted-foreground hover:bg-muted/50'
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {col.label}
                                {count > 0 && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-[10px] px-1 py-0 h-4 ml-0.5',
                                            isActive ? col.colorClasses.badge : 'bg-muted text-muted-foreground'
                                        )}
                                    >
                                        {count}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Active column */}
                {KANBAN_COLUMNS.filter((col) => col.id === mobileTab).map((col) => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        shifts={columns[col.id] || []}
                        onShiftClick={onShiftClick}
                        pendingTurns={col.id === 'pending' ? pendingTurns : undefined}
                        onPendingTurnClick={col.id === 'pending' ? handlePendingTurnClick : undefined}
                    />
                ))}
            </div>
        </div>
    );
}
