/**
 * Formatting Utilities
 * 
 * Standard formatters for currency, dates, and percentages.
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Format number as Brazilian Real currency
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value == null) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Format number as compact currency (e.g., R$ 1,5K)
 */
export function formatCurrencyCompact(value: number | null | undefined): string {
    if (value == null) return 'R$ 0';

    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
}

/**
 * Format number as percentage
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
    if (value == null) return '0%';
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format date string to Brazilian format (dd/MM/yyyy)
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return '-';
    }
}

/**
 * Format date string with time (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
        return '-';
    }
}

/**
 * Format date as relative time (e.g., "há 2 horas")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
    } catch {
        return '-';
    }
}

/**
 * Format shift code to display name
 */
export function formatShiftCode(code: 'M' | 'T' | 'N' | string): string {
    const shifts: Record<string, string> = {
        M: 'Manhã',
        T: 'Tarde',
        N: 'Noite',
    };
    return shifts[code] || code;
}

/**
 * Format payment method to display name
 */
export function formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
        dinheiro: 'Dinheiro',
        pix: 'PIX',
        credito: 'Crédito',
        debito: 'Débito',
    };
    return methods[method] || method;
}

/**
 * Format user role to display name
 */
export function formatRole(role: string): string {
    const roles: Record<string, string> = {
        admin: 'Administrador',
        gerente: 'Gerente',
        conferente: 'Conferente',
        vendedor: 'Vendedor',
    };
    return roles[role] || role;
}
