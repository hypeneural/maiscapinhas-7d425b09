/**
 * TargetSelector
 * 
 * Simplified component for selecting announcement targets.
 * Uses native HTML elements to avoid Radix UI ref issues.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllPublicStores } from '@/services/stores.service';
import { listUsers } from '@/services/admin/users.service';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
    Search,
    Store,
    User,
    Users,
    Building2,
    ShieldCheck,
    Check,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import type { AnnouncementTarget, AnnouncementScope } from '@/types/announcements.types';

interface TargetSelectorProps {
    scope: AnnouncementScope;
    value: AnnouncementTarget[];
    onChange: (targets: AnnouncementTarget[]) => void;
    className?: string;
}

// Available roles for selection
const AVAILABLE_ROLES = [
    { id: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
    { id: 'gerente', label: 'Gerente', description: 'Gestão de lojas e equipes' },
    { id: 'conferente', label: 'Conferente', description: 'Conferência de caixa' },
    { id: 'vendedor', label: 'Vendedor', description: 'Vendas e atendimento' },
];

export const TargetSelector: React.FC<TargetSelectorProps> = ({
    scope,
    value,
    onChange,
    className,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { isAdmin, isSuperAdmin } = usePermissions();
    const canSelectUsers = isAdmin || isSuperAdmin;

    // Fetch stores
    const { data: storesResponse, isLoading: isLoadingStores } = useQuery({
        queryKey: ['stores', 'all'],
        queryFn: () => getAllPublicStores({ per_page: 100 }),
        enabled: scope === 'store',
        staleTime: 1000 * 60 * 10,
    });

    // Fetch users (admin only)
    const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['admin', 'users', 'list', { search: searchTerm, active: true }],
        queryFn: () => listUsers({ search: searchTerm || undefined, active: true, per_page: 50 }),
        enabled: scope === 'user' && canSelectUsers,
        staleTime: 1000 * 60 * 5,
    });

    const stores = storesResponse?.data || [];
    const users = usersResponse?.data || [];

    // Check if target is selected
    const isSelected = useCallback((targetType: string, targetId: string) => {
        return value.some(
            (t) => t.target_type === targetType && t.target_id === targetId
        );
    }, [value]);

    // Toggle target selection - memoized to avoid unnecessary re-renders
    const toggleTarget = useCallback((targetType: string, targetId: string) => {
        const exists = value.some(
            (t) => t.target_type === targetType && t.target_id === targetId
        );

        if (exists) {
            onChange(
                value.filter(
                    (t) => !(t.target_type === targetType && t.target_id === targetId)
                )
            );
        } else {
            onChange([
                ...value,
                { target_type: targetType as 'store' | 'user' | 'role', target_id: targetId },
            ]);
        }
    }, [value, onChange]);

    // Select/deselect all
    const selectAll = useCallback((targetType: string, items: { id: string | number }[]) => {
        const newTargets = items.map((item) => ({
            target_type: targetType as 'store' | 'user' | 'role',
            target_id: String(item.id),
        }));
        const existingOther = value.filter((t) => t.target_type !== targetType);
        onChange([...existingOther, ...newTargets]);
    }, [value, onChange]);

    const deselectAll = useCallback((targetType: string) => {
        onChange(value.filter((t) => t.target_type !== targetType));
    }, [value, onChange]);

    // Filter items
    const filteredStores = useMemo(() => {
        if (!stores.length) return [];
        const term = searchTerm.toLowerCase();
        return stores.filter((store) =>
            store.name.toLowerCase().includes(term) ||
            store.city?.toLowerCase().includes(term)
        );
    }, [stores, searchTerm]);

    const filteredRoles = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return AVAILABLE_ROLES.filter((role) =>
            role.label.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    // Count selected
    const currentTypeCount = value.filter(
        (t) => t.target_type === (scope === 'store' ? 'store' : scope === 'user' ? 'user' : 'role')
    ).length;

    // Global scope - no selection needed
    if (scope === 'global') {
        return (
            <div className={cn('p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800', className)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-medium">Escopo Global</p>
                        <p className="text-sm text-muted-foreground">
                            Todos os usuários receberão este comunicado.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('border rounded-lg', className)}>
            {/* Header */}
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                    {scope === 'store' && <Store className="w-4 h-4" />}
                    {scope === 'user' && <User className="w-4 h-4" />}
                    {scope === 'role' && <ShieldCheck className="w-4 h-4" />}
                    Selecionar {scope === 'store' ? 'Lojas' : scope === 'user' ? 'Usuários' : 'Cargos'}
                </div>
                {currentTypeCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {currentTypeCount} selecionado{currentTypeCount !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Search + Actions */}
            <div className="p-3 border-b space-y-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={`Buscar ${scope === 'store' ? 'lojas' : scope === 'user' ? 'usuários' : 'cargos'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                {scope !== 'user' && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (scope === 'store') selectAll('store', filteredStores);
                                if (scope === 'role') selectAll('role', AVAILABLE_ROLES);
                            }}
                            className="text-xs px-2 py-1 border rounded hover:bg-muted transition-colors"
                        >
                            Selecionar Todos
                        </button>
                        <button
                            type="button"
                            onClick={() => deselectAll(scope)}
                            disabled={currentTypeCount === 0}
                            className="text-xs px-2 py-1 border rounded hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            Limpar
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-auto">
                {/* Store selection */}
                {scope === 'store' && (
                    <>
                        {isLoadingStores ? (
                            <div className="p-4 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredStores.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {searchTerm ? 'Nenhuma loja encontrada.' : 'Nenhuma loja disponível.'}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredStores.map((store) => {
                                    const selected = isSelected('store', String(store.id));
                                    return (
                                        <div
                                            key={store.id}
                                            onClick={() => toggleTarget('store', String(store.id))}
                                            className={cn(
                                                'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                                                selected ? 'bg-primary/10' : 'hover:bg-muted/50'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                                                selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                            )}>
                                                {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                            <Store className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{store.name}</p>
                                                {store.city && (
                                                    <p className="text-xs text-muted-foreground">{store.city}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Role selection */}
                {scope === 'role' && (
                    <div className="divide-y">
                        {filteredRoles.map((role) => {
                            const selected = isSelected('role', role.id);
                            return (
                                <div
                                    key={role.id}
                                    onClick={() => toggleTarget('role', role.id)}
                                    className={cn(
                                        'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                                        selected ? 'bg-primary/10' : 'hover:bg-muted/50'
                                    )}
                                >
                                    <div className={cn(
                                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                                        selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                    )}>
                                        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                    <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{role.label}</p>
                                        <p className="text-xs text-muted-foreground">{role.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* User selection */}
                {scope === 'user' && (
                    <>
                        {!canSelectUsers ? (
                            <div className="p-6 text-center">
                                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500 opacity-50" />
                                <p className="font-medium text-amber-600 dark:text-amber-400">Permissão Restrita</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Apenas administradores podem selecionar usuários.
                                </p>
                            </div>
                        ) : isLoadingUsers ? (
                            <div className="p-4 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {searchTerm ? 'Nenhum usuário encontrado.' : 'Digite para buscar usuários.'}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {users.map((user) => {
                                    const selected = isSelected('user', String(user.id));
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleTarget('user', String(user.id))}
                                            className={cn(
                                                'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                                                selected ? 'bg-primary/10' : 'hover:bg-muted/50'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                                                selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                            )}>
                                                {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{user.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
