/**
 * ModuleAuditLog Component
 * 
 * Displays the audit log/history for a module.
 * Shows who changed what and when.
 */

import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    FileEdit,
    Plus,
    Trash2,
    Settings,
    ArrowRight,
    User,
    Clock,
    Globe,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useModuleAuditLog } from '@/hooks/api/use-modules';
import type { AuditEntry } from '@/types/modules.types';

interface ModuleAuditLogProps {
    moduleId: string;
}

// Map action types to icons and labels
const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    status_created: { icon: Plus, label: 'Status criado', color: 'text-green-600' },
    status_updated: { icon: FileEdit, label: 'Status atualizado', color: 'text-blue-600' },
    status_deleted: { icon: Trash2, label: 'Status removido', color: 'text-red-600' },
    texts_updated: { icon: Settings, label: 'Textos atualizados', color: 'text-purple-600' },
    action_created: { icon: Plus, label: 'Ação criada', color: 'text-green-600' },
    action_updated: { icon: FileEdit, label: 'Ação atualizada', color: 'text-blue-600' },
    action_deleted: { icon: Trash2, label: 'Ação removida', color: 'text-red-600' },
    transitions_updated: { icon: ArrowRight, label: 'Transições atualizadas', color: 'text-orange-600' },
};

function getActionConfig(action: string) {
    return ACTION_CONFIG[action] || { icon: Settings, label: action, color: 'text-gray-600' };
}

function formatChanges(data: Record<string, unknown>): string[] {
    const changes: string[] = [];

    if (data.status_key) {
        changes.push(`Status: ${data.status_key}`);
    }

    if (data.changes && typeof data.changes === 'object') {
        const changesObj = data.changes as Record<string, unknown>;
        Object.entries(changesObj).forEach(([key, value]) => {
            changes.push(`${key}: ${JSON.stringify(value)}`);
        });
    }

    // Handle direct properties
    Object.entries(data).forEach(([key, value]) => {
        if (key !== 'status_key' && key !== 'changes' && typeof value !== 'object') {
            changes.push(`${key}: ${value}`);
        }
    });

    return changes;
}

export const ModuleAuditLog: React.FC<ModuleAuditLogProps> = ({ moduleId }) => {
    const { data, isLoading, refetch, isRefetching } = useModuleAuditLog(moduleId);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4" />
                        Histórico de Alterações
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    const entries = data?.entries || [];

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="h-4 w-4" />
                            Histórico de Alterações
                        </CardTitle>
                        <CardDescription>
                            {entries.length > 0
                                ? `Últimas ${entries.length} alterações`
                                : 'Nenhuma alteração registrada'}
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isRefetching}
                    >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {entries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhuma alteração registrada ainda.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                            {/* Entries */}
                            <div className="space-y-6">
                                {entries.map((entry, index) => {
                                    const config = getActionConfig(entry.action);
                                    const Icon = config.icon;
                                    const changes = formatChanges(entry.data);
                                    const timestamp = new Date(entry.timestamp);

                                    return (
                                        <div key={index} className="relative pl-12">
                                            {/* Icon circle */}
                                            <div className={`absolute left-0 w-10 h-10 rounded-full bg-background border-2 flex items-center justify-center ${config.color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>

                                            {/* Content */}
                                            <div className="bg-muted/30 rounded-lg p-4 border">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div>
                                                        <Badge variant="outline" className={config.color}>
                                                            {config.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground text-right shrink-0">
                                                        <div title={format(timestamp, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}>
                                                            {formatDistanceToNow(timestamp, { addSuffix: true, locale: ptBR })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Changes */}
                                                {changes.length > 0 && (
                                                    <div className="text-sm text-muted-foreground mb-2">
                                                        {changes.map((change, i) => (
                                                            <div key={i} className="truncate">
                                                                • {change}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* User info */}
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {entry.user_name}
                                                    </div>
                                                    {entry.ip_address && (
                                                        <div className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            {entry.ip_address}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};

export default ModuleAuditLog;
