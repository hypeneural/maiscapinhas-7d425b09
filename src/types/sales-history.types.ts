export interface SaleItem {
    nome_produto: string;
    codigo_barras: string;
    qtd: number;
    preco_unit: number;
    total: number;
    desconto?: number; // [NOVO] V5
    vendedor_nome?: string;
    vendedor_guid?: string; // [NOVO] V5
    vendedor_whatsapp?: string; // [NOVO] V5
    vendedor_avatar_url?: string; // [NOVO] V5
    vendedor_pdv_id?: number; // [NOVO] V5
}

export interface SalePayment {
    meio_pagamento: string;
    valor: number;
    parcelas: number;
}

export interface Sale {
    id: number;
    store_id: number | string;
    store_pdv_id: number;
    store_name?: string;
    store_pdv_name?: string; // [NOVO] V5
    id_operacao: number | string;
    canal: 'HIPER_CAIXA' | 'HIPER_LOJA' | string;
    id_turno?: string;
    turno_seq?: number; // [NOVO] V5
    data_hora: string;
    total: number;

    // Seller Data
    seller_name?: string;
    seller_email?: string; // [NOVO] V5
    seller_whatsapp?: string | null;
    seller_avatar_url?: string | null;
    seller_hire_date?: string | null;

    // UUIDs [NOVO] V5
    erp_operacao_uuid?: string;
    erp_loja_uuid?: string;

    // Fiscal [NOVO] V5
    fiscal?: {
        nfce?: {
            chave?: string;
            modelo?: string;
            numero?: string;
            serie?: string;
        };
        cliente_cpf?: string;
        signature_hash?: string;
    };

    itens: {
        qtd_linhas: number;
        qtd_total: number;
        valor_total: number;
    };
    pagamentos: {
        qtd_linhas: number;
        valor_total: number;
    };
}

export interface SaleDetail {
    venda: Sale;
    itens: SaleItem[];
    pagamentos: SalePayment[];
}

export interface SalesFilters {
    store_id?: number | string;
    from?: string;
    to?: string;
    vendedor_id?: number | string; // Allow string input to be parsed
    id_turno?: string;
    canal?: string;
    meio_pagamento?: string;
    id_finalizador?: string; // Added from guide
    min_total?: number | string;
    max_total?: number | string;
    sort?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface SalesSummary {
    total_vendas: number;
    total_vendido: number;
}

export interface SalesResponse {
    data: Sale[];
    summary?: SalesSummary;
    meta: {
        pagination: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
        };
    };
}

export interface SellerAux {
    id: string; // The seller ID (can be same across stores)
    nome: string;
    store_name?: string; // [NOVO] V5 Global Search
    unique_key?: string; // [NOVO] V5 Global Search (store_pdv_id|seller_id)
    source?: 'mapped' | 'pdv_registry';
    user_id?: number | null;
}

export interface ShiftAux {
    id_turno: string;
    sequencial: number;
    periodo: string;
    operador_nome: string;
    fechado: boolean;
    data_hora_inicio: string;
    data_hora_termino?: string | null;
    total_sistema?: number;
    total_declarado?: number;
}

export interface PaymentMethodAux {
    id: string;
    nome: string;
}

export interface SaleDetailResponse {
    data: SaleDetail;
}
