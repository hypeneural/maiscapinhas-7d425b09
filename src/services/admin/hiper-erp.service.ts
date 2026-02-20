/**
 * Hiper ERP Service
 *
 * Complete API service for managing Hiper Gestão Online ERP connections,
 * endpoint catalog, and request execution (playground).
 * Super Admin only — requires is_super_admin = true.
 */

import { apiGet, apiPost, apiDelete } from '@/lib/api';
import type {
    UpsertConnectionRequest,
    ConnectionsListResponse,
    ConnectionShowResponse,
    UpsertConnectionResponse,
    ImportTsvResponse,
    CurlResponse,
    UpsertEndpointRequest,
    ListEndpointsResponse,
    UpsertEndpointResponse,
    DeleteEndpointResponse,
    ExecuteRequest,
    ExecuteResponse,
} from '@/types/hiper-erp.types';

// ============================================================
// Base URL
// ============================================================

const BASE = '/hiper';

// ============================================================
// Connections
// ============================================================

/** List all connections (without cookies). */
export async function listConnections(): Promise<ConnectionsListResponse> {
    return apiGet<ConnectionsListResponse>(`${BASE}/connections`);
}

/** Get a connection with cookie summary. */
export async function showConnection(id: number): Promise<ConnectionShowResponse> {
    return apiGet<ConnectionShowResponse>(`${BASE}/connections/${id}`);
}

/** Create or update a connection. */
export async function upsertConnection(
    data: UpsertConnectionRequest
): Promise<UpsertConnectionResponse> {
    return apiPost<UpsertConnectionResponse>(`${BASE}/connections/upsert`, data);
}

/** Import cookies from TSV (Chrome DevTools). */
export async function importTsv(
    connectionId: number,
    tsv: string
): Promise<ImportTsvResponse> {
    return apiPost<ImportTsvResponse>(
        `${BASE}/connections/${connectionId}/import-tsv`,
        { tsv }
    );
}

/** Generate cookie header + cURL command for a URL. */
export async function getCurl(
    connectionId: number,
    url: string
): Promise<CurlResponse> {
    return apiGet<CurlResponse>(
        `${BASE}/connections/${connectionId}/curl`,
        { url }
    );
}

// ============================================================
// Endpoints (catalog)
// ============================================================

/** List all registered ERP endpoints. */
export async function listEndpoints(): Promise<ListEndpointsResponse> {
    return apiGet<ListEndpointsResponse>(`${BASE}/endpoints`);
}

/** Get endpoint by ID. */
export async function showEndpoint(id: number) {
    return apiGet<{ ok: boolean; endpoint: import('@/types/hiper-erp.types').HiperEndpoint }>(
        `${BASE}/endpoints/${id}`
    );
}

/** Create or update an endpoint. */
export async function upsertEndpoint(
    data: UpsertEndpointRequest
): Promise<UpsertEndpointResponse> {
    return apiPost<UpsertEndpointResponse>(`${BASE}/endpoints/upsert`, data);
}

/** Delete an endpoint by ID. */
export async function deleteEndpoint(id: number): Promise<DeleteEndpointResponse> {
    return apiDelete<DeleteEndpointResponse>(`${BASE}/endpoints/${id}`);
}

// ============================================================
// Execute (Playground)
// ============================================================

/** Execute a catalogued request on the ERP through the backend proxy. */
export async function execute(
    data: ExecuteRequest
): Promise<ExecuteResponse> {
    return apiPost<ExecuteResponse>(`${BASE}/execute`, data);
}

// ============================================================
// Service Object Export
// ============================================================

export const hiperErpService = {
    // Connections
    listConnections,
    showConnection,
    upsertConnection,
    importTsv,
    getCurl,
    // Endpoints
    listEndpoints,
    showEndpoint,
    upsertEndpoint,
    deleteEndpoint,
    // Execute
    execute,
};

export default hiperErpService;
