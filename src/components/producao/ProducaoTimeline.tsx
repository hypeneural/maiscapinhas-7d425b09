/**
 * Production Timeline Component
 * 
 * Visual timeline showing the history of events for a production order.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
    ShoppingCart,
    Send,
    CheckCircle,
    Truck,
    PackageCheck,
    XCircle,
    Plus,
    Minus,
    User,
    Factory,
    Clock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ProducaoEvento } from '@/types/producao.types';

interface ProducaoTimelineProps {
    events: ProducaoEvento[];
    className?: string;
}

const actionIcons: Record<string, React.ReactNode> = {
    'shopping-cart': <ShoppingCart className="h-4 w-4" />,
    'send': <Send className="h-4 w-4" />,
    'check-circle': <CheckCircle className="h-4 w-4" />,
    'truck': <Truck className="h-4 w-4" />,
    'package-check': <PackageCheck className="h-4 w-4" />,
    'x-circle': <XCircle className="h-4 w-4" />,
    'plus': <Plus className="h-4 w-4" />,
    'minus': <Minus className="h-4 w-4" />,
};

const actorIcons: Record<string, React.ReactNode> = {
    'admin': <User className="h-3 w-3" />,
    'vendedor': <User className="h-3 w-3" />,
    'fabrica': <Factory className="h-3 w-3" />,
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

function formatDate(dateString: string): string {
    try {
        const date = parseISO(dateString);
        return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
        return dateString;
    }
}

export function ProducaoTimeline({ events, className }: ProducaoTimelineProps) {
    if (!events || events.length === 0) {
        return (
            <div className="text-sm text-muted-foreground italic">
                Nenhum evento registrado
            </div>
        );
    }

    // Sort by created_at descending (most recent first)
    const sortedEvents = [...events].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <div className={cn('relative', className)}>
            {/* Timeline line */}
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />

            <div className="space-y-6">
                {sortedEvents.map((event, index) => {
                    const isFirst = index === 0;
                    const icon = actionIcons[event.action_icon] || <CheckCircle className="h-4 w-4" />;
                    const actorIcon = actorIcons[event.actor_type] || <User className="h-3 w-3" />;

                    return (
                        <div key={event.id} className="relative flex gap-4">
                            {/* Timeline dot with icon */}
                            <div
                                className={cn(
                                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background',
                                    isFirst ? 'border-primary text-primary' : 'border-muted text-muted-foreground'
                                )}
                            >
                                {icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-1.5 pt-0.5">
                                {/* Action label */}
                                <p className={cn(
                                    'font-medium',
                                    isFirst ? 'text-foreground' : 'text-muted-foreground'
                                )}>
                                    {event.action_label}
                                </p>

                                {/* Metadata */}
                                {event.metadata && (
                                    <div className="text-sm text-muted-foreground space-y-0.5">
                                        {event.metadata.factory_total && (
                                            <p>
                                                Valor: {formatCurrency(event.metadata.factory_total as number)}
                                            </p>
                                        )}
                                        {event.metadata.tracking_code && (
                                            <p>
                                                Rastreio: {String(event.metadata.tracking_code)}
                                            </p>
                                        )}
                                        {event.metadata.factory_notes && (
                                            <p className="italic">
                                                "{String(event.metadata.factory_notes)}"
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Meta info */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        {actorIcon}
                                        {event.actor_name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {event.created_at_human || formatDate(event.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ProducaoTimeline;
