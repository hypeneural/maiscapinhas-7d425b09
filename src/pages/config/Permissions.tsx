/**
 * Permissions Page
 * 
 * Lists all permissions in the system grouped by module.
 */

import React, { useState, useMemo } from 'react';
import {
    Key,
    Search,
    Eye,
    Shield,
    Zap,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissionsByType } from '@/hooks/api/use-admin-permissions';
import type { Permission } from '@/types/permissions.types';

const TYPE_ICONS = {
    ability: Zap,
    screen: Eye,
    feature: Shield,
};

const TYPE_COLORS = {
    ability: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    screen: 'bg-green-500/10 text-green-600 border-green-500/20',
    feature: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const TYPE_LABELS = {
    ability: 'Habilidade',
    screen: 'Tela',
    feature: 'Recurso',
};

function PermissionCard({ permission }: { permission: Permission }) {
    const Icon = TYPE_ICONS[permission.type] || Key;

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className={`p-2 rounded-lg ${TYPE_COLORS[permission.type] || 'bg-muted'}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{permission.display_name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{permission.name}</p>
            </div>
            <Badge variant="outline" className={TYPE_COLORS[permission.type]}>
                {TYPE_LABELS[permission.type]}
            </Badge>
        </div>
    );
}

const Permissions: React.FC = () => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'ability' | 'screen' | 'feature'>('all');

    const { data, isLoading } = usePermissionsByType();

    // Combine all permissions for filtering
    const allPermissions = useMemo(() => {
        if (!data) return [];
        return [
            ...data.abilities.permissions,
            ...data.screens.permissions,
            ...data.features.permissions,
        ];
    }, [data]);

    // Group permissions by module
    const permissionsByModule = useMemo(() => {
        let permissions = allPermissions;

        // Filter by type
        if (typeFilter !== 'all') {
            permissions = permissions.filter(p => p.type === typeFilter);
        }

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            permissions = permissions.filter(
                p => p.name.toLowerCase().includes(searchLower) ||
                    p.display_name.toLowerCase().includes(searchLower)
            );
        }

        // Group by module
        const grouped: Record<string, Permission[]> = {};
        permissions.forEach(p => {
            const module = p.module || 'geral';
            if (!grouped[module]) grouped[module] = [];
            grouped[module].push(p);
        });

        return grouped;
    }, [allPermissions, search, typeFilter]);

    const modules = Object.keys(permissionsByModule).sort();
    const totalCount = Object.values(permissionsByModule).reduce((acc, arr) => acc + arr.length, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Permissões"
                description="Visualize todas as permissões disponíveis no sistema"
                icon={Key}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Lista de Permissões
                    </CardTitle>
                    <CardDescription>
                        {totalCount} permissões encontradas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar permissões..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select
                                value={typeFilter}
                                onValueChange={(v: 'all' | 'ability' | 'screen' | 'feature') => setTypeFilter(v)}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os tipos</SelectItem>
                                    <SelectItem value="ability">Habilidades</SelectItem>
                                    <SelectItem value="screen">Telas</SelectItem>
                                    <SelectItem value="feature">Recursos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    ) : modules.length === 0 ? (
                        <div className="text-center py-12">
                            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhuma permissão encontrada</p>
                        </div>
                    ) : (
                        <Tabs defaultValue={modules[0]} className="w-full">
                            <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                                {modules.map((module) => (
                                    <TabsTrigger key={module} value={module} className="capitalize gap-1">
                                        {module}
                                        <Badge variant="secondary" className="ml-1 text-xs">
                                            {permissionsByModule[module].length}
                                        </Badge>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {modules.map((module) => (
                                <TabsContent key={module} value={module} className="mt-4">
                                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                        {permissionsByModule[module].map((permission) => (
                                            <PermissionCard key={permission.id} permission={permission} />
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    )}
                </CardContent>
            </Card>

            {/* Stats Cards */}
            {data && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className={`p-3 rounded-lg ${TYPE_COLORS.ability}`}>
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{data.abilities.permissions.length}</p>
                                <p className="text-sm text-muted-foreground">Habilidades</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className={`p-3 rounded-lg ${TYPE_COLORS.screen}`}>
                                <Eye className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{data.screens.permissions.length}</p>
                                <p className="text-sm text-muted-foreground">Telas</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className={`p-3 rounded-lg ${TYPE_COLORS.feature}`}>
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{data.features.permissions.length}</p>
                                <p className="text-sm text-muted-foreground">Recursos</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Permissions;
