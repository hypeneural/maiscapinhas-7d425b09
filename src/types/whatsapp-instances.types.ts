/**
 * WhatsApp Instances Types
 * 
 * TypeScript interfaces for WhatsApp instance management via Evolution API.
 * Used by Super Admin panel for managing WhatsApp integrations.
 */

// ============================================================
// Enums / Union Types
// ============================================================

/**
 * Instance scope - determines visibility and usage
 */
export type InstanceScope = 'global' | 'store' | 'user';

/**
 * Connection status from Evolution API
 */
export type InstanceStatus = 'connected' | 'disconnected' | 'connecting' | 'unknown';

/**
 * WhatsApp provider (currently only Evolution supported)
 */
export type InstanceProvider = 'evolution';

// ============================================================
// Response Types
// ============================================================

/**
 * Minimal store reference in instance response
 */
export interface InstanceStoreRef {
    id: number;
    name: string;
}

/**
 * Minimal user reference in instance response
 */
export interface InstanceUserRef {
    id: number;
    name: string;
}

/**
 * WhatsApp instance response from API
 */
export interface WhatsAppInstanceResponse {
    id: number;
    name: string;
    scope: InstanceScope;
    provider: InstanceProvider;
    base_url: string;
    phone_e164: string | null;
    status: InstanceStatus;
    is_default: boolean;
    is_active: boolean;
    has_api_key: boolean;
    has_token: boolean;
    api_key_masked: string | null;
    token_masked: string | null;
    last_state_checked_at: string | null;
    notes: string | null;
    store: InstanceStoreRef | null;
    user: InstanceUserRef | null;
    created_at: string;
    updated_at: string;
}

/**
 * Instance state check response
 */
export interface InstanceStateResponse {
    status: InstanceStatus;
    evolution_state: string;
    last_state: Record<string, unknown> | null;
    last_state_checked_at: string | null;
}

/**
 * Instance connection response (QR code)
 */
export interface InstanceConnectResponse {
    type: 'qr_text';
    code: string;
    pairingCode: string;
    expires_in: number;
}

/**
 * Instance test connection response
 */
export interface InstanceTestResponse {
    ok: boolean;
    status: InstanceStatus;
    evolution_state: string;
}

/**
 * Secret deletion response
 */
export interface InstanceSecretResponse {
    message: string;
    has_api_key?: boolean;
    has_token?: boolean;
}

// ============================================================
// Request Types
// ============================================================

/**
 * Create WhatsApp instance request
 */
export interface CreateWhatsAppInstanceRequest {
    name: string;
    base_url: string;
    api_key?: string;
    provider?: InstanceProvider;
    store_id?: number | null;
    user_id?: number | null;
    is_default?: boolean;
    is_active?: boolean;
    notes?: string;
}

/**
 * Update WhatsApp instance request
 * All fields optional - only provided fields are updated
 */
export interface UpdateWhatsAppInstanceRequest {
    name?: string;
    base_url?: string;
    api_key?: string;
    provider?: InstanceProvider;
    store_id?: number | null;
    user_id?: number | null;
    is_default?: boolean;
    is_active?: boolean;
    notes?: string;
}

// ============================================================
// Filter Types
// ============================================================

/**
 * Filters for listing WhatsApp instances
 */
export interface WhatsAppInstanceFilters {
    search?: string;
    scope?: InstanceScope;
    store_id?: number;
    user_id?: number;
    status?: InstanceStatus;
    is_active?: boolean;
    per_page?: number;
    page?: number;
}

// ============================================================
// UI Helper Types
// ============================================================

/**
 * Status badge configuration
 */
export interface StatusBadgeConfig {
    label: string;
    color: string;
    icon: string;
}

/**
 * Scope badge configuration
 */
export interface ScopeBadgeConfig {
    label: string;
    className: string;
}

/**
 * Status to badge mapping
 */
export const STATUS_BADGE_MAP: Record<InstanceStatus, StatusBadgeConfig> = {
    connected: { label: 'Conectado', color: 'green', icon: '🟢' },
    disconnected: { label: 'Desconectado', color: 'red', icon: '🔴' },
    connecting: { label: 'Conectando', color: 'yellow', icon: '🟡' },
    unknown: { label: 'Desconhecido', color: 'gray', icon: '⚪' },
};

/**
 * Scope to badge mapping
 */
export const SCOPE_BADGE_MAP: Record<InstanceScope, ScopeBadgeConfig> = {
    global: { label: 'Global', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    store: { label: 'Loja', className: 'bg-green-100 text-green-700 border-green-200' },
    user: { label: 'Usuário', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};
