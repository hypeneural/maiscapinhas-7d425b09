/**
 * ShiftCard Component
 * 
 * Full card for a cash shift in the Kanban board.
 * Shows store, date, values, divergence status, aging, and justification preview.
 */

import React, { memo } from 'react';
import { Store, Calendar, User, UserCheck, MessageSquare, FileCheck, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CashShift } from '@/types/conference.types';
import { mapShiftToCardVM, formatCurrency } from '../utils/shift-card-vm';

interface ShiftCardProps {
    shift: CashShift;
    onClick: () => void;
}

const STATUS_LABELS: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
    draft: { label: 'Rascunho', icon: Clock, className: 'border-blue-300 bg-blue-50 text-blue-700' },
    submitted: { label: 'Aguardando', icon: AlertTriangle, className: 'border-amber-300 bg-amber-50 text-amber-700' },
    approved: { label: 'Aprovado', icon: CheckCircle, className: 'border-green-300 bg-green-50 text-green-700' },
    rejected: { label: 'Reprovado', icon: XCircle, className: 'border-red-300 bg-red-50 text-red-700' },
};

function ShiftCardInner({ shift, onClick }: ShiftCardProps) {
    const vm = mapShiftToCardVM(shift);
    const statusInfo = vm.closingStatus ? STATUS_LABELS[vm.closingStatus] : null;
    const StatusIcon = statusInfo?.icon || Clock;

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative rounded-lg border bg-card shadow-sm cursor-pointer',
                'transition-all duration-200 hover:shadow-md hover:scale-[1.01]',
                'border-l-4',
                vm.borderColor
            )}
        >
            {/* Header: Store + Date */}
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
                    <span className="truncate">Vendedor: {vm.sellerName}</span>
                </div>
                {vm.conferenteName && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCheck className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">Conferente: {vm.conferenteName}</span>
                    </div>
                )}
            </div>

            {/* Values */}
            {vm.closingStatus && (
                <div className="px-3 pb-2">
                    <div className="grid grid-cols-3 gap-1.5">
                        <div className="text-center p-1.5 rounded bg-muted/40">
                            <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Sistema</p>
                            <p className="text-xs font-mono font-medium">{formatCurrency(vm.totalSystem)}</p>
                        </div>
                        <div className="text-center p-1.5 rounded bg-muted/40">
                            <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Declarado</p>
                            <p className="text-xs font-mono font-medium">{formatCurrency(vm.totalReal)}</p>
                        </div>
                        <div className={cn(
                            'text-center p-1.5 rounded',
                            vm.hasDivergence ? 'bg-red-500/10' : 'bg-green-500/10'
                        )}>
                            <p className={cn(
                                'text-[10px] leading-none mb-0.5',
                                vm.hasDivergence ? 'text-red-600' : 'text-green-600'
                            )}>Diferença</p>
                            <p className={cn(
                                'text-xs font-mono font-bold',
                                vm.hasDivergence ? 'text-red-600' : 'text-green-600'
                            )}>
                                {vm.totalDiff > 0 ? '+' : ''}{formatCurrency(vm.totalDiff)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Justification preview */}
            {(vm.justificationPreview || vm.observerNotesPreview) && (
                <div className="px-3 pb-2 space-y-1">
                    {vm.justificationPreview && (
                        <div className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-500/5 rounded p-1.5">
                            <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">Vendedor: {vm.justificationPreview}</span>
                        </div>
                    )}
                    {vm.observerNotesPreview && (
                        <div className="flex items-start gap-1.5 text-[11px] text-blue-700 bg-blue-500/5 rounded p-1.5">
                            <FileCheck className="h-3 w-3 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">Conferente: {vm.observerNotesPreview}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Footer: Aging + Status Badge + Divergence Badge */}
            <div className="px-3 pb-2.5 flex items-center justify-between gap-1.5 flex-wrap">
                <span className={cn(
                    'text-[11px] flex items-center gap-1',
                    vm.agingMinutes > 1440 ? 'text-red-500 font-medium' :
                        vm.agingMinutes > 480 ? 'text-amber-500' : 'text-muted-foreground'
                )}>
                    <Clock className="h-3 w-3" /> {vm.aging}
                </span>
                <div className="flex items-center gap-1">
                    {vm.hasDivergence && (
                        <Badge variant="outline" className={cn(
                            'text-[10px] px-1.5 py-0 h-4',
                            vm.hasJustification || vm.hasObserverNotes
                                ? 'border-amber-300 bg-amber-50 text-amber-700'
                                : 'border-red-300 bg-red-50 text-red-700'
                        )}>
                            {vm.hasJustification || vm.hasObserverNotes ? 'Justificada' : 'Sem Justif.'}
                        </Badge>
                    )}
                    {statusInfo && (
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 gap-0.5', statusInfo.className)}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusInfo.label}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}

export const ShiftCard = memo(ShiftCardInner);
