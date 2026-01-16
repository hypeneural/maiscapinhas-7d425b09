/**
 * RoleForm Page
 * 
 * Form for creating and editing roles with permission assignment.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Shield,
    Save,
    ArrowLeft,
    Loader2,
    Key,
    Search,
    Check,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useRole,
    useCreateRole,
    useUpdateRole
} from '@/hooks/api/use-roles';
import { usePermissionsGrouped } from '@/hooks/api/use-admin-permissions';
import type { Permission } from '@/types/permissions.types';

const roleSchema = z.object({
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

type RoleFormData = z.infer<typeof roleSchema>;

const RoleForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id && id !== 'novo';
    const roleId = isEditing ? parseInt(id, 10) : 0;

    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [permissionSearch, setPermissionSearch] = useState('');

    // Fetch existing role if editing
    const { data: role, isLoading: isLoadingRole } = useRole(roleId);

    // Fetch all permissions grouped by module
    const { data: permissionsGrouped, isLoading: isLoadingPermissions } = usePermissionsGrouped();

    // Mutations
    const createMutation = useCreateRole();
    const updateMutation = useUpdateRole();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<RoleFormData>({
        resolver: zodResolver(roleSchema),
    });

    // Initialize form and permissions when role data loads
    React.useEffect(() => {
        if (role) {
            reset({
                name: role.name,
                display_name: role.display_name,
                description: role.description || '',
            });
            setSelectedPermissions(new Set(role.permissions.map(p => p.name)));
        }
    }, [role, reset]);

    // Filter permissions by search - now using ModuleGroup[] format
    const filteredPermissionsGrouped = useMemo(() => {
        if (!permissionsGrouped || !Array.isArray(permissionsGrouped)) return [];

        return permissionsGrouped.map(group => {
            // Combine all permission types into one array
            const allPermissions = [
                ...group.abilities,
                ...group.screens,
                ...group.features,
            ];

            if (!permissionSearch) {
                return {
                    ...group,
                    allPermissions,
                };
            }

            // Filter by search
            const searchLower = permissionSearch.toLowerCase();
            const filteredPermissions = allPermissions.filter(
                (p) => p.name?.toLowerCase().includes(searchLower) ||
                    p.display_name?.toLowerCase().includes(searchLower)
            );

            if (filteredPermissions.length === 0) return null;

            return {
                ...group,
                allPermissions: filteredPermissions,
            };
        }).filter(Boolean) as (typeof permissionsGrouped[0] & { allPermissions: Permission[] })[];
    }, [permissionsGrouped, permissionSearch]);

    const togglePermission = (permissionName: string) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permissionName)) {
                newSet.delete(permissionName);
            } else {
                newSet.add(permissionName);
            }
            return newSet;
        });
    };

    const toggleAllInModule = (modulePermissions: Permission[]) => {
        const allSelected = modulePermissions.every(p => selectedPermissions.has(p.name));

        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            modulePermissions.forEach(p => {
                if (allSelected) {
                    newSet.delete(p.name);
                } else {
                    newSet.add(p.name);
                }
            });
            return newSet;
        });
    };

    const onSubmit = async (data: RoleFormData) => {
        const permissions = Array.from(selectedPermissions);

        if (isEditing) {
            await updateMutation.mutateAsync({
                roleId,
                data: { ...data, permissions },
            });
        } else {
            await createMutation.mutateAsync({
                name: data.name,
                display_name: data.display_name,
                description: data.description,
                permissions,
            });
        }
        navigate('/config/roles');
    };

    const isLoading = isLoadingRole || isLoadingPermissions;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    if (isEditing && isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/config/roles')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <PageHeader
                    title={isEditing ? `Editar ${role?.display_name}` : 'Nova Role'}
                    description={isEditing ? 'Edite as informações e permissões da role' : 'Crie uma nova role personalizada'}
                    icon={Shield}
                />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>
                            Defina o identificador e nome de exibição da role
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Identificador (slug)</Label>
                            <Input
                                id="name"
                                placeholder="nova-role"
                                {...register('name')}
                                className="font-mono"
                                disabled={isEditing && role?.is_system}
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

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Descrição (opcional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Descrição da role..."
                                rows={2}
                                {...register('description')}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Permissões
                            </span>
                            <Badge variant="secondary">
                                {selectedPermissions.size} selecionadas
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Selecione as permissões que esta role terá acesso
                        </CardDescription>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar permissões..."
                                value={permissionSearch}
                                onChange={(e) => setPermissionSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPermissions ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : (
                            <Tabs defaultValue={filteredPermissionsGrouped[0]?.module} className="w-full">
                                <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                                    {filteredPermissionsGrouped.map((group) => (
                                        <TabsTrigger key={group.module} value={group.module} className="capitalize">
                                            {group.module_display}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {filteredPermissionsGrouped.map((group) => {
                                    const permissions = group.allPermissions;
                                    const allSelected = permissions.every(p => selectedPermissions.has(p.name));
                                    const someSelected = permissions.some(p => selectedPermissions.has(p.name));

                                    return (
                                        <TabsContent key={group.module} value={group.module} className="space-y-4 mt-4">
                                            <div className="flex items-center justify-between pb-2 border-b">
                                                <span className="font-medium capitalize">{group.module_display}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => toggleAllInModule(permissions)}
                                                    className="gap-2"
                                                >
                                                    {allSelected ? (
                                                        <>
                                                            <X className="h-3 w-3" />
                                                            Desmarcar todas
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="h-3 w-3" />
                                                            Selecionar todas
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="grid gap-2">
                                                {permissions.map((permission) => (
                                                    <label
                                                        key={permission.name}
                                                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                                                    >
                                                        <Checkbox
                                                            checked={selectedPermissions.has(permission.name)}
                                                            onCheckedChange={() => togglePermission(permission.name)}
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">{permission.display_name}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{permission.name}</p>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            {permission.type_display || permission.type}
                                                        </Badge>
                                                    </label>
                                                ))}
                                            </div>
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/config/roles')}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving} className="gap-2">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {isEditing ? 'Salvar Alterações' : 'Criar Role'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default RoleForm;
