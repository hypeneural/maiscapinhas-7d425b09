/**
 * Reports Service
 * 
 * Manages ranking, store performance, and cash integrity reports.
 */

import { apiGet } from '@/lib/api';
import type {
    ApiResponse,
    RankingResponse,
    RankingFilters,
    ConsolidatedPerformanceFilters,
    BirthdayEntry,
    StorePerformance,
    ConsolidatedPerformanceResponse,
    CashIntegrityData,
    UserKpisFilters,
    UserKpisResponse
} from '@/types/api';
import type {
    SalesFilters,
    SalesResponse,
    SaleDetailResponse
} from '@/types/sales-history.types';

// ============================================================
// Ranking
// ============================================================

/**
 * Get seller ranking
 */
export async function getRanking(filters: RankingFilters = {}): Promise<RankingResponse> {
    const response = await apiGet<ApiResponse<RankingResponse>>('/reports/ranking', filters);
    return response.data;
}

// ============================================================
// Store Performance
// ============================================================

/**
 * Get consolidated performance for all stores
 * Used by /gestao/lojas page
 */
export async function getConsolidatedPerformance(
    filters: ConsolidatedPerformanceFilters | string = {}
): Promise<ConsolidatedPerformanceResponse> {
    const params: Record<string, unknown> = {};

    if (typeof filters === 'string') {
        if (filters) {
            params.month = filters;
        }
    } else {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params[key] = value;
            }
        });
    }

    const response = await apiGet<ApiResponse<ConsolidatedPerformanceResponse>>(
        '/reports/consolidated',
        params
    );
    return response.data;
}

/**
 * Get performance for a single store
 */
export async function getStorePerformance(
    storeId: number,
    month?: string
): Promise<StorePerformance> {
    const params: Record<string, unknown> = { store_id: storeId };
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<StorePerformance>>(
        '/reports/store-performance',
        params
    );
    return response.data;
}

// ============================================================
// Cash Integrity
// ============================================================

/**
 * Get cash integrity report for a store
 * Used by /gestao/quebra page
 */
export async function getCashIntegrity(
    storeId: number,
    month?: string
): Promise<CashIntegrityData> {
    const params: Record<string, unknown> = { store_id: storeId };
    if (month) params.month = month;

    const response = await apiGet<ApiResponse<CashIntegrityData>>(
        '/reports/cash-integrity',
        params
    );
    return response.data;
}

// ============================================================
// Birthdays
// ============================================================

/**
 * Get birthdays for current/specified month
 */
export async function getBirthdays(
    month?: number,
    storeId?: number
): Promise<BirthdayEntry[]> {
    const params: Record<string, unknown> = {};
    if (month) params.month = month;
    if (storeId) params.store_id = storeId;

    const response = await apiGet<ApiResponse<BirthdayEntry[]>>('/users/birthdays', params);
    return response.data;
}

// ============================================================
// User KPIs
// ============================================================

/**
 * Get user KPIs with optional filters
 * Used by /gestao/kpis-colaboradores page
 * Note: This endpoint returns JSON directly (no ApiResponse wrapper)
 */
export async function getUserKpis(filters: UserKpisFilters = {}): Promise<UserKpisResponse> {
    const response = await apiGet<UserKpisResponse>('/users/kpis', filters);
    return response;
}

// ============================================================
// Sales History (PDV Reports)
// ============================================================

/**
 * Get paginated sales history with filters
 */
export async function getSalesHistory(filters: SalesFilters = {}): Promise<SalesResponse> {
    // Ensure store_id is not sent if undefined/null (Global View)
    const cleanFilters: Record<string, any> = { ...filters };
    if (!cleanFilters.store_id) {
        delete cleanFilters.store_id;
    }

    const response = await apiGet<SalesResponse>('/pdv/reports/vendas', cleanFilters);
    // The API returns the response object structure directly (data, summary, meta)
    // We do NOT need to unwrap a 'data' property here as apiGet returns the body
    // and the body IS the SalesResponse structure.
    return response;
}

/**
 * Get details for a specific sale
 * @param useStorePdvId - if true, sends store_pdv_id instead of store_id (use when calling from operations listing)
 */
export async function getSaleDetails(
    storeId: number | string,
    idOperacao: number | string,
    canal: string,
    useStorePdvId: boolean = false
): Promise<SaleDetailResponse> {
    const params: Record<string, any> = {
        id_operacao: idOperacao,
        canal
    };
    if (useStorePdvId) {
        params.store_pdv_id = storeId;
    } else {
        params.store_id = storeId;
    }
    const response = await apiGet<SaleDetailResponse>('/pdv/reports/vendas/detalhe', params);
    return response;
}

// ============================================================
// Aux Enpoints for Filters
// ============================================================

import type { SellerAux, ShiftAux, PaymentMethodAux } from '@/types/sales-history.types';

export async function getStoreSellers(storeId?: number | string | null): Promise<SellerAux[]> {
    const params: Record<string, any> = {};
    if (storeId) {
        params.store_id = storeId;
    }
    // If storeId is null/undefined, backend returns all sellers (Global Mode)

    const response = await apiGet<any>('/pdv/reports/aux/vendedores', params);
    // console.log('getStoreSellers response:', response);
    return Array.isArray(response) ? response : (response.data || []);
}

export async function getStoreShifts(storeId: number | string, date: string): Promise<ShiftAux[]> {
    const response = await apiGet<any>('/pdv/reports/turnos', { store_id: storeId, date });

    // Handle specific structure for turnos endpoint which returns { data: { turnos: [...] } }
    if (response?.data?.turnos && Array.isArray(response.data.turnos)) {
        return response.data.turnos;
    }

    return Array.isArray(response) ? response : (response.data || []);
}

export async function getStorePaymentMethods(storeId: number | string): Promise<PaymentMethodAux[]> {
    const response = await apiGet<any>('/pdv/reports/aux/meios-pagamento', { store_id: storeId });
    // console.log('getStorePaymentMethods response:', response);
    return Array.isArray(response) ? response : (response.data || []);
}

// ============================================================
// PDV Operations (Unified: Vendas + Fechamentos)
// ============================================================

import type { OperacoesFilters, OperacoesResponse } from '@/types/pdv-operacoes.types';

/**
 * Get paginated operations history (vendas + fechamentos de caixa)
 */
export async function getOperacoes(filters: OperacoesFilters = {}): Promise<OperacoesResponse> {
    const cleanFilters: Record<string, any> = {};

    // Only include params that have a value
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
            cleanFilters[key] = value;
        }
    }

    const response = await apiGet<OperacoesResponse>('/pdv/reports/operacoes', cleanFilters);
    return response;
}

/**
 * Get unified closure details
 */
export async function getClosureDetails(closureUuid: string): Promise<any> {
    const response = await apiGet<any>(`/cash/closure-diagnose`, { closure_uuid: closureUuid });
    return response.data;
}
