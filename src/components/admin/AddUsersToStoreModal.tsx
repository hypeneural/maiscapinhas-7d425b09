/**
 * AddUsersToStoreModal
 * 
 * Modal to add multiple users to a store at once with role selection.
 * Features: user multi-select, role picker, search, tooltips.
 */

import React, { useState, useMemo } from 'react';
import { Users, Plus, X, Check, HelpCircle, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminUsers } from '@/hooks/api/use-admin-users';
import { apiPost } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/api';
import type { StoreRole, AdminUserResponse } from '@/types/admin.types';

// ============================================================
// Types
// ============================================================

interface AddUsersToStoreModalProps {
    storeId: number;
    storeName: string;
    existingUserIds: number[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SelectedUser {
    user_id: number;
    user_name: string;
    avatar_url: string | null;
    role: StoreRole;
}

// ============================================================
// Constants
// ============================================================

const ROLE_OPTIONS: { value: StoreRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrador', description: 'Acesso total à loja' },
    { value: 'gerente', label: 'Gerente', description: 'Gestão de vendas e equipe' },
    { value: 'conferente', label: 'Conferente', description: 'Conferência de produtos' },
    { value: 'vendedor', label: 'Vendedor', description: 'Vendas e atendimento' },
];

const ROLE_COLORS: Record<StoreRole, string> = {
    admin: 'bg-red-100 text-red-700',
    gerente: 'bg-blue-100 text-blue-700',
    conferente: 'bg-yellow-100 text-yellow-700',
    vendedor: 'bg-green-100 text-green-700',
    fabrica: 'bg-purple-100 text-purple-700',
};

// ============================================================
// Component
// ============================================================

export function AddUsersToStoreModal({
    storeId,
    storeName,
    existingUserIds,
    open,
    onOpenChange,
}: AddUsersToStoreModalProps) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
    const [defaultRole, setDefaultRole] = useState<StoreRole>('vendedor');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: usersData, isLoading: loadingUsers } = useAdminUsers({ per_page: 100, active: true });

    // Filter out already linked users and apply search
    const availableUsers = useMemo(() => {
        const existingIds = new Set(existingUserIds);
        const users = usersData?.data || [];

        return users.filter(user => {
            // Skip already linked users
            if (existingIds.has(user.id)) return false;
            // Skip super admins (they have access to all stores)
            if (user.is_super_admin) return false;

            if (search) {
                const searchLower = search.toLowerCase();
                return user.name.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower);
            }
            return true;
        });
    }, [usersData, existingUserIds, search]);

    // Toggle user selection
    const toggleUser = (user: AdminUserResponse) => {
        setSelectedUsers(prev => {
            const exists = prev.find(u => u.user_id === user.id);
            if (exists) {
                return prev.filter(u => u.user_id !== user.id);
            }
            return [...prev, {
                user_id: user.id,
                user_name: user.name,
                avatar_url: user.avatar_url,
                role: defaultRole
            }];
        });
    };

    // Update role for a selected user
    const updateUserRole = (userId: number, role: StoreRole) => {
        setSelectedUsers(prev =>
            prev.map(u => u.user_id === userId ? { ...u, role } : u)
        );
    };

    // Select all visible users
    const selectAll = () => {
        const newSelections = availableUsers
            .filter(u => !selectedUsers.find(sel => sel.user_id === u.id))
            .map(u => ({
                user_id: u.id,
                user_name: u.name,
                avatar_url: u.avatar_url,
                role: defaultRole
            }));
        setSelectedUsers(prev => [...prev, ...newSelections]);
    };

    // Clear all selections
    const clearAll = () => setSelectedUsers([]);

    // Handle submit - call API to add each user to the store
    const handleSubmit = async () => {
        if (selectedUsers.length === 0) return;

        setIsSubmitting(true);
        try {
            // Add each user to the store via their bulk endpoint
            const promises = selectedUsers.map(user =>
                apiPost(`/admin/users/${user.user_id}/stores/bulk`, {
                    stores: [{ store_id: storeId, role: user.role }]
                })
            );

            await Promise.all(promises);

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

            toast.success(`${selectedUsers.length} usuário(s) adicionado(s) à loja!`);
            setSelectedUsers([]);
            setSearch('');
            onOpenChange(false);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset on close
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedUsers([]);
            setSearch('');
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Adicionar Usuários à {storeName}
                    </DialogTitle>
                    <DialogDescription>
                        Selecione os usuários e o cargo que cada um terá nesta loja.
                        Usuários já vinculados ou Super Admins não aparecem na lista.
                    </DialogDescription>
                </DialogHeader>

                {/* Default Role Selector */}
                <div className="flex items-center gap-3 py-2">
                    <span className="text-sm font-medium">Cargo padrão:</span>
                    <Select value={defaultRole} onValueChange={(v: StoreRole) => setDefaultRole(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLE_OPTIONS.map(role => (
                                <SelectItem key={role.value} value={role.value}>
                                    <div className="flex items-center gap-2">
                                        <span>{role.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                                <p>O cargo padrão será aplicado aos novos usuários selecionados.
                                    Você pode alterar o cargo individual depois.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Search and Actions */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar usuário por nome ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={selectAll}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Todos
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Selecionar todos os usuários visíveis</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={clearAll}>
                                    <X className="h-4 w-4 mr-1" />
                                    Limpar
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Limpar seleção</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* User List */}
                <div className="min-h-[200px] max-h-[300px] overflow-y-auto border rounded-lg">
                    {loadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : availableUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Users className="h-10 w-10 mb-2 opacity-20" />
                            <p>Nenhum usuário disponível</p>
                            <p className="text-sm">Todos os usuários já estão vinculados ou não há usuários ativos.</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {availableUsers.map(user => {
                                const isSelected = selectedUsers.some(u => u.user_id === user.id);
                                return (
                                    <div
                                        key={user.id}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                                            ${isSelected
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'hover:bg-muted/50 border border-transparent'
                                            }
                                        `}
                                        onClick={() => toggleUser(user)}
                                    >
                                        <Checkbox checked={isSelected} />
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        {isSelected && (
                                            <Select
                                                value={selectedUsers.find(u => u.user_id === user.id)?.role || defaultRole}
                                                onValueChange={(v: StoreRole) => updateUserRole(user.id, v)}
                                            >
                                                <SelectTrigger
                                                    className="w-[140px] h-8"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ROLE_OPTIONS.map(role => (
                                                        <SelectItem key={role.value} value={role.value}>
                                                            {role.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Selected Summary */}
                {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1 py-2">
                        <span className="text-sm text-muted-foreground mr-2">
                            {selectedUsers.length} selecionado(s):
                        </span>
                        {selectedUsers.slice(0, 4).map(user => (
                            <Badge
                                key={user.user_id}
                                variant="secondary"
                                className="gap-1"
                            >
                                {user.user_name.split(' ')[0]}
                                <Badge className={`${ROLE_COLORS[user.role]} text-xs px-1`}>
                                    {user.role}
                                </Badge>
                            </Badge>
                        ))}
                        {selectedUsers.length > 4 && (
                            <Badge variant="outline">+{selectedUsers.length - 4}</Badge>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancelar
                    </Button>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={selectedUsers.length === 0 || isSubmitting}
                                    className="gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                    Adicionar {selectedUsers.length} usuário(s)
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Vincular os usuários selecionados a esta loja com os cargos especificados
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddUsersToStoreModal;
