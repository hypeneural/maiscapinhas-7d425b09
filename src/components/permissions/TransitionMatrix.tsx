/**
 * TransitionMatrix Component - Improved Version
 * 
 * Visual component for displaying and editing status transition rules.
 * Features:
 * - Rotated column headers to save horizontal space
 * - Compact cells for many statuses
 * - Toggle between Matrix and List views
 * - Better visual indicators and explanations
 */

import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowRight,
    Check,
    X,
    Edit2,
    Save,
    RotateCcw,
    Shield,
    Loader2,
    Info,
    Grid3X3,
    List,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { updateModuleTransitions } from '@/services/admin/modules.service';
import type {
    ModuleStatus,
    TransitionMatrix as TransitionMatrixType,
    TransitionRoleMatrix
} from '@/types/modules.types';

interface TransitionMatrixProps {
    moduleId: string;
    statuses: Record<string, ModuleStatus>;
    transitions: TransitionMatrixType;
    roleMatrix: TransitionRoleMatrix;
    readOnly?: boolean;
}

type ViewMode = 'matrix' | 'list';

export const TransitionMatrix: React.FC<TransitionMatrixProps> = ({
    moduleId,
    statuses,
    transitions,
    roleMatrix,
    readOnly = false,
}) => {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<ViewMode>('matrix');
    const [isEditing, setIsEditing] = useState(false);
    const [editedRoleMatrix, setEditedRoleMatrix] = useState<TransitionRoleMatrix>(roleMatrix);
    const [selectedTransition, setSelectedTransition] = useState<{ from: string; to: string } | null>(null);

    const statusEntries = Object.entries(statuses);
    const statusCount = statusEntries.length;

    // Determine if we need compact mode (more than 6 statuses)
    const isCompact = statusCount > 6;

    // Mutation for saving changes
    const saveMutation = useMutation({
        mutationFn: (data: TransitionRoleMatrix) => updateModuleTransitions(moduleId, { transitions: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['modules', moduleId] });
            setIsEditing(false);
            toast.success('Matriz de transições atualizada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erro ao atualizar matriz');
        }
    });

    // Check if transition is allowed
    const isTransitionAllowed = (fromStatus: string, toStatus: string): boolean => {
        const allowedTo = transitions[fromStatus] || [];
        return allowedTo.includes(parseInt(toStatus));
    };

    // Get roles for a transition
    const getTransitionRoles = (fromStatus: string, toStatus: string): string[] => {
        return editedRoleMatrix[fromStatus]?.[toStatus] || [];
    };

    // Toggle role for a transition
    const toggleRole = (fromStatus: string, toStatus: string, role: string) => {
        setEditedRoleMatrix(prev => {
            const newMatrix = { ...prev };
            if (!newMatrix[fromStatus]) newMatrix[fromStatus] = {};
            if (!newMatrix[fromStatus][toStatus]) newMatrix[fromStatus][toStatus] = [];

            const roles = [...newMatrix[fromStatus][toStatus]];
            const index = roles.indexOf(role);
            if (index >= 0) {
                roles.splice(index, 1);
            } else {
                roles.push(role);
            }
            newMatrix[fromStatus][toStatus] = roles;
            return newMatrix;
        });
    };

    // Cancel editing
    const handleCancel = () => {
        setEditedRoleMatrix(roleMatrix);
        setIsEditing(false);
    };

    // Save changes
    const handleSave = () => {
        saveMutation.mutate(editedRoleMatrix);
    };

    // Available roles
    const availableRoles = useMemo(() => {
        const allRoles = new Set<string>();
        Object.values(roleMatrix).forEach(toStatuses => {
            Object.values(toStatuses).forEach(roles => {
                roles.forEach(r => allRoles.add(r));
            });
        });
        return allRoles.size > 0
            ? Array.from(allRoles)
            : ['admin', 'gerente', 'conferente', 'vendedor'];
    }, [roleMatrix]);

    // Get all allowed transitions for list view
    const allowedTransitions = useMemo(() => {
        const result: Array<{ from: string; fromStatus: ModuleStatus; to: string; toStatus: ModuleStatus; roles: string[] }> = [];
        statusEntries.forEach(([fromId, fromStatus]) => {
            statusEntries.forEach(([toId, toStatus]) => {
                if (fromId !== toId && isTransitionAllowed(fromId, toId)) {
                    result.push({
                        from: fromId,
                        fromStatus,
                        to: toId,
                        toStatus,
                        roles: getTransitionRoles(fromId, toId)
                    });
                }
            });
        });
        return result;
    }, [statusEntries, transitions, editedRoleMatrix]);

    // Cell size based on compact mode
    const cellSize = isCompact ? 'w-14' : 'w-20';
    const headerCellSize = isCompact ? 'w-14' : 'w-20';
    const rowHeaderWidth = isCompact ? 'w-24' : 'w-32';

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            Matriz de Transições
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {allowedTransitions.length} transições
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Define quais mudanças de status são permitidas e por quais roles
                        </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {/* View Mode Toggle */}
                        <div className="flex border rounded-lg overflow-hidden">
                            <Button
                                variant={viewMode === 'matrix' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="rounded-none px-3"
                                onClick={() => setViewMode('matrix')}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="rounded-none px-3"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>

                        {!readOnly && (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancel}
                                            disabled={saveMutation.isPending}
                                        >
                                            <RotateCcw className="h-4 w-4 mr-1" />
                                            Cancelar
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSave}
                                            disabled={saveMutation.isPending}
                                        >
                                            {saveMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-1" />
                                            )}
                                            Salvar
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit2 className="h-4 w-4 mr-1" />
                                        Editar
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === 'matrix' ? (
                    <>
                        {/* Matrix View */}
                        <ScrollArea className="w-full pb-4">
                            <div className="min-w-max">
                                {/* Header row with rotated labels */}
                                <div className="flex gap-px mb-1">
                                    <div className={`${rowHeaderWidth} shrink-0 font-medium text-xs text-muted-foreground p-2 flex items-end`}>
                                        <span className="truncate">De ↓ / Para →</span>
                                    </div>
                                    {statusEntries.map(([id, status]) => (
                                        <div
                                            key={id}
                                            className={`${headerCellSize} shrink-0 h-20 relative`}
                                        >
                                            {/* Rotated header */}
                                            <div
                                                className="absolute bottom-0 left-1/2 origin-bottom-left"
                                                style={{
                                                    transform: 'rotate(-45deg) translateX(-50%)',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] px-1.5 py-0.5"
                                                    style={{
                                                        backgroundColor: `${status.color}15`,
                                                        borderColor: `${status.color}40`,
                                                        color: status.color
                                                    }}
                                                >
                                                    {isCompact ? status.label.slice(0, 10) : status.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Matrix rows */}
                                {statusEntries.map(([fromId, fromStatus]) => (
                                    <div key={fromId} className="flex gap-px mb-px">
                                        {/* Row header */}
                                        <div className={`${rowHeaderWidth} shrink-0 p-1.5 flex items-center`}>
                                            <Badge
                                                variant="outline"
                                                className={`${isCompact ? 'text-[10px] px-1.5' : 'text-xs'} truncate max-w-full`}
                                                style={{
                                                    backgroundColor: `${fromStatus.color}15`,
                                                    borderColor: `${fromStatus.color}40`,
                                                    color: fromStatus.color
                                                }}
                                            >
                                                {fromStatus.label}
                                            </Badge>
                                        </div>

                                        {/* Cells */}
                                        {statusEntries.map(([toId, toStatus]) => {
                                            const allowed = isTransitionAllowed(fromId, toId);
                                            const roles = getTransitionRoles(fromId, toId);
                                            const isSameStatus = fromId === toId;

                                            return (
                                                <div
                                                    key={toId}
                                                    className={`${cellSize} shrink-0 aspect-square rounded border transition-all ${isSameStatus
                                                        ? 'bg-muted/30 border-transparent'
                                                        : allowed
                                                            ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                                                            : 'bg-muted/5 border-muted/20'
                                                        } ${!isSameStatus && allowed && isEditing ? 'cursor-pointer ring-1 ring-transparent hover:ring-green-500/50' : ''
                                                        }`}
                                                    onClick={() => {
                                                        if (!isSameStatus && allowed && isEditing) {
                                                            setSelectedTransition({ from: fromId, to: toId });
                                                        }
                                                    }}
                                                >
                                                    {isSameStatus ? (
                                                        <div className="h-full flex items-center justify-center">
                                                            <span className="text-muted-foreground/30 text-xs">—</span>
                                                        </div>
                                                    ) : allowed ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="h-full flex flex-col items-center justify-center gap-0.5">
                                                                        <Check className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-green-600`} />
                                                                        {roles.length > 0 && (
                                                                            <span className="text-[9px] text-muted-foreground font-medium">
                                                                                {roles.length}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-xs">
                                                                    <div className="text-xs space-y-1">
                                                                        <p className="font-semibold flex items-center gap-1">
                                                                            <span style={{ color: fromStatus.color }}>{fromStatus.label}</span>
                                                                            <ChevronRight className="h-3 w-3" />
                                                                            <span style={{ color: toStatus.color }}>{toStatus.label}</span>
                                                                        </p>
                                                                        <p className="text-muted-foreground">
                                                                            {roles.length > 0 ? (
                                                                                <>Roles: <span className="font-medium text-foreground">{roles.join(', ')}</span></>
                                                                            ) : (
                                                                                <span className="text-amber-500">Qualquer role pode realizar</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center">
                                                            <X className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-muted-foreground/20`} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-green-600" />
                                </div>
                                <span>Permitido</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded bg-muted/5 border border-muted/20 flex items-center justify-center">
                                    <X className="h-2.5 w-2.5 text-muted-foreground/20" />
                                </div>
                                <span>Bloqueado</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded bg-muted/30 flex items-center justify-center">
                                    <span className="text-muted-foreground/30 text-[10px]">—</span>
                                </div>
                                <span>Mesmo status</span>
                            </div>
                            {isEditing && (
                                <div className="flex items-center gap-1.5 ml-auto text-primary">
                                    <Info className="h-3.5 w-3.5" />
                                    <span>Clique nas células verdes para editar roles</span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* List View */}
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground mb-4">
                                Mostrando {allowedTransitions.length} transições permitidas organizadas por status de origem.
                            </p>

                            {statusEntries.map(([fromId, fromStatus]) => {
                                const transitionsFrom = allowedTransitions.filter(t => t.from === fromId);
                                if (transitionsFrom.length === 0) return null;

                                return (
                                    <div key={fromId} className="border rounded-lg overflow-hidden">
                                        <div
                                            className="px-4 py-2.5 font-medium flex items-center gap-2"
                                            style={{
                                                backgroundColor: `${fromStatus.color}10`,
                                                borderBottom: `2px solid ${fromStatus.color}30`
                                            }}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: fromStatus.color }}
                                            />
                                            <span>De: {fromStatus.label}</span>
                                            <Badge variant="secondary" className="ml-auto text-xs">
                                                {transitionsFrom.length} transições
                                            </Badge>
                                        </div>
                                        <div className="divide-y">
                                            {transitionsFrom.map(({ to, toStatus, roles }) => (
                                                <div
                                                    key={to}
                                                    className={`px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors ${isEditing ? 'cursor-pointer' : ''
                                                        }`}
                                                    onClick={() => {
                                                        if (isEditing) {
                                                            setSelectedTransition({ from: fromId, to });
                                                        }
                                                    }}
                                                >
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs shrink-0"
                                                                style={{
                                                                    backgroundColor: `${toStatus.color}15`,
                                                                    borderColor: `${toStatus.color}40`,
                                                                    color: toStatus.color
                                                                }}
                                                            >
                                                                {toStatus.label}
                                                            </Badge>
                                                        </div>
                                                        {roles.length > 0 ? (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Roles: {roles.map((r, i) => (
                                                                    <Badge key={r} variant="secondary" className="text-[10px] mr-1 mt-1">
                                                                        {r}
                                                                    </Badge>
                                                                ))}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-amber-600 mt-1">
                                                                Qualquer role pode realizar esta transição
                                                            </p>
                                                        )}
                                                    </div>
                                                    {isEditing && (
                                                        <Edit2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {isEditing && (
                            <div className="flex items-center gap-1.5 mt-4 pt-4 border-t text-xs text-primary">
                                <Info className="h-3.5 w-3.5" />
                                <span>Clique em uma transição para editar as roles permitidas</span>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            {/* Edit Roles Dialog */}
            <Dialog open={!!selectedTransition} onOpenChange={() => setSelectedTransition(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Roles para Transição
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="flex items-center gap-2 flex-wrap pt-2">
                                {selectedTransition && (
                                    <>
                                        <span>Quem pode mudar de</span>
                                        <Badge
                                            variant="outline"
                                            style={{
                                                backgroundColor: `${statuses[selectedTransition.from]?.color}15`,
                                                borderColor: `${statuses[selectedTransition.from]?.color}40`,
                                                color: statuses[selectedTransition.from]?.color
                                            }}
                                        >
                                            {statuses[selectedTransition.from]?.label}
                                        </Badge>
                                        <span>para</span>
                                        <Badge
                                            variant="outline"
                                            style={{
                                                backgroundColor: `${statuses[selectedTransition.to]?.color}15`,
                                                borderColor: `${statuses[selectedTransition.to]?.color}40`,
                                                color: statuses[selectedTransition.to]?.color
                                            }}
                                        >
                                            {statuses[selectedTransition.to]?.label}
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTransition && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                {availableRoles.map((role) => {
                                    const isSelected = getTransitionRoles(
                                        selectedTransition.from,
                                        selectedTransition.to
                                    ).includes(role);

                                    return (
                                        <div
                                            key={role}
                                            className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                                                ? 'bg-primary/5 border-primary/30'
                                                : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => toggleRole(
                                                selectedTransition.from,
                                                selectedTransition.to,
                                                role
                                            )}
                                        >
                                            <Checkbox
                                                id={`role-${role}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleRole(
                                                    selectedTransition.from,
                                                    selectedTransition.to,
                                                    role
                                                )}
                                            />
                                            <label
                                                htmlFor={`role-${role}`}
                                                className="text-sm font-medium leading-none cursor-pointer capitalize"
                                            >
                                                {role}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                <p className="text-xs">
                                    Se nenhuma role for selecionada, <strong>qualquer usuário</strong> poderá realizar esta transição.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setSelectedTransition(null)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default TransitionMatrix;
