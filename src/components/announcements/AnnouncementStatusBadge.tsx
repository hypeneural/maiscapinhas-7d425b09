/**
 * AnnouncementStatusBadge
 * 
 * Badge component for displaying announcement status.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AnnouncementStatus, AnnouncementSeverity } from '@/types/announcements.types';

interface StatusBadgeProps {
    status: AnnouncementStatus;
    className?: string;
}

const STATUS_CONFIG: Record<AnnouncementStatus, { label: string; variant: string }> = {
    draft: { label: 'Rascunho', variant: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    scheduled: { label: 'Agendado', variant: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    active: { label: 'Ativo', variant: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    expired: { label: 'Expirado', variant: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    archived: { label: 'Arquivado', variant: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

export const AnnouncementStatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    const config = STATUS_CONFIG[status];

    return (
        <Badge className={cn('font-medium', config.variant, className)}>
            {config.label}
        </Badge>
    );
};

interface SeverityBadgeProps {
    severity: AnnouncementSeverity;
    className?: string;
}

const SEVERITY_CONFIG: Record<AnnouncementSeverity, { label: string; variant: string }> = {
    info: { label: 'Informativo', variant: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    warning: { label: 'Atenção', variant: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    danger: { label: 'Urgente', variant: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

export const AnnouncementSeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
    const config = SEVERITY_CONFIG[severity];

    return (
        <Badge className={cn('font-medium', config.variant, className)}>
            {config.label}
        </Badge>
    );
};

interface ReceiptStatusBadgeProps {
    status: 'pending' | 'seen' | 'acknowledged';
    className?: string;
}

const RECEIPT_CONFIG: Record<'pending' | 'seen' | 'acknowledged', { label: string; icon: string; variant: string }> = {
    pending: { label: 'Pendente', icon: '⏳', variant: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    seen: { label: 'Visualizado', icon: '👁', variant: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    acknowledged: { label: 'Confirmado', icon: '✓', variant: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
};

export const ReceiptStatusBadge: React.FC<ReceiptStatusBadgeProps> = ({ status, className }) => {
    const config = RECEIPT_CONFIG[status];

    return (
        <Badge className={cn('font-medium gap-1', config.variant, className)}>
            <span>{config.icon}</span>
            {config.label}
        </Badge>
    );
};
