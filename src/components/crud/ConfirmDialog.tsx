/**
 * ConfirmDialog Component
 * 
 * A reusable confirmation dialog for destructive actions.
 */

import React from 'react';
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
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface ConfirmDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog is closed */
    onOpenChange: (open: boolean) => void;
    /** Dialog title */
    title: string;
    /** Dialog description */
    description?: string | React.ReactNode;
    /** Confirm button text */
    confirmText?: string;
    /** Cancel button text */
    cancelText?: string;
    /** Callback when confirmed */
    onConfirm: () => void | Promise<void>;
    /** Loading state */
    loading?: boolean;
    /** Variant for styling */
    variant?: 'default' | 'destructive';
}

// ============================================================
// Component
// ============================================================

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    loading = false,
    variant = 'default',
}: ConfirmDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
        if (!loading) {
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && (
                        <AlertDialogDescription asChild>
                            <div>{description}</div>
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading}
                        className={cn(
                            variant === 'destructive' &&
                            'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        )}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default ConfirmDialog;
