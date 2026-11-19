/**
 * Conference Types
 * 
 * Types for Cash Shifts and Cash Closings based on backend API spec.
 */

// ============================================================
// ENUMS & CONSTANTS
// ============================================================

export const SHIFT_CODES: Record<string, string> = {
  '1': '1° Turno',
  '2': '2° Turno',
  '3': '3° Turno',
};

export type ShiftCode = string;

export const CASH_SHIFT_STATUS = {
  open: 'Aberto',
  closed: 'Fechado',
  pending: 'Pendente',
};

export type CashShiftStatus = keyof typeof CASH_SHIFT_STATUS;

export const CASH_CLOSING_STATUS = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Reprovado',
};

export type CashClosingStatus = keyof typeof CASH_CLOSING_STATUS;

export const PAYMENT_LABELS = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  PIX: 'Pix',
  DEVOLUTION: 'Devolução',
  INSTALLMENT: 'Crediário',
  OTHER: 'Outros',
};

export type PaymentLabel = (typeof PAYMENT_LABELS)[keyof typeof PAYMENT_LABELS];

/** All known payment methods for the adjustment line selector */
export const ALL_PAYMENT_METHODS: string[] = Object.values(PAYMENT_LABELS);

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

export interface CashClosingAttachment {
  id: number;
  cash_closing_id?: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  url: string;
  uploaded_by: number | null;
  created_at: string;
  updated_at?: string;
}

/** Fix broken URLs like "http://https://..." from backend Storage misconfiguration */
export function sanitizeStorageUrl(url: string): string {
  if (url.startsWith('http://https://') || url.startsWith('http://https//')) {
    return url.replace(/^http:\/\//, '');
  }
  return url;
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
  observer_notes: string | null;

  lines: CashClosingLine[];
  attachments?: CashClosingAttachment[];
  cash_shift?: CashShift;
  closed_by_user?: { id: number; name: string } | null;
  activities?: unknown[]; // Activity log
  created_at: string;
  updated_at: string;
}

export interface CashClosingLine {
  id: number;
  cash_closing_id: number;
  label: string;
  system_value: number | string;
  real_value: number | string;
  diff_value: number | string;
  justification_text?: string | null;
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
  conferente_name?: string | null;
  submitted_at?: string | null;
  justification_text?: string | null;
  observer_notes?: string | null;
  attachments?: { id: number; file_name: string; file_type: string; file_size: number; url: string }[];
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
  from?: string;
  to?: string;
  status?: string;
  seller_id?: number;
  shift_code?: string;
  page?: number;
  per_page?: number;
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

export interface PdvPaymentBreakdown {
  id_finalizador: number;
  label: string;
  value: number;
  qtd_vendas?: number;
}

export interface PdvClosureDetail {
  closure_uuid: string;
  sequencial: number;
  periodo: string;
  sistema_caixa: number;
  sistema_loja: number;
  entries_expected: number;
  declarado: number;
  falta: number;
  sobra: number;
  operador: string | null;
  responsavel: {
    nome: string | null;
    guid: string | null;
    login: string | null;
  };
  canais: string[];
  data_hora_inicio: string | null;
  data_hora_termino: string | null;
}

export interface PdvClosureDataResponse {
  data: {
    system_total: number;
    system_total_caixa: number;
    system_total_loja: number;
    declared_total: number;
    falta_total: number;
    sobra_total: number;
    entries_expected: number;
    declared_consistent: boolean;
    has_loja_sales: boolean;
    canais_presentes: string[];
    payments_sistema: PdvPaymentBreakdown[];
    payments_declarado: PdvPaymentBreakdown[];
    payments_falta: PdvPaymentBreakdown[];
    payments_sobra: PdvPaymentBreakdown[];
    payments: Array<{ label: string; value: number }>;
    closures_found: number;
    details: PdvClosureDetail[];
  };
}

export interface SmartFilters {
  stores: Array<{ id: number; name: string }>;
  dates: string[];
  shifts: string[];
  sellers: {
    suggested: { id: number; name: string; guid: string } | null;
    all: Array<{ id: number; name: string; guid: string }>;
  };
}

export interface SmartFiltersResponse {
  data: SmartFilters;
}

export interface HistoryFilters {
  stores: Array<{ id: number; name: string }>;
  sellers: Array<{ id: number; name: string }>;
  shifts: string[];
  statuses: string[];
  months: string[]; // format: "YYYY-MM"
}

export interface HistoryFiltersResponse {
  data: HistoryFilters;
}

export interface ConferencePendingTurn {
  closure_uuid: string;
  store: {
    id: number;
    name: string;
    guid: string | null;
  };
  date: string;
  shift_code: string;
  reference_datetime: string | null;
  started_at: string | null;
  ended_at: string | null;
  responsavel: {
    nome: string | null;
    guid: string | null;
  };
  operador_nome: string | null;
  total_value: number;
}

export interface ConferencePendingTurnsData {
  total_pending: number;
  limit: number;
  turns: ConferencePendingTurn[];
}

export interface ConferencePendingTurnsResponse {
  data: ConferencePendingTurnsData;
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
