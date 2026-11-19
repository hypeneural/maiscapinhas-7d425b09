export interface PdvSync {
    id: number;
    sync_id: string;
    schema_version: string;
    event_type: 'sales' | 'turno_closure' | 'mixed';
    request_id: string;
    store_pdv_id: number;
    store_id: number | null;
    status: 'queued' | 'processing' | 'processed' | 'failed' | 'blocked';
    ops_count: number;
    ops_loja_count: number;
    ops_loja_ids: number[];
    snapshot_turnos_count: number;
    snapshot_vendas_count: number;
    attempts: number;
    timestamp_out_of_window: boolean;
    risk_flags: string[];
    window_from: string | null;
    window_to: string | null;
    received_at: string;
    processing_started_at: string | null;
    processed_at: string | null;
    queue_delay_ms: number | null;
    processing_ms: number | null;
    end_to_end_ms: number | null;
    last_error: string | null;
}

export interface PdvSyncFilters {
    status?: string;
    event_type?: string;
    sync_id?: string;
    schema_version?: string;
    request_id?: string;
    risk_flag?: string;
    store_pdv_id?: number;
    store_id?: number;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
}

export interface PdvSyncResponse {
    data: PdvSync[];
    meta: {
        request_id: string;
        timestamp: string;
        pagination: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
            from: number;
            to: number;
        };
    };
}

export interface PdvMetrics {
    status_breakdown: Record<string, number>;
    risk_flags: Record<string, number>;
    by_event_type: Record<string, number>;
    by_schema_version: Record<string, number>;
    by_canal: {
        source: string;
        totals: Record<string, number>;
    };
    last_24h: {
        total: number;
        failed: number;
        failure_rate_percent: number;
        status_breakdown: Record<string, number>;
    };
    latency: {
        avg_queue_delay_ms: number;
        avg_processing_ms: number;
    };
    stores: {
        threshold_minutes_without_sync: number;
        max_stale_stores: number;
        active_mapped_stores: number;
        stale_count: number;
        stale: Array<{
            store_pdv_id: number;
            store_id: number | null;
            alias: string | null;
            sync_store_alias: string | null;
            store_name: string | null;
            last_received_at: string | null;
            minutes_since_last_sync: number | null;
            stale: boolean;
        }>;
    };
}

export interface PdvMetricsResponse {
    data: PdvMetrics;
    meta: {
        request_id: string;
        timestamp: string;
    };
}

export interface PdvSyncDebugFilterStore {
    store_pdv_id: number;
    store_id: number | null;
    store_id_filial: number | null;
    store_name: string | null;
    store_guid: string | null;
    store_alias: string | null;
    syncs_count: number;
    last_received_at: string | null;
}

export interface PdvSyncDebugFilters {
    status?: string;
    event_type?: string;
    sync_id?: string;
    schema_version?: string;
    request_id?: string;
    risk_flag?: string;
    store_pdv_id?: number;
    store_id?: number;
    store_id_filial?: number;
    from?: string;
    to?: string;
    payload_contains?: string;
    has_error?: boolean;
    sort?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
}

export interface PdvSyncDebugRow {
    id: number;
    sync_id: string;
    request_id: string | null;
    schema_version: string;
    event_type: string;
    status: string;
    store: {
        pdv_id: number;
        id: number | null;
        id_filial: number | null;
        name: string | null;
        guid: string | null;
        alias: string | null;
    };
    ops_count: number;
    ops_loja_count: number;
    snapshot_turnos_count: number;
    snapshot_vendas_count: number;
    attempts: number;
    risk_flags: string[];
    last_error: string | null;
    timeline: {
        received_at: string | null;
        queued_at: string | null;
        processing_started_at: string | null;
        processed_at: string | null;
        queue_delay_ms: number | null;
        processing_ms: number | null;
        end_to_end_ms: number | null;
    };
    payload: {
        available: boolean;
        bytes: number;
        compression: string | null;
        sha256: string | null;
        created_at: string | null;
    };
}

export interface PdvSyncDebugListResponse {
    data: PdvSyncDebugRow[];
    meta: {
        request_id: string;
        timestamp: string;
        pagination: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
            from: number | null;
            to: number | null;
        };
    };
}

export interface PdvSyncDebugFilterOptionsResponse {
    data: {
        statuses: string[];
        event_types: string[];
        schema_versions: string[];
        stores: PdvSyncDebugFilterStore[];
        range: {
            min_received_at: string | null;
            max_received_at: string | null;
        };
    };
    meta?: {
        request_id?: string;
        timestamp?: string;
    };
}

export interface PdvSyncDebugDetailResponse {
    data: {
        sync: PdvSyncDebugRow;
        payload: {
            available: boolean;
            compression: string | null;
            bytes: number;
            sha256: string | null;
            created_at: string | null;
            updated_at: string | null;
            raw: string | null;
            decoded: unknown;
            parse_error: string | null;
        };
    };
    meta?: {
        request_id?: string;
        timestamp?: string;
    };
}
