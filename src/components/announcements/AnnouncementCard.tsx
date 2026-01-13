/**
 * AnnouncementCard
 * 
 * Card component for displaying announcement in listings.
 * Strips HTML tags for safe text preview.
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ReceiptStatusBadge, AnnouncementSeverityBadge } from './AnnouncementStatusBadge';
import { cn } from '@/lib/utils';
import {
    Bell,
    AlertTriangle,
    Info,
    MessageSquare,
    ChevronRight,
    Clock,
} from 'lucide-react';
import type { AnnouncementSummary } from '@/types/announcements.types';
import { getReceiptStatus } from '@/types/announcements.types';

interface AnnouncementCardProps {
    announcement: AnnouncementSummary;
    onClick?: () => void;
    className?: string;
}

const SEVERITY_ICONS = {
    info: Info,
    warning: Bell,
    danger: AlertTriangle,
};

const TYPE_ICONS = {
    recado: MessageSquare,
    advertencia: AlertTriangle,
};

// Helper to strip HTML tags for plain text preview
function stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
    announcement,
    onClick,
    className,
}) => {
    const receiptStatus = getReceiptStatus(announcement);
    const SeverityIcon = SEVERITY_ICONS[announcement.severity.value];
    const TypeIcon = TYPE_ICONS[announcement.type.value];

    // Strip HTML from excerpt for safe display
    const plainExcerpt = useMemo(() => {
        const text = announcement.excerpt || stripHtml(announcement.message || '');
        return text.length > 100 ? text.slice(0, 100) + '...' : text;
    }, [announcement.excerpt, announcement.message]);

    const severityColors = {
        info: 'border-l-blue-500',
        warning: 'border-l-amber-500',
        danger: 'border-l-red-500',
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card
            className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] border-l-4',
                severityColors[announcement.severity.value],
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        announcement.severity.value === 'info' && 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
                        announcement.severity.value === 'warning' && 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
                        announcement.severity.value === 'danger' && 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
                    )}>
                        <SeverityIcon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                                {announcement.type.label}
                            </span>
                            <AnnouncementSeverityBadge severity={announcement.severity.value} />
                            {announcement.require_ack && (
                                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                    Requer ACK
                                </span>
                            )}
                        </div>

                        <h3 className="font-semibold text-base truncate mb-1">
                            {announcement.title}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {plainExcerpt}
                        </p>

                        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                            <ReceiptStatusBadge status={receiptStatus} />

                            {announcement.starts_at && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(announcement.starts_at)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
};
