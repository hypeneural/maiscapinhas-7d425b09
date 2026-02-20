export interface StoreMapping {
    id: number;
    pdv_store_id: number;
    alias: string | null;
    cnpj: string | null;
    active: boolean;
    store: {
        id: number;
        name: string;
        cnpj: string | null;
    } | null;
}

export interface StoreMappingPayload {
    pdv_store_id: number;
    store_id: number;
    cnpj?: string;
    alias?: string;
}

export interface PdvIdentity {
    store_pdv_id: number;
    user_pdv_id: number;
    original_name: string;
    original_login: string | null;
}

export interface MappedToUser {
    id: number;
    name: string;
    avatar_url: string | null;
}

export interface StoreMappingInfo {
    store_id: number;
    alias: string;
}

export interface UserMapping {
    id: number;
    pdv_identity: PdvIdentity;
    mapped_to: MappedToUser;
    store_mapping: StoreMappingInfo | null;
    active: boolean;
    confidence: number;
    source: string;
}

export interface UserSuggestion {
    identity: PdvIdentity;
    last_seen_at: string;
    sales_count: number;
    suggestion: {
        user_id: number;
        name: string;
        confidence: number;
    } | null;
}

export interface UserMappingPayload {
    store_pdv_id: number;
    pdv_user_id: number;
    user_id: number;
}

export interface BulkUserMappingPayload {
    user_id: number;
    mappings: Array<{
        store_pdv_id: number;
        pdv_user_id: number;
    }>;
}

export interface PdvMappingFilters {
    store_id?: number;
    pdv_store_id?: number;
    page?: number;
    per_page?: number;
    search?: string;
}

export interface PdvMappingResponse<T> {
    data: T[];
    meta: {
        pagination: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
        };
    };
}

export interface StoreMappingResponse {
    data: StoreMapping;
    message: string;
    warning: string | null;
}
