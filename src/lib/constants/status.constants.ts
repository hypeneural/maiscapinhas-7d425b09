/**
 * Status Constants
 * 
 * Constants for pedido and capa status values, labels, and colors.
 */

// ============================================================
// Pedido Status
// ============================================================

export const PEDIDO_STATUS = {
    SOLICITADO: 1,
    PRODUTO_INDISPONIVEL: 2,
    DISPONIVEL_LOJA: 3,
    VENDA_REALIZADA: 4,
    CANCELADO: 5,
} as const;

export const PEDIDO_STATUS_LABELS: Record<number, string> = {
    1: 'Solicitado',
    2: 'Produto Indisponível',
    3: 'Disponível na Loja',
    4: 'Venda Realizada',
    5: 'Cancelado',
};

export const PEDIDO_STATUS_COLORS: Record<number, string> = {
    1: 'blue',
    2: 'red',
    3: 'yellow',
    4: 'green',
    5: 'gray',
};

/**
 * Pedido status options for select inputs
 */
export const PEDIDO_STATUS_OPTIONS = [
    { value: 1, label: 'Solicitado', color: 'blue' },
    { value: 2, label: 'Produto Indisponível', color: 'red' },
    { value: 3, label: 'Disponível na Loja', color: 'yellow' },
    { value: 4, label: 'Venda Realizada', color: 'green' },
    { value: 5, label: 'Cancelado', color: 'gray' },
] as const;

// ============================================================
// Capa Status
// ============================================================

export const CAPA_STATUS = {
    ENCOMENDA_SOLICITADA: 1,
    PRODUTO_INDISPONIVEL: 2,
    DISPONIVEL_LOJA: 3,
    VENDA_REALIZADA: 4,
    CANCELADA: 5,
    ENVIADO_PRODUCAO: 6,
} as const;

export const CAPA_STATUS_LABELS: Record<number, string> = {
    1: 'Encomenda Solicitada',
    2: 'Produto Indisponível',
    3: 'Disponível na Loja',
    4: 'Venda Realizada',
    5: 'Cancelada',
    6: 'Enviado para Produção',
};

export const CAPA_STATUS_COLORS: Record<number, string> = {
    1: 'blue',
    2: 'red',
    3: 'yellow',
    4: 'green',
    5: 'gray',
    6: 'purple',
};

/**
 * Capa status options for select inputs
 */
export const CAPA_STATUS_OPTIONS = [
    { value: 1, label: 'Encomenda Solicitada', color: 'blue' },
    { value: 2, label: 'Produto Indisponível', color: 'red' },
    { value: 3, label: 'Disponível na Loja', color: 'yellow' },
    { value: 4, label: 'Venda Realizada', color: 'green' },
    { value: 5, label: 'Cancelada', color: 'gray' },
    { value: 6, label: 'Enviado para Produção', color: 'purple' },
] as const;

// ============================================================
// Color Mappings for Tailwind
// ============================================================

/**
 * Map status color names to Tailwind classes
 */
export const STATUS_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20',
    },
    red: {
        bg: 'bg-red-500/10',
        text: 'text-red-600',
        border: 'border-red-500/20',
    },
    yellow: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        border: 'border-amber-500/20',
    },
    green: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        border: 'border-emerald-500/20',
    },
    gray: {
        bg: 'bg-slate-500/10',
        text: 'text-slate-600',
        border: 'border-slate-500/20',
    },
    purple: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600',
        border: 'border-purple-500/20',
    },
};

/**
 * Get Tailwind classes for a status color
 */
export function getStatusColorClasses(color: string): string {
    const classes = STATUS_COLOR_CLASSES[color] || STATUS_COLOR_CLASSES.gray;
    return `${classes.bg} ${classes.text} ${classes.border}`;
}
