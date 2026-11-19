/**
 * Shift Card ViewModel
 * 
 * Transforms raw CashShift data into a formatted view model for the Kanban card.
 */

import type { CashShift, ConferencePendingTurn } from '@/types/conference.types';

export interface ShiftCardVM {
    id: string | number;
    storeName: string;
    date: string;
    dateFormatted: string;
    shiftLabel: string;
    sellerName: string;
    conferenteName: string | null;
    totalSystem: number;
    totalReal: number;
    totalDiff: number;
    hasDivergence: boolean;
    hasJustification: boolean;
    hasObserverNotes: boolean;
    justificationPreview: string | null;
    observerNotesPreview: string | null;
    status: string;
    closingStatus: string | null;
    aging: string;
    agingMinutes: number;
    borderColor: string;
    isPendingTurn: boolean;
    operadorNome: string | null;
    totalValue: number | null;
}

const SHIFT_LABELS: Record<string, string> = {
    '1': '1° Turno',
    '2': '2° Turno',
    '3': '3° Turno',
};

function toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
}

/**
 * Parse date string robustly — handles YYYY-MM-DD, ISO 8601, and other formats
 */
function formatDateBr(dateStr: string): string {
    if (!dateStr) return '-';

    // Try to extract YYYY-MM-DD from the start (works for "2026-02-27" and "2026-02-27T00:00:00.000000Z")
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return `${match[3]}/${match[2]}`;
    }

    // Fallback: try Date object
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    return dateStr;
}

/**
 * Full date with year for more descriptive display
 */
function formatDateFullBr(dateStr: string): string {
    if (!dateStr) return '-';
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return dateStr;
}

function getAging(dateStr: string): { text: string; minutes: number } {
    if (!dateStr) return { text: '-', minutes: 0 };
    const now = new Date();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { text: '-', minutes: 0 };
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 0) return { text: 'agora', minutes: 0 };
    if (diffMin < 1) return { text: 'agora', minutes: 0 };
    if (diffMin < 60) return { text: `há ${diffMin}min`, minutes: diffMin };

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return { text: `há ${diffH}h`, minutes: diffMin };

    const diffD = Math.floor(diffH / 24);
    return { text: `há ${diffD}d`, minutes: diffMin };
}

function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max).trim() + '...';
}

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Get conference user name from closing activities
 */
function getConferenceUser(shift: CashShift): string | null {
    const closing = shift.cash_closing;
    if (!closing) return null;

    if ((closing as any).closed_by_user?.name) return (closing as any).closed_by_user.name;

    const activities = (closing as any).activities;
    if (Array.isArray(activities) && activities.length > 0) {
        for (const act of activities) {
            if (act.causer?.name) {
                const newStatus = act.properties?.attributes?.status;
                if (newStatus === 'submitted' || newStatus === 'approved') {
                    return act.causer.name;
                }
            }
        }
        const withCauser = activities.find((a: any) => a.causer?.name);
        if (withCauser) return withCauser.causer.name;
    }

    return null;
}

export function mapShiftToCardVM(shift: CashShift): ShiftCardVM {
    const closing = shift.cash_closing;
    const lines = closing?.lines || [];

    const totalSystem = lines.reduce((s, l) => s + toNumber(l.system_value), 0);
    const totalReal = lines.reduce((s, l) => s + toNumber(l.real_value), 0);
    const totalDiff = lines.reduce((s, l) => s + toNumber(l.diff_value), 0);
    const hasDivergence = Math.abs(totalDiff) >= 0.01;

    const justification = closing?.justification_text?.trim() || null;
    const observerNotes = closing?.observer_notes?.trim() || null;
    const hasJustification = !!justification;
    const hasObserverNotes = !!observerNotes;

    const aging = getAging(closing?.updated_at || closing?.created_at || shift.updated_at || shift.created_at);

    let borderColor = 'border-l-slate-300';
    if (closing) {
        if (!hasDivergence) borderColor = 'border-l-green-500';
        else if (hasJustification || hasObserverNotes) borderColor = 'border-l-amber-500';
        else borderColor = 'border-l-red-500';
    }

    return {
        id: shift.id,
        storeName: shift.store?.name || `Loja ${shift.store_id}`,
        date: shift.date,
        dateFormatted: formatDateBr(shift.date),
        shiftLabel: SHIFT_LABELS[shift.shift_code] || `Turno ${shift.shift_code}`,
        sellerName: shift.seller?.name || '-',
        conferenteName: getConferenceUser(shift),
        totalSystem,
        totalReal,
        totalDiff,
        hasDivergence,
        hasJustification,
        hasObserverNotes,
        justificationPreview: justification ? truncate(justification, 60) : null,
        observerNotesPreview: observerNotes ? truncate(observerNotes, 60) : null,
        status: shift.status,
        closingStatus: closing?.status || null,
        aging: aging.text,
        agingMinutes: aging.minutes,
        borderColor,
        isPendingTurn: false,
        operadorNome: null,
        totalValue: totalSystem || null,
    };
}

/**
 * Map a ConferencePendingTurn (from /cash/conference-pending-turns) into the same VM shape
 */
export function mapPendingTurnToCardVM(turn: ConferencePendingTurn): ShiftCardVM {
    const aging = getAging(turn.ended_at || turn.reference_datetime || turn.started_at || `${turn.date}T23:59:59`);

    return {
        id: turn.closure_uuid,
        storeName: turn.store?.name || `Loja ${turn.store?.id}`,
        date: turn.date,
        dateFormatted: formatDateBr(turn.date),
        shiftLabel: SHIFT_LABELS[turn.shift_code] || `Turno ${turn.shift_code}`,
        sellerName: turn.responsavel?.nome || turn.operador_nome || '-',
        conferenteName: null,
        totalSystem: turn.total_value || 0,
        totalReal: 0,
        totalDiff: 0,
        hasDivergence: false,
        hasJustification: false,
        hasObserverNotes: false,
        justificationPreview: null,
        observerNotesPreview: null,
        status: 'pending',
        closingStatus: null,
        aging: aging.text,
        agingMinutes: aging.minutes,
        borderColor: 'border-l-slate-300',
        isPendingTurn: true,
        operadorNome: turn.operador_nome,
        totalValue: turn.total_value,
    };
}

export { formatCurrency, formatDateBr, formatDateFullBr };
