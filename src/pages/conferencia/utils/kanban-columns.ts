/**
 * Kanban Column Configuration
 * 
 * Defines the 5 columns of the Kanban board with colors, icons, and matching rules.
 */

import type { LucideIcon } from 'lucide-react';
import { Clock, FileEdit, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { CashShift } from '@/types/conference.types';

export interface KanbanColumnConfig {
    id: string;
    label: string;
    subtitle: string;
    colorClasses: {
        bg: string;
        border: string;
        text: string;
        badge: string;
        headerBg: string;
    };
    icon: LucideIcon;
    match: (shift: CashShift) => boolean;
    defaultCompact?: boolean;
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
    {
        id: 'pending',
        label: 'Pendente',
        subtitle: 'Não conferidos',
        colorClasses: {
            bg: 'bg-slate-500/5',
            border: 'border-slate-300',
            text: 'text-slate-600',
            badge: 'bg-slate-100 text-slate-700 border-slate-200',
            headerBg: 'bg-slate-500/10',
        },
        icon: Clock,
        match: (shift) => {
            const closing = shift.cash_closing;
            return !closing || !closing.status;
        },
    },
    {
        id: 'draft',
        label: 'Em Conferência',
        subtitle: 'Rascunho salvo',
        colorClasses: {
            bg: 'bg-blue-500/5',
            border: 'border-blue-300',
            text: 'text-blue-600',
            badge: 'bg-blue-100 text-blue-700 border-blue-200',
            headerBg: 'bg-blue-500/10',
        },
        icon: FileEdit,
        match: (shift) => shift.cash_closing?.status === 'draft',
    },
    {
        id: 'submitted',
        label: 'Aguardando Gestor',
        subtitle: 'Divergência justificada',
        colorClasses: {
            bg: 'bg-amber-500/5',
            border: 'border-amber-300',
            text: 'text-amber-600',
            badge: 'bg-amber-100 text-amber-700 border-amber-200',
            headerBg: 'bg-amber-500/10',
        },
        icon: AlertTriangle,
        match: (shift) => shift.cash_closing?.status === 'submitted',
    },
    {
        id: 'approved',
        label: 'Aprovado',
        subtitle: 'Conferência finalizada',
        colorClasses: {
            bg: 'bg-green-500/5',
            border: 'border-green-300',
            text: 'text-green-600',
            badge: 'bg-green-100 text-green-700 border-green-200',
            headerBg: 'bg-green-500/10',
        },
        icon: CheckCircle,
        match: (shift) => shift.cash_closing?.status === 'approved',
    },
    {
        id: 'rejected',
        label: 'Reprovado',
        subtitle: 'Devolvido para correção',
        colorClasses: {
            bg: 'bg-red-500/5',
            border: 'border-red-300',
            text: 'text-red-600',
            badge: 'bg-red-100 text-red-700 border-red-200',
            headerBg: 'bg-red-500/10',
        },
        icon: XCircle,
        match: (shift) => shift.cash_closing?.status === 'rejected',
    },
];

/**
 * Get the kanban column ID for a given shift
 */
export function getShiftColumnId(shift: CashShift): string {
    for (const col of KANBAN_COLUMNS) {
        if (col.match(shift)) return col.id;
    }
    return 'pending';
}
