import type { LucideIcon } from 'lucide-react';
import {
    Banknote,
    CheckCircle2,
    Clock,
    CreditCard,
    Lock,
    Monitor,
    QrCode,
    RotateCcw,
    ShoppingCart,
    Store as StoreIcon,
    Wallet,
    XCircle,
} from 'lucide-react';

type VisualConfig = {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
    iconClass?: string;
};

const fallbackBadge =
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700';

const normalizeValue = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

const statusVisuals: Record<string, VisualConfig> = {
    concluido: {
        label: 'Concluída',
        icon: CheckCircle2,
        badgeClass:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        iconClass: 'text-emerald-600 dark:text-emerald-300',
    },
    cancelado: {
        label: 'Cancelada',
        icon: XCircle,
        badgeClass:
            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        iconClass: 'text-rose-600 dark:text-rose-300',
    },
    fechado: {
        label: 'Fechado',
        icon: Lock,
        badgeClass:
            'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
        iconClass: 'text-violet-600 dark:text-violet-300',
    },
    aberto: {
        label: 'Aberto',
        icon: Clock,
        badgeClass:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        iconClass: 'text-amber-600 dark:text-amber-300',
    },
};

const typeVisuals: Record<string, VisualConfig> = {
    venda: {
        label: 'Venda',
        icon: ShoppingCart,
        badgeClass:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        iconClass: 'text-blue-600 dark:text-blue-300',
    },
    fechamento_caixa: {
        label: 'Fechamento',
        icon: Lock,
        badgeClass:
            'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
        iconClass: 'text-violet-600 dark:text-violet-300',
    },
};

const channelVisuals: Record<string, VisualConfig> = {
    HIPER_CAIXA: {
        label: 'Caixa',
        icon: Monitor,
        badgeClass:
            'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
        iconClass: 'text-cyan-600 dark:text-cyan-300',
    },
    HIPER_LOJA: {
        label: 'Loja',
        icon: StoreIcon,
        badgeClass:
            'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        iconClass: 'text-indigo-600 dark:text-indigo-300',
    },
    UNIFICADO: {
        label: 'Unificado',
        icon: StoreIcon,
        badgeClass:
            'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700',
        iconClass: 'text-slate-600 dark:text-slate-300',
    },
};

const paymentVisuals: Record<string, VisualConfig> = {
    dinheiro: {
        label: 'Dinheiro',
        icon: Banknote,
        badgeClass:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        iconClass: 'text-emerald-600 dark:text-emerald-300',
    },
    pix: {
        label: 'Pix',
        icon: QrCode,
        badgeClass:
            'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
        iconClass: 'text-cyan-600 dark:text-cyan-300',
    },
    cartao_credito: {
        label: 'Cartão de crédito',
        icon: CreditCard,
        badgeClass:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        iconClass: 'text-blue-600 dark:text-blue-300',
    },
    cartao_debito: {
        label: 'Cartão de débito',
        icon: CreditCard,
        badgeClass:
            'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        iconClass: 'text-indigo-600 dark:text-indigo-300',
    },
    devolucao: {
        label: 'Devolução',
        icon: RotateCcw,
        badgeClass:
            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        iconClass: 'text-rose-600 dark:text-rose-300',
    },
    crediario: {
        label: 'Crediário',
        icon: Wallet,
        badgeClass:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        iconClass: 'text-amber-600 dark:text-amber-300',
    },
};

export const getStatusVisual = (status: string): VisualConfig => {
    const key = normalizeValue(status);
    return (
        statusVisuals[key] || {
            label: status,
            icon: Clock,
            badgeClass: fallbackBadge,
        }
    );
};

export const getTypeVisual = (tipo: string): VisualConfig => {
    const key = normalizeValue(tipo);
    return (
        typeVisuals[key] || {
            label: tipo,
            icon: ShoppingCart,
            badgeClass: fallbackBadge,
        }
    );
};

export const getChannelVisual = (canal: string): VisualConfig => {
    return (
        channelVisuals[canal] || {
            label: canal,
            icon: StoreIcon,
            badgeClass: fallbackBadge,
        }
    );
};

export const getPaymentVisual = (paymentName: string): VisualConfig => {
    const key = normalizeValue(paymentName)
        .replace(/\s+/g, '_')
        .replace(/cartao_de_credito/, 'cartao_credito')
        .replace(/cartao_de_debito/, 'cartao_debito');

    const found = paymentVisuals[key];
    if (found) {
        return found;
    }

    if (key.includes('credito')) {
        return paymentVisuals.cartao_credito;
    }
    if (key.includes('debito')) {
        return paymentVisuals.cartao_debito;
    }

    return {
        label: paymentName,
        icon: CreditCard,
        badgeClass: fallbackBadge,
    };
};
