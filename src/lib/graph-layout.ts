/**
 * Graph Layout Utility
 * 
 * Uses Dagre to calculate positions for graph nodes.
 */

import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { GraphNode, GraphEdge } from '@/types/graph.types';

// ============================================================
// Layout Configuration
// ============================================================

interface LayoutOptions {
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    nodeWidth?: number;
    nodeHeight?: number;
    nodeSep?: number;
    rankSep?: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
    direction: 'TB',
    nodeWidth: 180,
    nodeHeight: 100,
    nodeSep: 80,
    rankSep: 100,
};

// ============================================================
// Calculate Layout
// ============================================================

export function calculateLayout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    options: LayoutOptions = {}
): Node[] {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const g = new dagre.graphlib.Graph();

    g.setGraph({
        rankdir: opts.direction,
        nodesep: opts.nodeSep,
        ranksep: opts.rankSep,
        marginx: 40,
        marginy: 40,
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to graph
    nodes.forEach((node) => {
        g.setNode(node.id, {
            width: opts.nodeWidth,
            height: opts.nodeHeight,
        });
    });

    // Add edges to graph
    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(g);

    // Return nodes with calculated positions
    return nodes.map((node): Node => {
        const nodeWithPosition = g.node(node.id);
        const halfWidth = (opts.nodeWidth ?? 180) / 2;
        const halfHeight = (opts.nodeHeight ?? 100) / 2;

        return {
            id: node.id,
            type: node.type,
            data: node.data,
            position: {
                x: nodeWithPosition.x - halfWidth,
                y: nodeWithPosition.y - halfHeight,
            },
        };
    });
}

// ============================================================
// Convert Graph Edges to React Flow Edges
// ============================================================

export function convertEdges(edges: GraphEdge[]): Edge[] {
    return edges.map((edge): Edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.animated ? 'smoothstep' : 'default',
        animated: edge.animated,
        label: edge.label,
        style: getEdgeStyle(edge.type),
        labelStyle: { fontSize: 11, fontWeight: 500 },
    }));
}

// ============================================================
// Edge Styles by Type
// ============================================================

function getEdgeStyle(type?: string): React.CSSProperties {
    const styles: Record<string, React.CSSProperties> = {
        hierarchy: { stroke: '#94A3B8', strokeWidth: 2 },
        has_access: { stroke: '#22C55E', strokeWidth: 2 },
        contains: { stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '5,5' },
        has_user: { stroke: '#EAB308', strokeWidth: 1 },
        has_role: { stroke: '#3B82F6', strokeWidth: 2 },
        works_at: { stroke: '#22C55E', strokeWidth: 1, strokeDasharray: '3,3' },
        has_module: { stroke: '#F97316', strokeWidth: 1 },
        override_grant: { stroke: '#22C55E', strokeWidth: 2 },
        override_deny: { stroke: '#EF4444', strokeWidth: 2 },
    };

    return styles[type ?? 'hierarchy'] || styles.hierarchy;
}
