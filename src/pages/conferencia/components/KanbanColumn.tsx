/**
 * KanbanColumn Component
 * 
 * A single column in the Kanban board with header (icon + label + count) and card list.
 * Supports compact mode for archive columns (approved/rejected).
 * Supports PendingTurnCard for the 'pending' column.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CashShift, ConferencePendingTurn } from '@/types/conference.types';
import type { KanbanColumnConfig } from '../utils/kanban-columns';
import { ShiftCard } from './ShiftCard';
import { ShiftCardCompact } from './ShiftCardCompact';
import { PendingTurnCard } from './PendingTurnCard';

interface KanbanColumnProps {
    column: KanbanColumnConfig;
    shifts: CashShift[];
    onShiftClick: (shift: CashShift) => void;
    forceCompact?: boolean;
    /** Pending turns for the 'pending' column (different API shape) */
    pendingTurns?: ConferencePendingTurn[];
    onPendingTurnClick?: (turn: ConferencePendingTurn) => void;
}

const MAX_VISIBLE_DEFAULT = 50;

export function KanbanColumn({ column, shifts, onShiftClick, forceCompact, pendingTurns, onPendingTurnClick }: KanbanColumnProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const useCompact = forceCompact ?? column.defaultCompact ?? false;

    const Icon = column.icon;
    const isPendingColumn = column.id === 'pending' && pendingTurns && pendingTurns.length > 0;
    const count = isPendingColumn ? pendingTurns.length : shifts.length;
    const totalItems = isPendingColumn ? pendingTurns : shifts;
    const visibleCount = showAll ? totalItems.length : Math.min(MAX_VISIBLE_DEFAULT, totalItems.length);
    const hasMore = totalItems.length > MAX_VISIBLE_DEFAULT && !showAll;

    return (
        <div className={cn(
            'flex flex-col rounded-xl border min-w-0',
            column.colorClasses.bg,
            column.colorClasses.border,
        )}>
            {/* Column Header */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-t-xl transition-colors',
                    'hover:bg-muted/30',
                    column.colorClasses.headerBg,
                )}
            >
                {collapsed ? (
                    <ChevronRight className={cn('h-4 w-4', column.colorClasses.text)} />
                ) : (
                    <ChevronDown className={cn('h-4 w-4', column.colorClasses.text)} />
                )}
                <Icon className={cn('h-4 w-4', column.colorClasses.text)} />
                <span className={cn('text-sm font-semibold', column.colorClasses.text)}>
                    {column.label}
                </span>
                <Badge
                    variant="outline"
                    className={cn(
                        'ml-auto text-xs px-1.5 py-0 h-5 font-bold',
                        column.colorClasses.badge,
                    )}
                >
                    {count}
                </Badge>
            </button>

            {/* Card List */}
            {!collapsed && (
                <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-260px)]">
                    {count > 0 ? (
                        <>
                            {isPendingColumn ? (
                                // Render PendingTurnCards
                                pendingTurns.slice(0, visibleCount).map((turn) => (
                                    <PendingTurnCard
                                        key={turn.closure_uuid}
                                        turn={turn}
                                        onClick={() => onPendingTurnClick?.(turn)}
                                    />
                                ))
                            ) : (
                                // Render ShiftCards or ShiftCardCompact
                                shifts.slice(0, visibleCount).map((shift) =>
                                    useCompact ? (
                                        <ShiftCardCompact
                                            key={shift.id}
                                            shift={shift}
                                            onClick={() => onShiftClick(shift)}
                                        />
                                    ) : (
                                        <ShiftCard
                                            key={shift.id}
                                            shift={shift}
                                            onClick={() => onShiftClick(shift)}
                                        />
                                    )
                                )
                            )}
                            {hasMore && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
                                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors"
                                >
                                    Ver mais {totalItems.length - MAX_VISIBLE_DEFAULT} itens...
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Icon className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-xs">Nenhum turno</p>
                        </div>
                    )}
                </div>
            )}

            {/* Collapsed summary */}
            {collapsed && count > 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                    {count} {count === 1 ? 'turno' : 'turnos'}
                </div>
            )}
        </div>
    );
}
