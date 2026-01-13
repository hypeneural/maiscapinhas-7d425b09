/**
 * AddStoresToUserModal
 * 
 * Modal to add a user to multiple stores at once with role selection.
 * Features: store multi-select, role picker, tooltips, bulk add via API.
 */

import React, { useState, useMemo } from 'react';
import { Store, Plus, X, Check, HelpCircle, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useAdminStores } from '@/hooks/api/use-admin-stores';
import { useBulkAddStores } from '@/hooks/api/use-admin-users';
import type { StoreRole, UserStoreBinding } from '@/types/admin.types';

// ============================================================
// Types
// ============================================================

interface AddStoresToUserModalProps {
    userId: number;
    userName: string;
    existingStores: UserStoreBinding[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SelectedStore {
    store_id: number;
    store_name: string;
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

export function AddStoresToUserModal({
    userId,
    userName,
    existingStores,
    open,
    onOpenChange,
}: AddStoresToUserModalProps) {
    const [search, setSearch] = useState('');
    const [selectedStores, setSelectedStores] = useState<SelectedStore[]>([]);
    const [defaultRole, setDefaultRole] = useState<StoreRole>('vendedor');

    const { data: storesData, isLoading: loadingStores } = useAdminStores({ per_page: 100, active: true });
    const bulkAddMutation = useBulkAddStores(userId);

    // Filter out already linked stores and apply search
    const availableStores = useMemo(() => {
        const existingIds = new Set(existingStores.map(s => s.store_id));
        const stores = storesData?.data || [];

        return stores.filter(store => {
            if (existingIds.has(store.id)) return false;
            if (search) {
                const searchLower = search.toLowerCase();
                return store.name.toLowerCase().includes(searchLower) ||
                    store.city?.toLowerCase().includes(searchLower);
            }
            return true;
        });
    }, [storesData, existingStores, search]);

    // Toggle store selection
    const toggleStore = (store: { id: number; name: string }) => {
        setSelectedStores(prev => {
            const exists = prev.find(s => s.store_id === store.id);
            if (exists) {
                return prev.filter(s => s.store_id !== store.id);
            }
            return [...prev, { store_id: store.id, store_name: store.name, role: defaultRole }];
        });
    };

    // Update role for a selected store
    const updateStoreRole = (storeId: number, role: StoreRole) => {
        setSelectedStores(prev =>
            prev.map(s => s.store_id === storeId ? { ...s, role } : s)
        );
    };

    // Select all visible stores
    const selectAll = () => {
        const newSelections = availableStores
            .filter(s => !selectedStores.find(sel => sel.store_id === s.id))
            .map(s => ({ store_id: s.id, store_name: s.name, role: defaultRole }));
        setSelectedStores(prev => [...prev, ...newSelections]);
    };

    // Clear all selections
    const clearAll = () => setSelectedStores([]);

    // Handle submit
    const handleSubmit = async () => {
        if (selectedStores.length === 0) return;

        await bulkAddMutation.mutateAsync({
            stores: selectedStores.map(s => ({
                store_id: s.store_id,
                role: s.role,
            })),
        });

        setSelectedStores([]);
        setSearch('');
        onOpenChange(false);
    };

    // Reset on close
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedStores([]);
            setSearch('');
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary" />
                        Adicionar Lojas para {userName}
                    </DialogTitle>
                    <DialogDescription>
                        Selecione as lojas e o cargo que o usuário terá em cada uma.
                        Lojas já vinculadas não aparecem na lista.
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
                                <p>O cargo padrão será aplicado às novas lojas selecionadas.
                                    Você pode alterar o cargo individual depois.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Search and Actions */}
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Buscar loja por nome ou cidade..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1"
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={selectAll}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Todos
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Selecionar todas as lojas visíveis</TooltipContent>
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

                {/* Store List */}
                <div className="min-h-[200px] max-h-[300px] overflow-y-auto border rounded-lg">
                    {loadingStores ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : availableStores.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Users className="h-10 w-10 mb-2 opacity-20" />
                            <p>Nenhuma loja disponível</p>
                            <p className="text-sm">Todas as lojas já estão vinculadas ou não há lojas ativas.</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {availableStores.map(store => {
                                const isSelected = selectedStores.some(s => s.store_id === store.id);
                                return (
                                    <div
                                        key={store.id}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                                            ${isSelected
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'hover:bg-muted/50 border border-transparent'
                                            }
                                        `}
                                        onClick={() => toggleStore(store)}
                                    >
                                        <Checkbox checked={isSelected} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{store.name}</p>
                                            <p className="text-xs text-muted-foreground">{store.city || 'Sem cidade'}</p>
                                        </div>
                                        {isSelected && (
                                            <Select
                                                value={selectedStores.find(s => s.store_id === store.id)?.role || defaultRole}
                                                onValueChange={(v: StoreRole) => updateStoreRole(store.id, v)}
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
                {selectedStores.length > 0 && (
                    <div className="flex flex-wrap gap-1 py-2">
                        <span className="text-sm text-muted-foreground mr-2">
                            {selectedStores.length} selecionada(s):
                        </span>
                        {selectedStores.slice(0, 5).map(store => (
                            <Badge
                                key={store.store_id}
                                variant="secondary"
                                className="gap-1"
                            >
                                {store.store_name.length > 15
                                    ? store.store_name.slice(0, 15) + '...'
                                    : store.store_name}
                                <Badge className={`${ROLE_COLORS[store.role]} text-xs px-1`}>
                                    {store.role}
                                </Badge>
                            </Badge>
                        ))}
                        {selectedStores.length > 5 && (
                            <Badge variant="outline">+{selectedStores.length - 5}</Badge>
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
                                    disabled={selectedStores.length === 0 || bulkAddMutation.isPending}
                                    className="gap-2"
                                >
                                    {bulkAddMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                    Adicionar {selectedStores.length} loja(s)
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Vincular o usuário às lojas selecionadas com os cargos especificados
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddStoresToUserModal;
