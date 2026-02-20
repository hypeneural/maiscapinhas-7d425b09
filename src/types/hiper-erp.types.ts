/**
 * Hiper ERP Types
 *
 * TypeScript interfaces for the Hiper ERP integration module.
 * Super Admin only — all endpoints require `super-admin` middleware.
 */

// ============================================================
// Connection
// ============================================================

export interface HiperConnection {
    id: number;
    name: string;
    base_url: string;
    default_referer: string | null;
    default_headers?: Record<string, string>;
    is_active: boolean;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CookieSummary {
    domains: string[];
    total_cookies: number;
    last_imported_at: string | null;
}

// ============================================================
// Endpoint (catalog)
// ============================================================

export interface HiperEndpoint {
    id: number;
    key: string;
    method: 'GET' | 'POST';
    path: string;
    headers: Record<string, string> | null;
    query_template: Record<string, any> | null;
    body_template: Record<string, any> | null;
    created_at?: string;
    updated_at?: string;
}

// ============================================================
// Requests
// ============================================================

export interface UpsertConnectionRequest {
    id?: number | null;
    name: string;
    base_url: string;
    default_referer?: string;
    default_headers?: Record<string, string>;
}

export interface ImportTsvRequest {
    tsv: string;
}

export interface UpsertEndpointRequest {
    id?: number | null;
    key: string;
    method: 'GET' | 'POST';
    path: string;
    headers?: Record<string, string> | null;
    query_template?: Record<string, any> | null;
    body_template?: Record<string, any> | null;
}

export interface ExecuteRequest {
    connection_id: number;
    endpoint_key: string;
    params?: Record<string, string>;
    query?: Record<string, any>;
    body?: Record<string, any>;
}

// ============================================================
// Responses
// ============================================================

export interface ConnectionsListResponse {
    ok: boolean;
    connections: HiperConnection[];
}

export interface ConnectionShowResponse {
    ok: boolean;
    connection: HiperConnection;
    cookie_summary: CookieSummary | null;
}

export interface UpsertConnectionResponse {
    ok: boolean;
    connection: HiperConnection;
}

export interface ImportTsvResponse {
    ok: boolean;
    imported: number;
    total_cookies: number;
    domains: string[];
    last_imported_at: string;
}

export interface ListEndpointsResponse {
    ok: boolean;
    endpoints: HiperEndpoint[];
}

export interface UpsertEndpointResponse {
    ok: boolean;
    endpoint: HiperEndpoint;
}

export interface DeleteEndpointResponse {
    ok: boolean;
    deleted: string;
}

export interface CurlResponse {
    ok: boolean;
    cookie: string;
    missing: string[];
    curl: string;
}

export interface ExecuteResponse {
    ok: boolean;
    status: number;
    url: string;
    missing_cookies: string[];
    response: any;
}

export interface ExecuteErrorResponse {
    ok: false;
    error: string;
    url: string;
    missing_cookies: string[];
}
