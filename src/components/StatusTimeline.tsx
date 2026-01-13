/**
 * Status Timeline Component
 * 
 * Visual timeline showing the history of status changes for a pedido.
 * Displays the progression of status with timestamps and user information.
 */

import React from 'react';
import { Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStatusColorClasses } from '@/lib/constants/status.constants';
import type { PedidoStatusHistory } from '@/types/pedidos.types';

interface StatusTimelineProps {
    history: PedidoStatusHistory[];
    className?: string;
}

export function StatusTimeline({ history, className }: StatusTimelineProps) {
    if (!history || history.length === 0) {
        return (
            <div className="text-sm text-muted-foreground italic">
                Nenhum histórico de alterações
            </div>
        );
    }

    // Sort by changed_at descending (most recent first)
    const sortedHistory = [...history].sort(
        (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );

    return (
        <div className={cn('relative', className)}>
            {/* Timeline line */}
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />

            <div className="space-y-6">
                {sortedHistory.map((entry, index) => {
                    const isFirst = index === 0;
                    const statusColor = getStatusColor(entry.new_status);

                    return (
                        <div key={entry.id} className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div
                                className={cn(
                                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background',
                                    isFirst ? 'border-primary' : 'border-muted',
                                )}
                            >
                                <div
                                    className={cn(
                                        'h-3 w-3 rounded-full',
                                        isFirst ? 'bg-primary' : 'bg-muted'
                                    )}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-1.5 pt-0.5">
                                {/* Status change */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {entry.old_status_label && (
                                        <>
                                            <span className="text-sm text-muted-foreground line-through">
                                                {entry.old_status_label}
                                            </span>
                                            <span className="text-muted-foreground">→</span>
                                        </>
                                    )}
                                    <span
                                        className={cn(
                                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
                                            getStatusColorClasses(statusColor)
                                        )}
                                    >
                                        {entry.new_status_label}
                                    </span>
                                </div>

                                {/* Reason if present */}
                                {entry.reason && (
                                    <p className="text-sm text-muted-foreground">
                                        "{entry.reason}"
                                    </p>
                                )}

                                {/* Meta info */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {entry.changed_by.name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(entry.changed_at)}
                                    </span>
                                    {entry.source === 'bulk' && (
                                        <span className="text-xs text-amber-600 font-medium">
                                            Alteração em lote
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Get color based on status number
 */
function getStatusColor(status: number): string {
    const colorMap: Record<number, string> = {
        1: 'blue',
        2: 'red',
        3: 'yellow',
        4: 'green',
        5: 'gray',
        6: 'purple',
    };
    return colorMap[status] || 'gray';
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
    try {
        const date = parseISO(dateString);
        return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
        return dateString;
    }
}

export default StatusTimeline;
