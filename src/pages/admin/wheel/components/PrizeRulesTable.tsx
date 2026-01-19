/**
 * Prize Rules Table Component
 * 
 * Displays a table of prize rules with status indicators and actions.
 */

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    RotateCcw,
    Plus,
    CheckCircle2,
    Clock,
    XCircle,
    Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePrizeRules, useDeletePrizeRule, useResetPrizeRuleCooldown } from '@/hooks/api/use-prize-rules';
import type { PrizeRule, PrizeState } from '@/types/wheel.types';
import { PrizeRuleDialog } from './PrizeRuleDialog';

interface PrizeRulesTableProps {
    campaignKey: string;
    prizeStates?: PrizeState[];
    onRefresh?: () => void;
}

function StatusBadge({ state }: { state?: PrizeState }) {
    if (!state) {
        return (
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                Sem regra
            </Badge>
        );
    }

    if (state.is_eligible) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Elegível
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>Pode sair na próxima jogada</TooltipContent>
            </Tooltip>
        );
    }

    // Check reason for blocking
    if (state.inventory && state.inventory.remaining === 0) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                        <Package className="h-3 w-3 mr-1" />
                        Sem estoque
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>Estoque esgotado</TooltipContent>
            </Tooltip>
        );
    }

    if (state.state.spins_until_eligible > 0 || state.state.seconds_until_eligible > 0) {
        const spins = state.state.spins_until_eligible;
        const seconds = state.state.seconds_until_eligible;
        return (
            <Tooltip>
                <TooltipTrigger>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        <Clock className="h-3 w-3 mr-1" />
                        {spins > 0 ? `-${spins}` : `${Math.ceil(seconds / 60)}m`}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    {spins > 0 && `Faltam ${spins} jogadas`}
                    {spins > 0 && seconds > 0 && ' e '}
                    {seconds > 0 && `${Math.ceil(seconds / 60)} min`}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                    <XCircle className="h-3 w-3 mr-1" />
                    Bloqueado
                </Badge>
            </TooltipTrigger>
            <TooltipContent>{state.reason || 'Bloqueado por regra'}</TooltipContent>
        </Tooltip>
    );
}

export function PrizeRulesTable({ campaignKey, prizeStates, onRefresh }: PrizeRulesTableProps) {
    const { toast } = useToast();
    const { data: rulesData, isLoading } = usePrizeRules(campaignKey);
    const deleteRule = useDeletePrizeRule(campaignKey);
    const resetCooldown = useResetPrizeRuleCooldown(campaignKey);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<PrizeRule | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingRuleId, setDeletingRuleId] = useState<number | null>(null);

    const rules = rulesData?.data || [];

    const handleEdit = (rule: PrizeRule) => {
        setEditingRule(rule);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingRule(null);
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingRuleId) return;

        try {
            await deleteRule.mutateAsync(deletingRuleId);
            toast({
                title: 'Regra removida',
                description: 'A regra foi removida com sucesso.',
            });
            setDeleteDialogOpen(false);
            setDeletingRuleId(null);
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível remover a regra.',
                variant: 'destructive',
            });
        }
    };

    const handleResetCooldown = async (ruleId: number) => {
        try {
            await resetCooldown.mutateAsync({ ruleId });
            toast({
                title: 'Cooldown resetado',
                description: 'O cooldown foi resetado com sucesso.',
            });
            onRefresh?.();
        } catch {
            toast({
                title: 'Erro',
                description: 'Não foi possível resetar o cooldown.',
                variant: 'destructive',
            });
        }
    };

    const getStateForPrize = (prizeKey: string) => {
        return prizeStates?.find((s) => s.prize_key === prizeKey);
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Regras de Distribuição</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure quando e com que frequência cada prêmio pode sair
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Regra
                </Button>
            </div>

            {rules.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                    <p className="text-muted-foreground">Nenhuma regra configurada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Os prêmios serão distribuídos apenas por probabilidade
                    </p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Prêmio</TableHead>
                            <TableHead>Cooldown</TableHead>
                            <TableHead>Limites</TableHead>
                            <TableHead>Escopo</TableHead>
                            <TableHead>Pacing</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.map((rule) => {
                            const state = getStateForPrize(rule.prize.prize_key);
                            return (
                                <TableRow key={rule.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {rule.prize.icon && (
                                                <span className="text-lg">{rule.prize.icon}</span>
                                            )}
                                            <span className="font-medium">{rule.prize.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {rule.summary.cooldown || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {rule.summary.limits || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            {rule.summary.scope}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {rule.summary.pacing}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge state={state} />
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(rule)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleResetCooldown(rule.id)}>
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Reset Cooldown
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => {
                                                        setDeletingRuleId(rule.id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remover
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {/* Edit/Create Dialog */}
            <PrizeRuleDialog
                campaignKey={campaignKey}
                rule={editingRule}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Regra</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover esta regra? O prêmio voltará a ser distribuído apenas por probabilidade.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
