/**
 * UserPermissionsTab Component
 * 
 * Tab component for managing user permission overrides.
 * Shows effective permissions, overrides, and allows adding new ones.
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Zap,
    Plus,
    X,
    Clock,
    Search,
    Shield,
    AlertCircle,
    Check,
    Ban,
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
import {
    getUserPermissions,
    addUserPermissionOverride,
    removeUserPermissionOverride,
    getPermissionsGrouped
} from '@/services/admin/permissions.service';
import type { PermissionOverride } from '@/types/permissions.types';

interface UserPermissionsTabProps {
    userId: number;
}

export const UserPermissionsTab: React.FC<UserPermissionsTabProps> = ({ userId }) => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newOverride, setNewOverride] = useState({
        permission: '',
        type: 'grant' as 'grant' | 'deny',
        expires_at: '',
        reason: '',
    });

    // Fetch user's current overrides
    const { data: userPermissions, isLoading } = useQuery({
        queryKey: ['user-permissions', userId],
        queryFn: () => getUserPermissions(userId),
        enabled: !!userId,
    });

    // Fetch all available permissions
    const { data: allPermissions } = useQuery({
        queryKey: ['permissions-grouped'],
        queryFn: getPermissionsGrouped,
    });

    // Add override mutation
    const addMutation = useMutation({
        mutationFn: (data: typeof newOverride) => addUserPermissionOverride(userId, {
            permission: data.permission,
            type: data.type,
            expires_at: data.expires_at || undefined,
            reason: data.reason || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
            setAddDialogOpen(false);
            setNewOverride({ permission: '', type: 'grant', expires_at: '', reason: '' });
            toast.success('Override de permissão adicionado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erro ao adicionar override');
        }
    });

    // Remove override mutation
    const removeMutation = useMutation({
        mutationFn: (overrideId: number) => removeUserPermissionOverride(userId, overrideId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
            toast.success('Override removido');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erro ao remover override');
        }
    });

    // Filter overrides by search
    const filteredOverrides = userPermissions?.overrides?.filter(o =>
        o.permission.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    // Get all permissions as flat list for selection
    const availablePermissions = React.useMemo(() => {
        if (!allPermissions) return [];

        // Handle ModuleGroup[] structure (current API)
        if (Array.isArray(allPermissions)) {
            return allPermissions.flatMap(group => {
                const perms = [
                    ...(group.abilities || []),
                    ...(group.screens || []),
                    ...(group.features || [])
                ];
                return perms.map(p => ({ ...p, module: group.module_display || group.module }));
            });
        }

        // Fallback for Record<string, Permission[]> (legacy/safety)
        return Object.entries(allPermissions).flatMap(([module, perms]) =>
            Array.isArray(perms) ? perms.map(p => ({ ...p, module })) : []
        );
    }, [allPermissions]);

    const isExpiring = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        const diff = new Date(expiresAt).getTime() - Date.now();
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 days
    };

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
                        placeholder="Buscar permissões..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Override
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold">
                                {filteredOverrides.filter(o => o.type === 'grant').length}
                            </p>
                            <p className="text-xs text-muted-foreground">Concedidas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <Ban className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold">
                                {filteredOverrides.filter(o => o.type === 'deny').length}
                            </p>
                            <p className="text-xs text-muted-foreground">Negadas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold">
                                {filteredOverrides.filter(o => o.expires_at).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Temporárias</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Overrides List */}
            {filteredOverrides.length > 0 ? (
                <div className="space-y-2">
                    {filteredOverrides.map((override) => (
                        <div
                            key={override.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${override.type === 'grant'
                                    ? 'bg-green-500/10'
                                    : 'bg-red-500/10'
                                    }`}>
                                    {override.type === 'grant' ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Ban className="h-4 w-4 text-red-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium font-mono text-sm">{override.permission}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={override.type === 'grant' ? 'default' : 'destructive'} className="text-xs">
                                            {override.type === 'grant' ? 'Concedida' : 'Negada'}
                                        </Badge>
                                        {override.expires_at && (
                                            <Badge
                                                variant="outline"
                                                className={`text-xs gap-1 ${isExpiring(override.expires_at) ? 'border-amber-500 text-amber-600' : ''}`}
                                            >
                                                <Clock className="h-3 w-3" />
                                                {new Date(override.expires_at).toLocaleDateString('pt-BR')}
                                            </Badge>
                                        )}
                                        {override.reason && (
                                            <span className="text-xs text-muted-foreground">
                                                {override.reason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMutation.mutate(override.id)}
                                disabled={removeMutation.isPending}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum override de permissão</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            As permissões são herdadas das roles do usuário
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Add Override Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Override de Permissão</DialogTitle>
                        <DialogDescription>
                            Adicione uma permissão específica para este usuário
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Permissão</Label>
                            <Select
                                value={newOverride.permission}
                                onValueChange={(v) => setNewOverride(o => ({ ...o, permission: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma permissão" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {availablePermissions.map((perm) => (
                                        <SelectItem key={perm.name} value={perm.name}>
                                            <span className="font-mono text-sm">{perm.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={newOverride.type}
                                onValueChange={(v: 'grant' | 'deny') => setNewOverride(o => ({ ...o, type: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grant">
                                        <span className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            Conceder
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="deny">
                                        <span className="flex items-center gap-2">
                                            <Ban className="h-4 w-4 text-red-500" />
                                            Negar
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Expira em (opcional)</Label>
                            <Input
                                type="datetime-local"
                                value={newOverride.expires_at}
                                onChange={(e) => setNewOverride(o => ({ ...o, expires_at: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Motivo (opcional)</Label>
                            <Input
                                value={newOverride.reason}
                                onChange={(e) => setNewOverride(o => ({ ...o, reason: e.target.value }))}
                                placeholder="Ex: Cobertura de férias"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => addMutation.mutate(newOverride)}
                            disabled={!newOverride.permission || addMutation.isPending}
                        >
                            {addMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Adicionar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserPermissionsTab;
