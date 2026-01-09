/**
 * FormDialog Component
 * 
 * A reusable dialog for create/edit forms.
 * Integrates with react-hook-form for form management.
 */

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface FormDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog is closed */
    onOpenChange: (open: boolean) => void;
    /** Dialog title */
    title: string;
    /** Dialog description (optional) */
    description?: string;
    /** Form content */
    children: React.ReactNode;
    /** Submit handler */
    onSubmit: (e: React.FormEvent) => void;
    /** Loading state */
    loading?: boolean;
    /** Submit button text */
    submitText?: string;
    /** Cancel button text */
    cancelText?: string;
    /** Whether it's in edit mode */
    isEdit?: boolean;
    /** Dialog size */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Custom class name for content */
    className?: string;
}

// ============================================================
// Component
// ============================================================

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export function FormDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    onSubmit,
    loading = false,
    submitText,
    cancelText = 'Cancelar',
    isEdit = false,
    size = 'md',
    className,
}: FormDialogProps) {
    const defaultSubmitText = isEdit ? 'Salvar' : 'Criar';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(e);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(sizeClasses[size], className)}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && (
                            <DialogDescription>{description}</DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {children}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            {cancelText}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitText ?? defaultSubmitText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default FormDialog;
