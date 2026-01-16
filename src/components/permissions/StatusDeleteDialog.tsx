/**
 * StatusDeleteDialog Component
 * 
 * Confirmation dialog for status deletion with impact preview.
 * Shows affected records, warnings, and suggestions before allowing deletion.
 */

import React, { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Trash2, Info, Lightbulb, XCircle } from 'lucide-react';
import { usePreviewImpact, useDeleteModuleStatus } from '@/hooks/api/use-modules';
import type { ModuleStatus, PreviewImpactResponse } from '@/types/modules.types';

interface StatusDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleId: string;
    statusKey: string;
    status: ModuleStatus;
}

export const StatusDeleteDialog: React.FC<StatusDeleteDialogProps> = ({
    open,
    onOpenChange,
    moduleId,
    statusKey,
    status,
}) => {
    const [impact, setImpact] = useState<PreviewImpactResponse | null>(null);
    const [isLoadingImpact, setIsLoadingImpact] = useState(false);

    const previewMutation = usePreviewImpact();
    const deleteMutation = useDeleteModuleStatus();

    // Fetch impact when dialog opens
    useEffect(() => {
        if (open && statusKey) {
            setIsLoadingImpact(true);
            previewMutation.mutateAsync({
                moduleId,
                data: {
                    action: 'delete_status',
                    status_key: statusKey,
                },
            }).then((result) => {
                setImpact(result);
            }).catch(() => {
                // If preview fails, show basic confirmation
                setImpact({
                    action: 'delete_status',
                    status_key: statusKey,
                    can_proceed: true,
                    affected_records: 0,
                    warnings: [],
                    suggestions: [],
                });
            }).finally(() => {
                setIsLoadingImpact(false);
            });
        }
    }, [open, moduleId, statusKey]);

    const handleDelete = async () => {
        await deleteMutation.mutateAsync({
            moduleId,
            statusKey,
            force: !impact?.can_proceed, // Force if there are conflicts
        });
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Deletar Status
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Você está prestes a deletar o status{' '}
                        <Badge variant="outline" className="mx-1">
                            {status.label}
                        </Badge>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Loading state */}
                {isLoadingImpact && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">
                            Verificando impacto...
                        </span>
                    </div>
                )}

                {/* Impact results */}
                {!isLoadingImpact && impact && (
                    <div className="space-y-4 py-4">
                        {/* Affected Records */}
                        {impact.affected_records > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-destructive">
                                        {impact.affected_records} registros afetados
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Existem registros neste status que serão impactados
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Warnings */}
                        {impact.warnings.length > 0 && (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-amber-600">
                                    <Info className="h-4 w-4" />
                                    Avisos
                                </Label>
                                <ul className="space-y-1 ml-6">
                                    {impact.warnings.map((warning, i) => (
                                        <li key={i} className="text-sm text-muted-foreground list-disc">
                                            {warning}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Suggestions */}
                        {impact.suggestions.length > 0 && (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-blue-600">
                                    <Lightbulb className="h-4 w-4" />
                                    Sugestões
                                </Label>
                                <ul className="space-y-1 ml-6">
                                    {impact.suggestions.map((suggestion, i) => (
                                        <li key={i} className="text-sm text-muted-foreground list-disc">
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Can proceed indicator */}
                        {impact.can_proceed && impact.affected_records === 0 && impact.warnings.length === 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                <XCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">
                                    Nenhum impacto detectado. O status pode ser deletado com segurança.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel disabled={deleteMutation.isPending}>
                        Cancelar
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoadingImpact || deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {!impact?.can_proceed ? 'Deletar Mesmo Assim' : 'Deletar Status'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

// Need to add missing import
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={`font-medium text-sm ${className || ''}`}>{children}</p>;
}

export default StatusDeleteDialog;
