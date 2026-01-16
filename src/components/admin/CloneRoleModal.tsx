/**
 * CloneRoleModal Component
 * 
 * Modal for cloning an existing role with a new name.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cloneRole } from '@/services/admin/roles.service';
import { roleKeys } from '@/hooks/api/use-roles';
import type { Role } from '@/types/permissions.types';

const cloneRoleSchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres')
        .max(50, 'Nome deve ter no máximo 50 caracteres')
        .regex(/^[a-z0-9-]+$/, 'Nome deve conter apenas letras minúsculas, números e hífens'),
    display_name: z
        .string()
        .min(3, 'Nome de exibição deve ter pelo menos 3 caracteres')
        .max(100, 'Nome de exibição deve ter no máximo 100 caracteres'),
    description: z.string().max(255).optional(),
});

type CloneRoleFormData = z.infer<typeof cloneRoleSchema>;

interface CloneRoleModalProps {
    role: Role;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CloneRoleModal({ role, open, onOpenChange }: CloneRoleModalProps) {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CloneRoleFormData>({
        resolver: zodResolver(cloneRoleSchema),
        defaultValues: {
            name: `${role.name}-copy`,
            display_name: `${role.display_name} (Cópia)`,
            description: role.description || '',
        },
    });

    const cloneMutation = useMutation({
        mutationFn: (data: CloneRoleFormData) => cloneRole(role.id, {
            name: data.name,
            display_name: data.display_name,
            description: data.description,
        }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
            toast.success(response.message);
            reset();
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast.error('Erro ao clonar role', { description: error.message });
        },
    });

    const onSubmit = (data: CloneRoleFormData) => {
        cloneMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="h-5 w-5" />
                        Clonar Role
                    </DialogTitle>
                    <DialogDescription>
                        Criar uma nova role baseada em <strong>{role.display_name}</strong> com {role.permissions_count} permissões.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Identificador (slug)</Label>
                        <Input
                            id="name"
                            placeholder="nova-role"
                            {...register('name')}
                            className="font-mono"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="display_name">Nome de Exibição</Label>
                        <Input
                            id="display_name"
                            placeholder="Nova Role"
                            {...register('display_name')}
                        />
                        {errors.display_name && (
                            <p className="text-sm text-destructive">{errors.display_name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Descrição da role..."
                            rows={3}
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={cloneMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={cloneMutation.isPending} className="gap-2">
                            {cloneMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            Clonar Role
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default CloneRoleModal;
