/**
 * Module System Types
 * 
 * TypeScript interfaces for the modular system.
 */

import type { LucideIcon } from 'lucide-react';

// ============================================================
// Module Base Types
// ============================================================

/**
 * Badge variant for status
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' |
    'success' | 'warning' | 'info';

/**
 * Module entity (list view)
 */
export interface Module {
    id: string;
    slug: string;
    name: string;
    description: string;
    version: string;
    icon: string;
    dependencies: string[];
    is_installed: boolean;
    is_active: boolean;
    is_core: boolean;
    status: 'active' | 'inactive' | 'not_installed';
    stores_count: number;
    status_count: number;
    permission_count: number;
    automation_count: number;
}

// ============================================================
// Module Status
// ============================================================

/**
 * Module status configuration
 */
export interface ModuleStatus {
    name: string;
    label: string;
    description: string;
    color: string;
    text_color?: string;
    icon: string;
    badge_variant: BadgeVariant;
    can_edit: boolean;
    final: boolean;
}

// ============================================================
// Module Actions
// ============================================================

/**
 * Confirm dialog variant
 */
export type ConfirmVariant = 'default' | 'destructive' | 'warning';

/**
 * Module action configuration
 */
export interface ModuleAction {
    label: string;
    icon: string;
    tooltip?: string;
    shortcut?: string;
    shortcut_modifier?: 'ctrl' | 'alt' | 'shift' | null;
    permission?: string;
    available_in_status?: number[];
    confirm?: boolean;
    confirm_title?: string;
    confirm_message?: string;
    confirm_button?: string;
    cancel_button?: string;
    confirm_variant?: ConfirmVariant;
    requires_fields?: string[];
}

// ============================================================
// Module Filters
// ============================================================

/**
 * Filter type
 */
export type FilterType = 'select' | 'multi-select' | 'date-range' | 'text' | 'number';

/**
 * Filter option
 */
export interface FilterOption {
    value: string;
    label: string;
}

/**
 * Module filter configuration
 */
export interface ModuleFilter {
    type: FilterType;
    label: string;
    placeholder?: string;
    options?: FilterOption[] | 'from_statuses' | 'from_users' | 'from_stores';
    presets?: string[];
}

// ============================================================
// Module Table
// ============================================================

/**
 * Column type
 */
export type ColumnType = 'text' | 'number' | 'date' | 'datetime' | 'badge' | 'currency' | 'boolean';

/**
 * Table column configuration
 */
export interface ModuleTableColumn {
    key: string;
    label: string;
    type?: ColumnType;
    sortable?: boolean;
    width?: number;
    align?: 'left' | 'center' | 'right';
    format?: string;
}

// ============================================================
// Module Bulk Actions
// ============================================================

/**
 * Bulk action configuration
 */
export interface ModuleBulkAction {
    label: string;
    icon: string;
    permission?: string;
    requires_selection?: boolean;
    min_selection?: number;
    max_selection?: number;
    confirm?: boolean;
    confirm_message?: string;
    formats?: string[];
}

// ============================================================
// Module Row Actions
// ============================================================

/**
 * Row action configuration
 */
export interface ModuleRowAction {
    action: string;
    label: string;
    icon: string;
    permission?: string;
    variant?: 'default' | 'destructive';
}

/**
 * Row actions configuration
 */
export interface ModuleRowActions {
    primary: ModuleRowAction;
    secondary: ModuleRowAction[];
}

// ============================================================
// Module Notifications
// ============================================================

/**
 * Notification variant
 */
export type NotificationVariant = 'success' | 'info' | 'warning' | 'destructive';

/**
 * Notification template
 */
export interface ModuleNotification {
    title: string;
    description: string;
    variant: NotificationVariant;
}

// ============================================================
// Module Stats Cards
// ============================================================

/**
 * Stats card configuration
 */
export interface ModuleStatsCard {
    id: string;
    label: string;
    icon: string;
    color: string;
    type?: 'number' | 'currency' | 'percentage';
}

/**
 * Stats cards configuration
 */
export interface ModuleStatsCards {
    enabled: boolean;
    permission?: string;
    cards: ModuleStatsCard[];
}

// ============================================================
// Module Transitions
// ============================================================

/**
 * Transition matrix: status_id -> allowed_next_status_ids
 */
export type TransitionMatrix = Record<string, number[]>;

/**
 * Role matrix: from_status -> to_status -> roles[]
 */
export type TransitionRoleMatrix = Record<string, Record<string, string[]>>;

// ============================================================
// Module Conditional Fields
// ============================================================

/**
 * Field type
 */
export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox' | 'phone';

/**
 * Conditional field configuration
 */
export interface ModuleConditionalField {
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: FilterOption[];
    min_length?: number;
    max_length?: number;
    min?: number;
    max?: number;
    pattern?: string;
    pattern_message?: string;
    visible_when?: Record<string, unknown>;
}

// ============================================================
// Module Documentation
// ============================================================

/**
 * Workflow step
 */
export interface WorkflowStep {
    title: string;
    steps: string[];
}

/**
 * Module documentation
 */
export interface ModuleDocumentation {
    overview: string;
    workflow?: WorkflowStep;
    faq?: Record<string, string>;
}

// ============================================================
// Module Texts
// ============================================================

/**
 * Module texts for UI
 */
export interface ModuleTexts {
    menu_label: string;
    menu_tooltip?: string;
    page_title: string;
    page_description?: string;
    create_button: string;
    empty_state: string;
    loading_title?: string;
    loading_description?: string;
    error_title?: string;
    error_description?: string;
    retry_button?: string;
}

// ============================================================
// Module Permission Groups
// ============================================================

/**
 * Permission group in module context
 */
export interface ModulePermissionGroup {
    label: string;
    icon: string;
    description?: string;
    permissions: string[];
}

// ============================================================
// Full Module Configuration
// ============================================================

/**
 * Complete module configuration (from /modules/{id}/full)
 */
export interface ModuleFull {
    id: string;
    name: string;
    icon?: string;
    version?: string;
    is_installed: boolean;
    is_active: boolean;

    // Permissions list - can be strings or objects depending on backend version
    permissions: (string | { name: string; display_name?: string; type?: string })[];
    screens?: string[];

    // UI Texts
    texts: ModuleTexts;

    // Status configuration
    statuses: Record<string, ModuleStatus>;

    // Actions configuration
    actions: Record<string, ModuleAction>;

    // Filters configuration
    filters?: Record<string, ModuleFilter>;

    // Table configuration
    table_columns?: {
        default: ModuleTableColumn[];
        compact?: ModuleTableColumn[];
    };

    // Bulk actions
    bulk_actions?: Record<string, ModuleBulkAction>;

    // Row actions
    row_actions?: ModuleRowActions;

    // Notifications templates
    notifications?: Record<string, ModuleNotification>;

    // Stats cards
    stats_cards?: ModuleStatsCards;

    // Transitions
    transitions: TransitionMatrix;
    transition_role_matrix: TransitionRoleMatrix;

    // Permission groups
    permission_groups?: Record<string, ModulePermissionGroup>;

    // Conditional fields by status
    conditional_fields?: Record<string, Record<string, ModuleConditionalField>>;

    // Documentation
    documentation?: ModuleDocumentation;
}

// ============================================================
// Module Transitions Response
// ============================================================

/**
 * Transitions endpoint response
 */
export interface ModuleTransitionsResponse {
    module_id: string;
    statuses: Record<string, {
        name: string;
        label: string;
    }>;
    transitions: TransitionMatrix;
    role_matrix: TransitionRoleMatrix;
}

/**
 * Update transitions request
 */
export interface UpdateTransitionsRequest {
    transitions: TransitionRoleMatrix;
}

// ============================================================
// Module Activation
// ============================================================

/**
 * Module activation response
 */
export interface ModuleActivationResponse {
    message: string;
    data: {
        id: string;
        installed_at?: string;
        activated_at?: string;
    };
}

// ============================================================
// Module Stores
// ============================================================

/**
 * Store status for a module
 */
export interface ModuleStoreStatus {
    store_id: number;
    store_name: string;
    city: string;
    is_active: boolean;
    activated_at: string | null;
    config: Record<string, unknown>;
}

/**
 * Response from /modules/{id}/stores endpoint
 */
export interface ModuleStoresResponse {
    module_id: string;
    module_name: string;
    stores: ModuleStoreStatus[];
    total: number;
    active_count: number;
}

// ============================================================
// Module Schema (Validation Rules)
// ============================================================

/**
 * Field schema for validation
 */
export interface FieldSchema {
    type: 'string' | 'boolean' | 'enum' | 'array' | 'integer';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    allowed?: string[];
    items?: string;
    default?: unknown;
    hint?: string;
}

/**
 * Module schema response from /modules/{id}/schema
 */
export interface ModuleSchema {
    module_id: string;
    schema: {
        texts: Record<string, FieldSchema>;
        status: Record<string, FieldSchema>;
        action: Record<string, FieldSchema>;
    };
    allowed_values: {
        icons: string[];
        colors: string[];
        badge_variants: string[];
    };
}

// ============================================================
// Status CRUD
// ============================================================

/**
 * Request to update a status
 */
export interface UpdateStatusRequest {
    label?: string;
    description?: string;
    color?: string;
    icon?: string;
    badge_variant?: string;
    can_edit?: boolean;
    final?: boolean;
    tooltip?: string;
    help_text?: string;
}

/**
 * Request to create a new status
 */
export interface CreateStatusRequest {
    key: string;
    status: {
        name: string;
        label: string;
        description?: string;
        color: string;
        icon: string;
        badge_variant: string;
        can_edit?: boolean;
        final?: boolean;
        tooltip?: string;
        help_text?: string;
    };
    transitions_to?: string[];
    transitions_from?: string[];
}

/**
 * Extended status with metadata
 */
export interface ModuleStatusExtended extends ModuleStatus {
    tooltip?: string;
    help_text?: string;
    _custom?: boolean;
    _created_at?: string;
}

// ============================================================
// Preview Impact
// ============================================================

/**
 * Request to preview impact of an action
 */
export interface PreviewImpactRequest {
    action: 'delete_status' | 'update_status' | 'update_transition' | 'delete_action';
    status_key?: string;
    changes?: Record<string, unknown>;
}

/**
 * Response from preview impact endpoint
 */
export interface PreviewImpactResponse {
    action: string;
    status_key?: string;
    can_proceed: boolean;
    affected_records: number;
    warnings: string[];
    suggestions: string[];
}

// ============================================================
// Audit Log
// ============================================================

/**
 * Audit log entry
 */
export interface AuditEntry {
    action: string;
    data: Record<string, unknown>;
    user_id: number;
    user_name: string;
    timestamp: string;
    ip_address: string;
}

/**
 * Audit log response
 */
export interface AuditLogResponse {
    module_id: string;
    entries: AuditEntry[];
    total: number;
}

// ============================================================
// Module Configuration
// ============================================================

/**
 * Config field definition in schema
 */
export interface ConfigField {
    type: 'switch' | 'number' | 'select' | 'text' | 'textarea';
    label: string;
    hint?: string;
    required?: boolean;
    default?: unknown;
    min?: number;
    max?: number;
    options?: Record<string, string>;
    depends_on?: string;
}

/**
 * Config section in schema
 */
export interface ConfigSection {
    label: string;
    icon: string;
    description?: string;
    fields: Record<string, ConfigField>;
}

/**
 * Config schema defining available settings
 */
export interface ConfigSchema {
    sections: Record<string, ConfigSection>;
    defaults: Record<string, unknown>;
}

/**
 * Response from GET /modules/{id}/config
 */
export interface ModuleConfigResponse {
    module_id: string;
    module_name: string;
    config: Record<string, unknown>;
    schema: ConfigSchema;
    has_custom_config: boolean;
}

/**
 * Response from PATCH /modules/{id}/config
 */
export interface UpdateConfigResponse {
    message: string;
    config: Record<string, unknown>;
}

/**
 * Response from POST /modules/{id}/config/reset
 */
export interface ResetConfigResponse {
    message: string;
    config: Record<string, unknown>;
}

/**
 * Response from GET /modules/{id}/stores/{storeId}/config
 */
export interface StoreConfigResponse {
    module_id: string;
    store_id: number;
    global_config: Record<string, unknown>;
    store_config: Record<string, unknown>;
    effective_config: Record<string, unknown>;
    schema: ConfigSchema;
}

// ============================================================
// Module Texts
// ============================================================

/**
 * Schema for text field
 */
export interface TextFieldSchema {
    type: 'string';
    max: number;
    description: string;
}

/**
 * Response from GET /modules/{id}/texts
 */
export interface ModuleTextsResponse {
    module_id: string;
    module_name: string;
    texts: Record<string, string>;
    defaults: Record<string, string>;
    schema: Record<string, TextFieldSchema>;
    has_custom_texts: boolean;
}

/**
 * Request for PUT /modules/{id}/texts
 */
export interface UpdateTextsRequest {
    texts: Record<string, string>;
}

/**
 * Response from PUT /modules/{id}/texts
 */
export interface UpdateTextsResponse {
    message: string;
    data: Record<string, string>;
}

