/**
 * PendingTurnCard Component
 * 
 * Card for pending turns from the /cash/conference-pending-turns endpoint.
 * These are turns that haven't been conferenced yet.
 */

import React, { memo } from 'react';
import { Store, Calendar, User, DollarSign, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConferencePendingTurn } from '@/types/conference.types';
import { mapPendingTurnToCardVM, formatCurrency } from '../utils/shift-card-vm';

interface PendingTurnCardProps {
    turn: ConferencePendingTurn;
    onClick: () => void;
}

function PendingTurnCardInner({ turn, onClick }: PendingTurnCardProps) {
    const vm = mapPendingTurnToCardVM(turn);

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative rounded-lg border bg-card shadow-sm cursor-pointer',
                'transition-all duration-200 hover:shadow-md hover:scale-[1.01]',
                'border-l-4 border-l-slate-400'
            )}
        >
            {/* Header: Store */}
            <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-1.5 mb-1">
                    <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-sm truncate">{vm.storeName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{vm.dateFormatted}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {vm.shiftLabel}
                    </Badge>
                </div>
            </div>

            {/* People */}
            <div className="px-3 pb-2 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                        {turn.responsavel?.nome || turn.operador_nome || '-'}
                    </span>
                </div>
                {turn.operador_nome && turn.responsavel?.nome && turn.operador_nome !== turn.responsavel.nome && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3 shrink-0 opacity-50" />
                        <span className="truncate text-muted-foreground/70">Op: {turn.operador_nome}</span>
                    </div>
                )}
            </div>

            {/* Total value */}
            <div className="px-3 pb-2">
                <div className="flex items-center justify-between bg-muted/40 rounded p-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3 shrink-0" />
                        <span>Total PDV</span>
                    </div>
                    <span className="text-sm font-mono font-bold">
                        {formatCurrency(turn.total_value || 0)}
                    </span>
                </div>
            </div>

            {/* Footer: Aging + Badge */}
            <div className="px-3 pb-2.5 flex items-center justify-between">
                <span className={cn(
                    'text-[11px] flex items-center gap-1',
                    vm.agingMinutes > 1440 ? 'text-red-500 font-medium' :
                        vm.agingMinutes > 480 ? 'text-amber-500' : 'text-muted-foreground'
                )}>
                    <Clock className="h-3 w-3" /> {vm.aging}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-300 bg-slate-50 text-slate-600">
                    Não conferido
                </Badge>
            </div>
        </div>
    );
}

export const PendingTurnCard = memo(PendingTurnCardInner);
