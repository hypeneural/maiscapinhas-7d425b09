/**
 * Application Constants
 * 
 * Centralized constants for the ERP.
 */

/**
 * Payment methods available in the system
 */
export const PAYMENT_METHODS = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'credito', label: 'Cartão de Crédito' },
    { value: 'debito', label: 'Cartão de Débito' },
] as const;

/**
 * Shift codes with labels
 */
export const SHIFT_CODES = [
    { value: 'M', label: 'Manhã', hours: '06:00 - 14:00' },
    { value: 'T', label: 'Tarde', hours: '14:00 - 22:00' },
    { value: 'N', label: 'Noite', hours: '22:00 - 06:00' },
] as const;

/**
 * User roles with labels
 */
export const USER_ROLES = [
    { value: 'admin', label: 'Administrador', level: 4 },
    { value: 'gerente', label: 'Gerente', level: 3 },
    { value: 'conferente', label: 'Conferente', level: 2 },
    { value: 'vendedor', label: 'Vendedor', level: 1 },
] as const;

/**
 * Shift statuses with labels
 */
export const SHIFT_STATUSES = [
    { value: 'open', label: 'Aberto' },
    { value: 'submitted', label: 'Enviado' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'rejected', label: 'Rejeitado' },
] as const;

/**
 * React Query cache keys for standardization
 */
export const QUERY_KEYS = {
    AUTH: ['auth'],
    USER: ['auth', 'user'],
    DASHBOARD: ['dashboard'],
    SALES: ['sales'],
    CASH: ['cash'],
    FINANCE: ['finance'],
    REPORTS: ['reports'],
    STORES: ['stores'],
} as const;

/**
 * API endpoints for reference
 */
export const API_ENDPOINTS = {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/me',
    DASHBOARD_SELLER: '/dashboard/seller',
    DASHBOARD_STORE: '/dashboard/store',
    DASHBOARD_ADMIN: '/dashboard/admin',
    SALES: '/sales',
    CASH_SHIFTS: '/cash/shifts',
    CASH_CLOSINGS: '/cash/closings',
    FINANCE_BONUS: '/finance/bonus',
    FINANCE_COMMISSION: '/finance/commission',
    REPORTS_RANKING: '/reports/ranking',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 15,
    PAGE_SIZE_OPTIONS: [10, 15, 25, 50] as const,
} as const;

/**
 * Time constants in milliseconds
 */
export const TIME = {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
} as const;
