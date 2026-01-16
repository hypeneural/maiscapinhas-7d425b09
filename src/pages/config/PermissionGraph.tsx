/**
 * Permission Graph Page
 * 
 * Interactive visualization of permission hierarchy using React Flow.
 */

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Panel,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
    Network,
    Shield,
    User,
    Store,
    Package,
    Loader2,
    AlertCircle,
    RefreshCw,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';

import { nodeTypes } from '@/components/graph/nodes';
import { calculateLayout, convertEdges } from '@/lib/graph-layout';
import {
    useGraphOverview,
    useRoleGraph,
    useUserGraph,
    useStoreGraph,
    useModuleGraph
} from '@/hooks/api/use-graph';
import { useRoles } from '@/hooks/api/use-roles';
import { useModules } from '@/hooks/api/use-modules';
import { useAdminUsers } from '@/hooks/api/use-admin-users';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import type { GraphViewType, NODE_COLORS, NodeType } from '@/types/graph.types';

// ============================================================
// Types
// ============================================================

interface ViewOption {
    type: GraphViewType;
    id?: string | number;
    label: string;
    icon: React.ReactNode;
}

// ============================================================
// Component
// ============================================================

const PermissionGraph: React.FC = () => {
    // State
    const [currentView, setCurrentView] = useState<ViewOption>({
        type: 'overview',
        label: 'Visão Geral',
        icon: <Network className="h-4 w-4" />,
    });
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Data hooks based on view type
    const overviewQuery = useGraphOverview({ depth: 3 });
    const roleQuery = useRoleGraph(
        currentView.type === 'role' ? String(currentView.id) : '',
        { include_permissions: true }
    );
    const userQuery = useUserGraph(
        currentView.type === 'user' ? Number(currentView.id) : 0,
        { include_inherited: true }
    );
    const storeQuery = useStoreGraph(
        currentView.type === 'store' ? Number(currentView.id) : 0,
        { include_users: true }
    );
    const moduleQuery = useModuleGraph(
        currentView.type === 'module' ? String(currentView.id) : ''
    );

    // Options data
    const { data: roles } = useRoles();
    const { data: modules } = useModules();
    const { data: usersData } = useAdminUsers({ per_page: 50 });
    const { data: storesData } = useAdminStores({ per_page: 50 });

    // Get active query based on view
    const getActiveQuery = () => {
        switch (currentView.type) {
            case 'overview': return overviewQuery;
            case 'role': return roleQuery;
            case 'user': return userQuery;
            case 'store': return storeQuery;
            case 'module': return moduleQuery;
            default: return overviewQuery;
        }
    };

    const activeQuery = getActiveQuery();
    const { data: graphData, isLoading, error, refetch } = activeQuery;

    // Update graph when data changes
    useEffect(() => {
        if (graphData?.nodes && graphData?.edges) {
            const layoutedNodes = calculateLayout(graphData.nodes, graphData.edges);
            setNodes(layoutedNodes);
            setEdges(convertEdges(graphData.edges));
        }
    }, [graphData, setNodes, setEdges]);

    // Handle node click - navigate to detail view
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        const nodeType = node.type as NodeType;
        const nodeId = node.id;

        // Extract actual ID from node ID format "type-id"
        const actualId = nodeId.replace(`${nodeType}-`, '');

        switch (nodeType) {
            case 'role':
                setCurrentView({
                    type: 'role',
                    id: actualId,
                    label: node.data.label,
                    icon: <Shield className="h-4 w-4" />,
                });
                break;
            case 'user':
                setCurrentView({
                    type: 'user',
                    id: parseInt(actualId),
                    label: node.data.label,
                    icon: <User className="h-4 w-4" />,
                });
                break;
            case 'store':
                setCurrentView({
                    type: 'store',
                    id: parseInt(actualId),
                    label: node.data.label,
                    icon: <Store className="h-4 w-4" />,
                });
                break;
            case 'module':
                setCurrentView({
                    type: 'module',
                    id: actualId,
                    label: node.data.label,
                    icon: <Package className="h-4 w-4" />,
                });
                break;
        }
    }, []);

    // Change view
    const changeView = (view: ViewOption) => {
        setCurrentView(view);
    };

    // MiniMap node color
    const getMinimapNodeColor = (node: Node) => {
        const colors: Record<string, string> = {
            role: '#3B82F6',
            module: '#F97316',
            permission: '#6B7280',
            screen: '#8B5CF6',
            user: '#EAB308',
            store: '#22C55E',
        };
        return colors[node.type ?? 'role'] || '#888';
    };

    // Filter nodes by search
    const filteredNodes = searchQuery
        ? nodes.filter(n =>
            n.data.label?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : nodes;

    return (
        <div className="space-y-4 animate-fade-in">
            <PageHeader
                title="Grafo de Permissões"
                description="Visualização interativa da hierarquia de permissões"
                icon={Network}
            />

            {/* Controls Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* View Selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    {currentView.icon}
                                    {currentView.label}
                                    <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuLabel>Tipo de Visualização</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => changeView({
                                    type: 'overview',
                                    label: 'Visão Geral',
                                    icon: <Network className="h-4 w-4" />,
                                })}>
                                    <Network className="h-4 w-4 mr-2" />
                                    Visão Geral
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Por Cargo</DropdownMenuLabel>
                                {roles?.map(role => (
                                    <DropdownMenuItem
                                        key={role.id}
                                        onClick={() => changeView({
                                            type: 'role',
                                            id: role.name,
                                            label: role.display_name || role.name,
                                            icon: <Shield className="h-4 w-4" />,
                                        })}
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        {role.display_name || role.name}
                                    </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Por Módulo</DropdownMenuLabel>
                                {modules?.slice(0, 5).map(mod => (
                                    <DropdownMenuItem
                                        key={mod.id}
                                        onClick={() => changeView({
                                            type: 'module',
                                            id: mod.id,
                                            label: mod.name,
                                            icon: <Package className="h-4 w-4" />,
                                        })}
                                    >
                                        <Package className="h-4 w-4 mr-2" />
                                        {mod.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Search */}
                        <div className="flex-1 max-w-xs">
                            <Input
                                placeholder="Buscar no grafo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Stats */}
                        {graphData?.summary && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary">{graphData.summary.total_nodes} nós</Badge>
                                <Badge variant="secondary">{graphData.summary.total_edges} conexões</Badge>
                            </div>
                        )}

                        {/* Refresh */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Graph Container */}
            <Card className="overflow-hidden">
                <div className="h-[600px] w-full">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">Carregando grafo...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                                <p className="text-destructive mb-2">Erro ao carregar grafo</p>
                                <Button variant="outline" onClick={() => refetch()}>
                                    Tentar novamente
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <ReactFlow
                            nodes={searchQuery ? filteredNodes : nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onNodeClick={onNodeClick}
                            nodeTypes={nodeTypes}
                            fitView
                            attributionPosition="bottom-left"
                            minZoom={0.1}
                            maxZoom={2}
                        >
                            <Background color="#E5E7EB" gap={16} />
                            <Controls />
                            <MiniMap
                                nodeColor={getMinimapNodeColor}
                                maskColor="rgba(0, 0, 0, 0.1)"
                                className="!bg-background/80 border rounded-lg"
                            />

                            {/* Legend Panel */}
                            <Panel position="top-right" className="bg-background/90 p-3 rounded-lg border shadow-sm">
                                <div className="text-xs font-medium mb-2">Legenda</div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <span className="text-xs">Role</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                                        <span className="text-xs">Módulo</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                                        <span className="text-xs">Permissão</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <span className="text-xs">Usuário</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-xs">Loja</span>
                                    </div>
                                </div>
                            </Panel>

                            {/* Breadcrumb Panel */}
                            {currentView.type !== 'overview' && (
                                <Panel position="top-left" className="bg-background/90 p-2 rounded-lg border shadow-sm">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => changeView({
                                                type: 'overview',
                                                label: 'Visão Geral',
                                                icon: <Network className="h-4 w-4" />,
                                            })}
                                        >
                                            <Network className="h-4 w-4 mr-1" />
                                            Overview
                                        </Button>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="flex items-center gap-1">
                                            {currentView.icon}
                                            {currentView.label}
                                        </span>
                                    </div>
                                </Panel>
                            )}
                        </ReactFlow>
                    )}
                </div>
            </Card>

            {/* Summary Cards */}
            {graphData?.summary && (
                <div className="grid gap-4 md:grid-cols-5">
                    {graphData.summary.by_type?.role !== undefined && (
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Shield className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{graphData.summary.by_type.role}</p>
                                    <p className="text-xs text-muted-foreground">Roles</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {graphData.summary.by_type?.module !== undefined && (
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <Package className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{graphData.summary.by_type.module}</p>
                                    <p className="text-xs text-muted-foreground">Módulos</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {graphData.summary.by_type?.permission !== undefined && (
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-500/10">
                                    <Network className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{graphData.summary.by_type.permission}</p>
                                    <p className="text-xs text-muted-foreground">Permissões</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {graphData.summary.by_type?.user !== undefined && (
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/10">
                                    <User className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{graphData.summary.by_type.user}</p>
                                    <p className="text-xs text-muted-foreground">Usuários</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {graphData.summary.by_type?.store !== undefined && (
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <Store className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{graphData.summary.by_type.store}</p>
                                    <p className="text-xs text-muted-foreground">Lojas</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default PermissionGraph;
