/**
 * Conference Types
 * 
 * Types for Cash Shifts and Cash Closings based on backend API spec.
 */

// ============================================================
// ENUMS & CONSTANTS
// ============================================================

export const SHIFT_CODES = {
  '1': '1° Turno',
  '2': '2° Turno',
  '3': '3° Turno',
} as const;

export type ShiftCode = keyof typeof SHIFT_CODES;

export const CASH_SHIFT_STATUS = {
  open: 'Aberto',
  closed: 'Fechado',
  pending: 'Pendente',
} as const;

export type CashShiftStatus = keyof typeof CASH_SHIFT_STATUS;

export const CASH_CLOSING_STATUS = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
} as const;

export type CashClosingStatus = keyof typeof CASH_CLOSING_STATUS;

export const PAYMENT_LABELS = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão Crédito',
  DEBIT_CARD: 'Cartão Débito',
  PIX: 'PIX',
  OTHER: 'Outros',
} as const;

export type PaymentLabel = (typeof PAYMENT_LABELS)[keyof typeof PAYMENT_LABELS];

// ============================================================
// BASE ENTITIES
// ============================================================

export interface CashShift {
  id: number;
  store_id: number;
  date: string; // YYYY-MM-DD
  shift_code: ShiftCode;
  seller_id: number;
  status: CashShiftStatus;
  store?: { id: number; name: string };
  seller?: { id: number; name: string };
  cash_closing?: CashClosing | null;
  created_at: string;
  updated_at: string;
}

export interface CashClosing {
  id: number;
  cash_shift_id: number;
  status: CashClosingStatus;
  closed_by: number | null;
  closed_at: string | null;
  version: number;

  // Justificativa por turno (não por linha)
  justification_text: string | null;
  justified: boolean;

  lines: CashClosingLine[];
  cash_shift?: CashShift;
  closed_by_user?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CashClosingLine {
  id: number;
  cash_closing_id: number;
  label: string;
  system_value: number;
  real_value: number;
  diff_value: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PENDING & DIVERGENT RESPONSES
// ============================================================

export interface PendingShift {
  id: number;
  date: string;
  shift_code: ShiftCode;
  days_pending: number;
  priority: 'low' | 'medium' | 'high';
  store_name: string;
  seller_name: string;
  status: 'not_started' | 'draft' | 'submitted';
}

export interface PendingShiftsResponse {
  total_pending: number;
  shifts: PendingShift[];
}

export interface DivergentShift {
  id: number;
  date: string;
  shift_code: ShiftCode;
  store_name: string;
  seller_name: string;
  divergence: number;
  has_justification: boolean;
  days_pending: number;
}

export interface DivergentShiftsResponse {
  total_divergent: number;
  total_divergence_value: number;
  shifts: DivergentShift[];
}

// ============================================================
// REQUEST TYPES
// ============================================================

export interface CashShiftFilters {
  store_id?: number;
  date?: string;
  status?: CashShiftStatus;
  per_page?: number;
  page?: number;
}

export interface CreateCashShiftRequest {
  store_id: number;
  date: string;
  shift_code: ShiftCode;
  seller_id?: number;
}

export interface CreateClosingLineRequest {
  label: string;
  system_value: number;
  real_value: number;
}

export interface CreateClosingRequest {
  lines: CreateClosingLineRequest[];
  justification_text?: string | null;
  justified?: boolean;
}

export interface UpdateClosingRequest {
  lines: Array<{
    id?: number;
    label: string;
    system_value: number;
    real_value: number;
  }>;
  justification_text?: string | null;
  justified?: boolean;
}

export interface RejectClosingRequest {
  reason: string;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface CashShiftListResponse {
  data: CashShift[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface CashShiftDetailResponse {
  data: CashShift;
  meta: { timestamp: string };
}

export interface CashClosingDetailResponse {
  data: CashClosing;
  meta: { timestamp: string };
}

// ============================================================
// REPORTS
// ============================================================

export interface CashIntegrityReport {
  store_id: number;
  period: string;
  cash_integrity: {
    total_system_value: number;
    total_real_value: number;
    total_divergence: number;
    cash_break_percentage: number;
    status: 'GREEN' | 'YELLOW' | 'RED';
  };
  divergence_analysis: {
    total_lines_with_divergence: number;
    justified_count: number;
    unjustified_count: number;
    justified_rate: number;
  };
  workflow_status: {
    total_shifts: number;
    closed_count: number;
    pending_approval: number;
    completion_rate: number;
  };
  alerts: Array<{
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    code: string;
    message: string;
  }>;
}

export interface CashIntegrityReportResponse {
  data: CashIntegrityReport;
  meta: { timestamp: string };
}

// ============================================================
// HELPER TYPES
// ============================================================

/** Line data for the form (before submission) */
export interface ClosingLineFormData {
  label: PaymentLabel | string;
  system_value: number;
  real_value: number;
}

/** Default payment lines for new closing */
export const DEFAULT_CLOSING_LINES: ClosingLineFormData[] = [
  { label: PAYMENT_LABELS.CASH, system_value: 0, real_value: 0 },
  { label: PAYMENT_LABELS.CREDIT_CARD, system_value: 0, real_value: 0 },
  { label: PAYMENT_LABELS.DEBIT_CARD, system_value: 0, real_value: 0 },
  { label: PAYMENT_LABELS.PIX, system_value: 0, real_value: 0 },
];
