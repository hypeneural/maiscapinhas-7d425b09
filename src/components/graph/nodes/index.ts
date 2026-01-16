/**
 * Graph Nodes Barrel Export
 * 
 * Exports all custom node components for React Flow.
 */

export { RoleNode } from './RoleNode';
export { ModuleNode } from './ModuleNode';
export { PermissionNode } from './PermissionNode';
export { UserNode } from './UserNode';
export { StoreNode } from './StoreNode';

// Node types registry for React Flow
import { RoleNode } from './RoleNode';
import { ModuleNode } from './ModuleNode';
import { PermissionNode } from './PermissionNode';
import { UserNode } from './UserNode';
import { StoreNode } from './StoreNode';

export const nodeTypes = {
    role: RoleNode,
    module: ModuleNode,
    permission: PermissionNode,
    screen: PermissionNode, // Reuse permission node for screens
    user: UserNode,
    store: StoreNode,
};
