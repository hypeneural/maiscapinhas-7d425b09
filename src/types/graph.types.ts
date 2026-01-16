/**
 * Graph Types
 * 
 * TypeScript interfaces for the Permission Graph visualization.
 */

// ============================================================
// Node Types
// ============================================================

export type NodeType = 'role' | 'module' | 'permission' | 'screen' | 'user' | 'store';

export type EdgeType =
    | 'hierarchy'       // Role → Role (parent → child)
    | 'has_access'      // Role → Module
    | 'contains'        // Module → Permission/Screen
    | 'has_user'        // Role/Store → User
    | 'has_role'        // User → Role
    | 'works_at'        // User → Store
    | 'has_module'      // Store → Module
    | 'override_grant'  // User → Permission (positive override)
    | 'override_deny';  // User → Permission (negative override)

// ============================================================
// Graph Node
// ============================================================

export interface GraphNodeData {
    label: string;
    icon?: string;
    // Role-specific
    level?: number;
    is_system?: boolean;
    permissions_count?: number;
    users_count?: number;
    description?: string;
    // Module-specific
    is_active?: boolean;
    status_count?: number;
    permission_count?: number;
    version?: string;
    // Permission-specific
    type?: 'ability' | 'screen' | 'feature';
    granted?: boolean;
    is_override?: boolean;
    is_temporary?: boolean;
    expires_at?: string;
    reason?: string;
    granted_by?: string;
    // User-specific
    email?: string;
    is_super_admin?: boolean;
    roles?: string[];
    stores_count?: number;
    role_in_store?: string;
    // Store-specific
    city?: string;
    modules_count?: number;
    // Generic
    permissions_in_module?: number;
    total_permissions?: number;
}

export interface GraphNode {
    id: string;
    type: NodeType;
    data: GraphNodeData;
    position: { x: number; y: number };
}

// ============================================================
// Graph Edge
// ============================================================

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    type?: EdgeType;
    label?: string;
    animated?: boolean;
}

// ============================================================
// Effective Permission (for user graph)
// ============================================================

export interface EffectivePermission {
    name: string;
    source: 'role' | 'override';
    source_name?: string;
    expires_at?: string;
}

// ============================================================
// Graph Response
// ============================================================

export interface GraphSummary {
    total_nodes: number;
    total_edges: number;
    by_type: Partial<Record<NodeType, number>>;
    depth?: number;
    modules?: number;
    permissions?: number;
    users?: number;
    roles?: number;
    stores?: number;
    overrides?: number;
    effective_permissions?: number;
}

export interface GraphMetadata {
    generated_at: string;
    filters: Record<string, unknown>;
}

export interface GraphResponse {
    nodes: GraphNode[];
    edges: GraphEdge[];
    root?: string;
    summary: GraphSummary;
    metadata?: GraphMetadata;
    effective_permissions?: EffectivePermission[];
}

// ============================================================
// Graph Query Params
// ============================================================

export interface OverviewParams {
    depth?: number;
    include_users?: boolean;
}

export interface RoleGraphParams {
    include_users?: boolean;
    include_permissions?: boolean;
}

export interface UserGraphParams {
    include_inherited?: boolean;
}

export interface StoreGraphParams {
    include_users?: boolean;
}

// ============================================================
// View Types
// ============================================================

export type GraphViewType = 'overview' | 'role' | 'user' | 'store' | 'module';

export interface GraphView {
    type: GraphViewType;
    id?: string | number;
    label: string;
}

// ============================================================
// Node Styling
// ============================================================

export const NODE_COLORS: Record<NodeType, string> = {
    role: '#3B82F6',       // Blue
    module: '#F97316',     // Orange
    permission: '#6B7280', // Gray
    screen: '#8B5CF6',     // Purple
    user: '#EAB308',       // Yellow
    store: '#22C55E',      // Green
};

export const NODE_ICONS: Record<NodeType, string> = {
    role: 'Shield',
    module: 'Package',
    permission: 'Key',
    screen: 'Monitor',
    user: 'User',
    store: 'Store',
};
