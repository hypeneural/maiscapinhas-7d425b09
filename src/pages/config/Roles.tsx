/**
 * Roles Page
 * 
 * CRUD interface for managing roles in the system.
 * Roles can be cloned and have permissions edited.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Plus,
    Pencil,
    Trash2,
    Copy,
    Users,
    Lock,
    Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, ConfirmDialog, type Column, type RowAction } from '@/components/crud';
import { CloneRoleModal } from '@/components/admin/CloneRoleModal';
import { useRoles, useDeleteRole } from '@/hooks/api/use-roles';
import type { Role } from '@/types/permissions.types';

// ============================================================
// Role List Component
// ============================================================

const Roles: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<Role | null>(null);
    const [cloneRole, setCloneRole] = useState<Role | null>(null);

    const { data: roles, isLoading } = useRoles();
    const deleteMutation = useDeleteRole();

    // Filter roles by search
    const filteredRoles = React.useMemo(() => {
        if (!roles) return [];
        if (!search) return roles;
        const searchLower = search.toLowerCase();
        return roles.filter(
            (r) =>
                r.name.toLowerCase().includes(searchLower) ||
                r.display_name.toLowerCase().includes(searchLower)
        );
    }, [roles, search]);

    const columns: Column<Role>[] = [
        {
            key: 'display_name',
            label: 'Role',
            render: (_, role) => (
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${role.is_system
                            ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5'
                            : 'bg-gradient-to-br from-primary/20 to-primary/5'
                        }`}>
                        <Shield className={`h-5 w-5 ${role.is_system ? 'text-amber-600' : 'text-primary'
                            }`} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-medium">{role.display_name}</p>
                            {role.is_system && (
                                <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Sistema
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{role.name}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'permissions_count',
            label: 'Permissões',
            render: (value) => (
                <Badge variant="secondary" className="gap-1">
                    <Key className="h-3 w-3" />
                    {value as number} permissões
                </Badge>
            ),
        },
        {
            key: 'users_count',
            label: 'Usuários',
            render: (value) => (
                <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {value as number} usuários
                </Badge>
            ),
        },
        {
            key: 'description',
            label: 'Descrição',
            render: (value) => (
                <span className="text-sm text-muted-foreground">
                    {(value as string) || '—'}
                </span>
            ),
        },
    ];

    const getRowActions = (role: Role): RowAction<Role>[] => [
        {
            label: 'Editar Permissões',
            icon: <Key className="h-4 w-4" />,
            onClick: (r) => navigate(`/config/roles/${r.id}`),
        },
        {
            label: 'Clonar Role',
            icon: <Copy className="h-4 w-4" />,
            onClick: (r) => setCloneRole(r),
            separator: true,
        },
        ...(role.is_system
            ? []
            : [
                {
                    label: 'Editar',
                    icon: <Pencil className="h-4 w-4" />,
                    onClick: (r: Role) => navigate(`/config/roles/${r.id}/editar`),
                },
                {
                    label: 'Excluir',
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: (r: Role) => setConfirmDelete(r),
                    variant: 'destructive' as const,
                    separator: true,
                    disabled: (r: Role) => r.users_count > 0,
                },
            ]),
    ];

    const handleDelete = async () => {
        if (confirmDelete) {
            await deleteMutation.mutateAsync(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Roles"
                description="Gerencie as funções e permissões do sistema"
                icon={Shield}
            />

            <div className="flex justify-between items-center">
                <div />
                <Button onClick={() => navigate('/config/roles/novo')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Role
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Lista de Roles
                    </CardTitle>
                    <CardDescription>
                        {roles?.length || 0} roles configuradas
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={filteredRoles}
                        columns={columns}
                        loading={isLoading}
                        getRowKey={(r) => r.id}
                        onSearch={setSearch}
                        searchPlaceholder="Buscar por nome..."
                        actions={getRowActions}
                        emptyMessage="Nenhuma role encontrada"
                        emptyIcon={<Shield className="h-12 w-12 text-muted-foreground" />}
                    />
                </CardContent>
            </Card>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!confirmDelete}
                onOpenChange={() => setConfirmDelete(null)}
                title="Excluir Role"
                description={
                    <p>
                        Tem certeza que deseja excluir <strong>{confirmDelete?.display_name}</strong>?
                        <br />
                        <span className="text-muted-foreground text-sm">
                            Esta ação não pode ser desfeita.
                        </span>
                    </p>
                }
                confirmText="Excluir"
                onConfirm={handleDelete}
                loading={deleteMutation.isPending}
                variant="destructive"
            />

            {/* Clone Role Modal */}
            {cloneRole && (
                <CloneRoleModal
                    role={cloneRole}
                    open={!!cloneRole}
                    onOpenChange={(open) => !open && setCloneRole(null)}
                />
            )}
        </div>
    );
};

export default Roles;
