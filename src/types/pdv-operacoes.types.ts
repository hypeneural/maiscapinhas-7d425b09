/**
 * PDV Operações Types
 *
 * Types for the unified Operations History page
 * (vendas + fechamentos de caixa).
 */

// ============================================================
// Main Entity
// ============================================================

export interface Operacao {
    tipo_operacao: 'venda' | 'fechamento_caixa';
    data_hora: string; // ISO 8601, UTC
    store_id: number | string | null;
    store_name: string | null;
    store_pdv_id: number;
    turno_seq: number | null;
    canal: 'HIPER_CAIXA' | 'HIPER_LOJA' | 'UNIFICADO';
    operacao_id: number | null;
    closure_uuid?: string;
    operacao_label: string;
    status: string; // 'concluido' | 'cancelado' | 'FECHADO' | 'ABERTO'
    itens: number;
    valor: number;
    vendedor_nome: string | null;
    meio_pagamento: string | null;
}

// ============================================================
// Summary
// ============================================================

export interface OperacoesSummary {
    total_operacoes: number;
    total_vendas: number;
    total_fechamentos: number;
    total_valor: number;
}

// ============================================================
// Filters (Query Params)
// ============================================================

export interface OperacoesFilters {
    store_id?: number | string;
    store_pdv_id?: number;
    store_alias?: string;
    from?: string;
    to?: string;
    tipo_operacao?: 'venda' | 'fechamento_caixa' | '';
    status?: string;
    vendedor_id?: number | string;
    canal?: 'HIPER_CAIXA' | 'HIPER_LOJA' | '';
    turno_seq?: number;
    meio_pagamento?: string;
    id_finalizador?: number | string;
    min_total?: number | string;
    max_total?: number | string;
    per_page?: number;
    sort?: 'asc' | 'desc';
    page?: number;
}

// ============================================================
// Response
// ============================================================

export interface OperacoesPagination {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
}

export interface OperacoesResponse {
    data: Operacao[];
    summary: OperacoesSummary;
    filters: Record<string, any>;
    meta: {
        request_id: string;
        timestamp: string;
        pagination: OperacoesPagination;
    };
}

// ============================================================
// Closure Detail (closure-diagnose API)
// ============================================================

export interface ClosureTotais {
    sistema_caixa: number;
    entries_expected: number;
    declarado: number;
    falta: number;
    sobra: number;
    has_loja_sales: boolean;
    declared_consistent: boolean;
}

export interface ClosurePagamentoPorMeio {
    id_finalizador: number;
    meio_pagamento: string;
    entries_expected: number;
    declarado: number;
    falta: number;
    sobra: number;
    origin_caixa_system: number;
    origin_loja_inferred: number;
}

export interface ClosurePagamentoSistema {
    id_finalizador: number;
    meio_pagamento: string;
    total: number;
    qtd_vendas: number;
}

export interface ClosureDetail {
    closure_uuid: string;
    store_pdv_id: number;
    store_id: number;
    sequencial: number;
    operador_nome: string;
    operador_login: string;
    data_hora_inicio: string;
    data_hora_termino: string;
    data_hora_fechamento: string;
    periodo: 'MATUTINO' | 'VESPERTINO' | 'NOTURNO';
    canal_canonico: string;
    canais_presentes: string[];
    num_canais: number;
    totais: ClosureTotais;
    pagamentos: {
        por_meio: ClosurePagamentoPorMeio[];
        sistema_caixa: ClosurePagamentoSistema[];
        sistema_loja: ClosurePagamentoSistema[];
        sistema: ClosurePagamentoSistema[];
        declarado: ClosurePagamentoSistema[];
        falta: ClosurePagamentoSistema[];
        sobra: ClosurePagamentoSistema[];
    };
}
