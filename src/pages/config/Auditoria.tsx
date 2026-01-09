/**
 * Auditoria Page
 * 
 * Modern interface for viewing audit logs and statistics.
 * Uses real API integration via React Query hooks.
 */

import React, { useState, useMemo } from 'react';
import { Shield, Search, Filter, Calendar, User, Store, ChevronDown, ChevronRight, Activity, FileText, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column, type RowAction } from '@/components/crud';
import { useAuditLogs, useAuditStats } from '@/hooks/api/use-audit';
import { useAdminUsers } from '@/hooks/api/use-admin-users';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { cn } from '@/lib/utils';
import type { AuditLogEntry, AuditLogFilters } from '@/types/admin.types';

// ============================================================
// Constants
// ============================================================

const LOG_NAME_ICONS: Record<string, React.ReactNode> = {
    auth: <Shield className="h-4 w-4" />,
    user: <Users className="h-4 w-4" />,
    store: <Store className="h-4 w-4" />,
    cash: <FileText className="h-4 w-4" />,
    rules: <Settings className="h-4 w-4" />,
    default: <Activity className="h-4 w-4" />,
};

const LOG_NAME_COLORS: Record<string, string> = {
    auth: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    user: 'bg-green-500/10 text-green-600 border-green-500/20',
    store: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    cash: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    rules: 'bg-red-500/10 text-red-600 border-red-500/20',
    default: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

const ACTION_COLORS: Record<string, string> = {
    created: 'bg-green-500',
    updated: 'bg-blue-500',
    deleted: 'bg-red-500',
    default: 'bg-slate-500',
};

const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return formatDateTime(date);
};

// ============================================================
// Log Details Component
// ============================================================

interface LogDetailsProps {
    log: AuditLogEntry;
}

function LogDetails({ log }: LogDetailsProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Detalhes
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
                <div className="p-3 rounded-lg bg-muted/50 text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify({ context: log.context, properties: log.properties }, null, 2)}</pre>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

// ============================================================
// Stats Cards Component
// ============================================================

interface StatsCardsProps {
    from?: string;
    to?: string;
}

function StatsCards({ from, to }: StatsCardsProps) {
    const { data: stats, isLoading } = useAuditStats({ from, to });

    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-muted rounded w-24 mb-2" />
                                <div className="h-8 bg-muted rounded w-16" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Get top 3 actions
    const topActions = Object.entries(stats.by_action || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Logs</p>
                            <p className="text-2xl font-bold">{stats.total_logs.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-500/10">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                            <p className="text-2xl font-bold">{stats.unique_users}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="md:col-span-2">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-2">Principais Ações</p>
                    <div className="flex flex-wrap gap-2">
                        {topActions.map(([action, count]) => (
                            <Badge key={action} variant="outline" className="text-sm">
                                <span className={cn('w-2 h-2 rounded-full mr-2', ACTION_COLORS[action] || ACTION_COLORS.default)} />
                                {action}: {count}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================================
// Main Component
// ============================================================

const AuditoriaPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<AuditLogFilters>({
        per_page: 25,
    });

    // Queries
    const { data: logsData, isLoading } = useAuditLogs({ ...filters, page });
    const { data: usersData } = useAdminUsers({ per_page: 100 });
    const { data: storesData } = useAdminStores({ per_page: 100 });

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Handle filter change
    const handleFilterChange = (key: keyof AuditLogFilters, value: string | number | undefined) => {
        setFilters(f => ({ ...f, [key]: value || undefined }));
        setPage(1);
    };

    // Table columns
    const columns: Column<AuditLogEntry>[] = [
        {
            key: 'created_at',
            label: 'Data/Hora',
            render: (value) => (
                <div className="flex flex-col">
                    <span className="font-medium">{formatRelativeTime(value as string)}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(value as string)}</span>
                </div>
            ),
        },
        {
            key: 'event',
            label: 'Evento',
            render: (value, log) => {
                const logName = log.log_name || 'default';
                const icon = LOG_NAME_ICONS[logName] || LOG_NAME_ICONS.default;
                const color = LOG_NAME_COLORS[logName] || LOG_NAME_COLORS.default;

                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', color)}>
                            {icon}
                            <span className="ml-1">{logName}</span>
                        </Badge>
                        <span className="font-medium">{value as string}</span>
                    </div>
                );
            },
        },
        {
            key: 'action',
            label: 'Ação',
            render: (value) => {
                const action = value as string;
                const color = ACTION_COLORS[action] || ACTION_COLORS.default;
                return (
                    <Badge variant="outline" className="text-xs">
                        <span className={cn('w-2 h-2 rounded-full mr-2', color)} />
                        {action}
                    </Badge>
                );
            },
        },
        {
            key: 'causer',
            label: 'Usuário',
            render: (_, log) => (
                log.causer ? (
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{log.causer.name}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">Sistema</span>
                )
            ),
        },
        {
            key: 'store',
            label: 'Loja',
            render: (_, log) => (
                log.store ? (
                    <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span>{log.store.name}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'subject',
            label: 'Recurso',
            render: (_, log) => (
                log.subject ? (
                    <Badge variant="secondary" className="text-xs">
                        {log.subject.type} #{log.subject.id}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Logs de Auditoria"
                description="Acompanhe todas as ações realizadas no sistema"
                icon={Shield}
            />

            {/* Stats Cards */}
            <StatsCards from={filters.from} to={filters.to} />

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <Label className="text-xs">Data Início</Label>
                            <Input
                                type="date"
                                value={filters.from || ''}
                                onChange={(e) => handleFilterChange('from', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Data Fim</Label>
                            <Input
                                type="date"
                                value={filters.to || ''}
                                onChange={(e) => handleFilterChange('to', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Usuário</Label>
                            <Select
                                value={filters.causer_id ? String(filters.causer_id) : 'all'}
                                onValueChange={(v) => handleFilterChange('causer_id', v === 'all' ? undefined : parseInt(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os usuários</SelectItem>
                                    {usersData?.data.map(user => (
                                        <SelectItem key={user.id} value={String(user.id)}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs">Loja</Label>
                            <Select
                                value={filters.store_id ? String(filters.store_id) : 'all'}
                                onValueChange={(v) => handleFilterChange('store_id', v === 'all' ? undefined : parseInt(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as lojas</SelectItem>
                                    {storesData?.data.map(store => (
                                        <SelectItem key={store.id} value={String(store.id)}>
                                            {store.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs">Evento</Label>
                            <Input
                                value={filters.event || ''}
                                onChange={(e) => handleFilterChange('event', e.target.value)}
                                placeholder="auth.login, user.*"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setFilters({ per_page: 25 });
                                setPage(1);
                            }}
                        >
                            Limpar Filtros
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setFilters(f => ({
                                    ...f,
                                    from: thirtyDaysAgo,
                                    to: today,
                                }));
                            }}
                        >
                            Últimos 30 dias
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <DataTable
                data={logsData?.data || []}
                columns={columns}
                loading={isLoading}
                getRowKey={(log) => log.id}
                pagination={logsData?.meta}
                onPageChange={setPage}
                emptyMessage="Nenhum log encontrado"
                emptyIcon={<Shield className="h-12 w-12 text-muted-foreground" />}
            />
        </div>
    );
};

export default AuditoriaPage;
