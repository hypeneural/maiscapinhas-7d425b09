/**
 * Closure Validation Types
 *
 * Types for the POST /api/v1/pdv/closures/validate-batch endpoint.
 * Supports both single-channel (turno_db) and unified (local_unified) responses.
 */

// ── Request ──

export interface ClosureValidateRequest {
    source: 'erp' | 'json';
    connection_id?: number;
    timezone?: string;
    limit?: number;
    body?: Record<string, any>;
    Lista?: any[];
}

// ── Response ──

export interface ClosureValidateResponse {
    ok: boolean;
    source: 'erp' | 'json';
    batch_count: number;
    erp_total_returned?: number;
    closures_filtered?: number;
    stats?: {
        found: number;
        not_found: number;
    };
    results: ClosureResultItem[];
    url?: string;
    missing_cookies?: string[];
    error?: string;
}

export interface ClosureResultItem {
    input_id: string;
    closure_summary: ClosureSummary;
    validation: ClosureValidation;
}

export interface ClosureSummary {
    codigo: number | null;
    erp_id: string | null;
    turno_id: string | null;
    erp_loja_uuid: string | null;
    valor: string | null;
    valor_liquido: number | null;
    valor_bruto: number | null;
    data: string | null;
    turno: string | null;
    turno_seq: number | null;
    loja_erp_id: string | null;
    loja_nome: string | null;
    found_in_db: boolean;
    tipo: string | null;
    cancelada: boolean;
    concluida: boolean | null;
    operador_guid: string | null;
    turno_fechado: boolean | null;
    turno_inicio: string | null;
    turno_termino: string | null;
}

export type MatchType = 'uuid' | 'exact' | 'exact_declarado' | 'closure_uuid' | 'closure_uuid_single' | 'heuristic' | null;

export interface ClosureValidation {
    ok: boolean;
    found: boolean;
    match_type: MatchType;
    match_confidence: number;
    reason?: string;
    status_erp?: 'CANCELLED';

    // Single-channel response
    turno_db?: TurnoDB;
    pagamentos?: PagamentosGrouped;
    comparison?: ClosureComparison;

    // Unified response (multiple channels)
    unified?: boolean;
    local_unified?: LocalUnified;
    diff_por_meio?: DiffPorMeio[];

    debug?: {
        turno_id: string | null;
        loja_id: string | null;
        usuario_id: string | null;
        store_id: number | null;
        erp_total: number;
    };
}

// ── Unified Closure Data ──

export interface LocalUnified {
    closure_uuid: string;
    canal_canonico: string;
    canais_presentes: string[];
    sequencial: number | null;
    operador_nome: string | null;
    operador_guid: string | null;
    data_hora_inicio: string | null;
    data_hora_termino: string | null;
    periodo: string | null;
    store_name: string | null;
    store_city: string | null;
    totais: UnifiedTotais;
}

export interface UnifiedTotais {
    sistema_caixa: number;
    loja_total_sistema_raw: number;
    entries_expected: number;
    loja_cash_contribution_inferred: number;
    declarado: number;
    falta: number;
    sobra: number;
    has_loja_sales: boolean;
    declared_consistent: boolean;
    declared_min: number;
    declared_max: number;
}

export interface DiffPorMeio {
    meio: string;
    erp: {
        entradas_sistema: number;
        lancamentos_sistema: number;
        valor_sistema: number;
        falta: number;
        sobra: number;
    };
    local: {
        sistema: number | null;
        declarado: number | null;
    };
}

// ── Single-Channel Data ──

export interface TurnoDB {
    id: number;
    id_turno: string;
    canal: string;
    sequencial: number | null;
    fechado: boolean;
    data_hora_inicio: string | null;
    data_hora_termino: string | null;
    duracao_minutos: number | null;
    periodo: string | null;
    operador_nome: string | null;
    operador_guid: string | null;
    operador_hiper_id: number | null;
    responsavel_nome: string | null;
    responsavel_guid: string | null;
    total_sistema: number;
    total_declarado: number | null;
    total_falta: number | null;
    total_sobra: number | null;
    closure_uuid: string | null;
    data_hora_fechamento: string | null;
    tipo_operacao_fechamento: string | null;
    qtd_vendas_sistema: number | null;
    store_name: string | null;
    store_city: string | null;
    last_sync_id: number | null;
}

export interface PagamentoItem {
    id_finalizador: number;
    meio_pagamento: string;
    total: number;
    qtd_vendas: number;
    pagamento_uuid?: string;
    operacao_uuid?: string;
}

export interface PagamentosGrouped {
    sistema: PagamentoItem[];
    declarado: PagamentoItem[];
    falta: PagamentoItem[];
    sobra: PagamentoItem[];
}

export interface ClosureComparisonField<T = any> {
    erp?: T;
    db?: T;
    db_unificado?: T;
    match?: boolean;
    diff?: number;
    db_nome?: string;
    erp_guid?: string;
    db_guid?: string;
}

export interface ClosureComparison {
    total: ClosureComparisonField<number>;
    operador: {
        erp_guid: string | null;
        db_guid: string | null;
        db_nome: string | null;
        match: boolean;
    };
    sequencial: ClosureComparisonField<number>;
    fechado?: ClosureComparisonField<boolean>;
    closure_uuid: ClosureComparisonField<string>;
    total_declarado?: { db: number | null };
    total_falta?: { db: number | null };
    total_sobra?: { db: number | null };
    declared_consistent?: boolean;
}

// ── Compare Detail Types ──
// POST /api/v1/pdv/closures/compare-detail

export interface CompareDetailRequest {
    turno_id: string;        // UUID do fechamento no ERP
    closure_uuid: string;    // UUID do closure no banco local
    connection_id?: number;
}

export interface CompareDetailResponse {
    ok: boolean;
    erp: CompareErpNormalized;
    local: CompareLocalNormalized;
    comparison: DetailedComparison;
    error?: string;
}

export interface CompareErpNormalized {
    turno_id: string;
    fechado: boolean;
    total_entradas_sistema: number;
    total_lancamentos_sistema: number;
    total_na_gaveta: number;
    total_no_sistema: number;
    turno: {
        sequencial: number | null;
        loja_id: string | null;
        usuario_id: string | null;
        data: string | null;
        inicio: string | null;
        termino: string | null;
        fechado: boolean;
    };
    meios_pagamento: CompareErpMeio[];
}

export interface CompareErpMeio {
    nome: string;
    id_tipo: number | null;
    entradas_sistema: number;
    lancamentos_sistema: number;
    valor_sistema: number;
    falta: number;
    sobra: number;
    valor_gaveta: number;
    origens: CompareErpOrigem[];
}

export interface CompareErpOrigem {
    origem: string | null;
    entradas_sistema: number;
    lancamentos_sistema: number;
    valor_sistema: number;
    falta: number;
    sobra: number;
}

export interface CompareLocalNormalized {
    closure_uuid: string;
    store: { id: number; name: string; guid: string } | null;
    canais_presentes: string[];
    canal_canonico: string | null;
    sequencial: number | null;
    operador_guid: string | null;
    operador_nome: string | null;
    periodo: string | null;
    data_hora_inicio: string | null;
    data_hora_termino: string | null;
    totais: {
        entries_expected: number;
        declarado: number;
        falta: number;
        sobra: number;
        sistema_caixa: number;
        loja_total_sistema_raw: number;
        declared_consistent: boolean;
    };
    meios_pagamento: Record<string, any>;
}

export interface DetailedComparison {
    totais: {
        erp_total: number;
        local_total: number;
        match: boolean;
        diff: number;
    };
    falta: {
        erp: number;
        local: number;
        match: boolean;
        diff: number;
    };
    sobra: {
        erp: number;
        local: number;
        match: boolean;
        diff: number;
    };
    por_meio: ComparePaymentMethodItem[];
    operador: {
        erp_guid: string | null;
        local_guid: string | null;
        local_nome: string | null;
        match: boolean;
    };
    sequencial: {
        erp: number | null;
        local: number | null;
        match: boolean;
    };
    fechado: {
        erp: boolean;
        local: boolean;
        match: boolean;
    };
}

export interface ComparePaymentMethodItem {
    meio: string;
    erp_entradas: number | null;
    local_expected: number | null;
    local_declarado: number | null;
    erp_falta: number | null;
    local_falta: number | null;
    erp_sobra: number | null;
    local_sobra: number | null;
    match_entradas: boolean;
    match_declarado: boolean;
    match_falta: boolean;
    match_sobra: boolean;
    only_erp: boolean;
    only_local: boolean;
}
