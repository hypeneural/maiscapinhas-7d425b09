/**
 * UserRolesTab Component
 * 
 * Tab component for managing user roles per store.
 * Shows roles assigned to the user and allows assignment/removal.
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Shield,
    Plus,
    X,
    Store,
    Search,
    Users,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getRoles } from '@/services/admin/roles.service';
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { api } from '@/lib/api';
import type { Role } from '@/types/permissions.types';

interface UserRole {
    id: number;
    role: string;
    role_display_name: string;
    store_id: number | null;
    store_name: string | null;
}

interface UserRolesTabProps {
    userId: number;
}

// API calls for user roles
async function getUserRoles(userId: number): Promise<UserRole[]> {
    const response = await api.get<{ roles: UserRole[] }>(`/admin/users/${userId}/roles`);
    return response.data?.roles ?? [];
}

async function assignUserRole(userId: number, data: { role_id: number; store_id?: number }): Promise<void> {
    await api.post(`/admin/users/${userId}/roles`, data);
}

async function removeUserRole(userId: number, assignmentId: number): Promise<void> {
    await api.delete(`/admin/users/${userId}/roles/${assignmentId}`);
}

export const UserRolesTab: React.FC<UserRolesTabProps> = ({ userId }) => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        role_id: 0,
        store_id: 0,
    });

    // Fetch user's current roles
    const { data: userRoles, isLoading } = useQuery({
        queryKey: ['user-roles', userId],
        queryFn: () => getUserRoles(userId),
        enabled: !!userId,
    });

    // Fetch all available roles
    const { data: allRolesData } = useQuery({
        queryKey: ['roles'],
        queryFn: getRoles,
    });

    // Fetch all stores
    const { data: storesData } = useAdminStores({ per_page: 100 });

    // Assign role mutation
    const assignMutation = useMutation({
        mutationFn: (data: typeof newAssignment) => assignUserRole(userId, {
            role_id: data.role_id,
            store_id: data.store_id || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
            setAddDialogOpen(false);
            setNewAssignment({ role_id: 0, store_id: 0 });
            toast.success('Role atribuída ao usuário');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erro ao atribuir role');
        }
    });

    // Remove role mutation
    const removeMutation = useMutation({
        mutationFn: (assignmentId: number) => removeUserRole(userId, assignmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
            toast.success('Role removida');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erro ao remover role');
        }
    });

    // Filter roles by search
    const filteredRoles = userRoles?.filter(r =>
        r.role.toLowerCase().includes(search.toLowerCase()) ||
        r.role_display_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.store_name?.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    const allRoles = allRolesData ?? [];
    const allStores = storesData?.data ?? [];

    // Group roles by store
    const rolesByStore = filteredRoles.reduce((acc, role) => {
        const key = role.store_id ?? 'global';
        if (!acc[key]) {
            acc[key] = {
                storeName: role.store_name ?? 'Global',
                storeId: role.store_id,
                roles: []
            };
        }
        acc[key].roles.push(role);
        return acc;
    }, {} as Record<string | number, { storeName: string; storeId: number | null; roles: UserRole[] }>);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar roles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Atribuir Role
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{filteredRoles.length}</p>
                            <p className="text-xs text-muted-foreground">Roles atribuídas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Store className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold">
                                {Object.keys(rolesByStore).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Lojas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Roles List - Grouped by Store */}
            {Object.keys(rolesByStore).length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(rolesByStore).map(([key, group]) => (
                        <Card key={key}>
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    {group.storeId ? (
                                        <Store className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Shield className="h-4 w-4 text-amber-500" />
                                    )}
                                    {group.storeName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex flex-wrap gap-2">
                                    {group.roles.map((role) => (
                                        <Badge
                                            key={role.id}
                                            variant="secondary"
                                            className="gap-1 pr-1"
                                        >
                                            {role.role_display_name || role.role}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4 ml-1 hover:bg-destructive/20"
                                                onClick={() => removeMutation.mutate(role.id)}
                                                disabled={removeMutation.isPending}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhuma role atribuída</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Atribua roles para definir as permissões do usuário
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Assign Role Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Atribuir Role</DialogTitle>
                        <DialogDescription>
                            Atribua uma role a este usuário, opcionalmente para uma loja específica
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={newAssignment.role_id.toString()}
                                onValueChange={(v) => setNewAssignment(o => ({ ...o, role_id: parseInt(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allRoles.map((role) => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                            <span className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                {role.display_name || role.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Loja (opcional)</Label>
                            <Select
                                value={newAssignment.store_id.toString()}
                                onValueChange={(v) => setNewAssignment(o => ({ ...o, store_id: parseInt(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Global (todas as lojas)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">
                                        <span className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-amber-500" />
                                            Global (todas as lojas)
                                        </span>
                                    </SelectItem>
                                    {allStores.map((store) => (
                                        <SelectItem key={store.id} value={store.id.toString()}>
                                            <span className="flex items-center gap-2">
                                                <Store className="h-4 w-4" />
                                                {store.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => assignMutation.mutate(newAssignment)}
                            disabled={!newAssignment.role_id || assignMutation.isPending}
                        >
                            {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Atribuir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserRolesTab;
