/**
 * Production System Types
 * 
 * TypeScript types for production orders and factory portal.
 */

// ============================================================
// Status Types
// ============================================================

/**
 * Production order status values
 */
export type ProducaoPedidoStatus = 1 | 2 | 3 | 4 | 5 | 6;

export const PRODUCAO_STATUS = {
    CARRINHO_ABERTO: 1,
    ENCOMENDA_REALIZADA: 2,
    PEDIDO_ACEITO: 3,
    PEDIDO_DESPACHADO: 4,
    RECEBIDO: 5,
    CANCELADO: 6,
} as const;

export const PRODUCAO_STATUS_LABELS: Record<number, string> = {
    1: 'Carrinho Aberto',
    2: 'Encomenda Realizada',
    3: 'Pedido Aceito',
    4: 'Pedido Despachado',
    5: 'Recebido',
    6: 'Cancelado',
};

export const PRODUCAO_STATUS_COLORS: Record<number, string> = {
    1: 'slate',
    2: 'orange',
    3: 'teal',
    4: 'indigo',
    5: 'green',
    6: 'red',
};

export const PRODUCAO_STATUS_ICONS: Record<number, string> = {
    1: 'shopping-cart',
    2: 'send',
    3: 'check-circle',
    4: 'truck',
    5: 'package-check',
    6: 'x-circle',
};

// ============================================================
// Production Order Types
// ============================================================

/**
 * User reference in production context
 */
export interface ProducaoUser {
    id: number;
    name: string;
}

/**
 * Customer reference in production context
 */
export interface ProducaoCustomer {
    id: number;
    name: string;
}

/**
 * Production order item
 */
export interface ProducaoPedidoItem {
    id: number;
    capa_id: number;
    phone_brand: string | null;
    phone_model: string | null;
    qty: number;
    observation: string | null;
    photo_url: string | null;
    photo_download_url?: string;
    customer?: ProducaoCustomer;
    selected_product?: string;
    added_at: string;
}

/**
 * Production timeline event
 */
export interface ProducaoEvento {
    id: number;
    action: string;
    action_label: string;
    action_icon: string;
    from_status: number | null;
    from_status_label: string | null;
    to_status: number | null;
    to_status_label: string | null;
    metadata: Record<string, unknown> | null;
    actor_type: 'admin' | 'vendedor' | 'fabrica';
    actor_name: string;
    created_at: string;
    created_at_human: string;
}

/**
 * Production order
 */
export interface ProducaoPedido {
    id: number;
    status: ProducaoPedidoStatus;
    status_label: string;
    status_color: string;
    status_icon: string;
    total_itens: number;
    total_qtd: number;
    factory_total: number | null;
    factory_notes: string | null;
    observation: string | null;
    tracking_code?: string | null;
    created_at: string;
    closed_at: string | null;
    accepted_at: string | null;
    dispatched_at: string | null;
    received_at: string | null;
    created_by?: ProducaoUser;
    items?: ProducaoPedidoItem[];
    timeline?: ProducaoEvento[];
    can_accept: boolean;
    can_dispatch: boolean;
    can_receive: boolean;
    can_cancel: boolean;
    is_carrinho_aberto: boolean;
    // New fields from backend
    can_add_more?: boolean;
    blockers?: string[];
}

/**
 * Clean orphan items response
 */
export interface CleanOrphanResponse {
    message: string;
    data: {
        released_count: number;
    };
}

// ============================================================
// Request/Response Types
// ============================================================

/**
 * Blocked item when adding to cart
 */
export interface BlockedCartItem {
    id: number;
    reason: 'NOT_FOUND' | 'CANCELLED' | 'NO_PHOTO' | 'ALREADY_IN_CART' | 'ALREADY_SENT' | 'INVALID_STATUS';
    message: string;
}

/**
 * Add to cart response
 */
export interface AddToCartResponse {
    message: string;
    data: {
        added: number[];
        blocked: BlockedCartItem[];
        added_count: number;
        blocked_count: number;
    };
}

/**
 * Validate cart response
 */
export interface ValidateCartResponse {
    data: {
        eligible: number[];
        blocked: BlockedCartItem[];
        eligible_count: number;
        blocked_count: number;
    };
}

/**
 * Bulk remove from cart response
 */
export interface BulkRemoveResponse {
    message: string;
    data: {
        removed: number[];
        errors: { id: number; message: string }[];
        removed_count: number;
        error_count: number;
    };
}

/**
 * Close cart request
 */
export interface CloseCartRequest {
    observation?: string;
}

/**
 * Accept order request (factory)
 */
export interface AcceptOrderRequest {
    factory_total: number;
    factory_notes?: string;
}

/**
 * Dispatch order request (factory)
 */
export interface DispatchOrderRequest {
    tracking_code?: string;
    factory_notes?: string;
}

/**
 * Receive order request (admin)
 */
export interface ReceiveOrderRequest {
    observation?: string;
}

/**
 * Cancel order request
 */
export interface CancelOrderRequest {
    reason?: string;
}

// ============================================================
// Filter Types
// ============================================================

/**
 * Production orders list filters
 */
export interface ProducaoPedidoFilters {
    status?: ProducaoPedidoStatus;
    initial_date?: string;
    final_date?: string;
    page?: number;
    per_page?: number;
}

/**
 * Factory orders list filters
 */
export interface FabricaPedidoFilters {
    status?: ProducaoPedidoStatus;
    initial_date?: string;
    final_date?: string;
    page?: number;
    per_page?: number;
}
