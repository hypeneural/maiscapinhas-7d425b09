import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StoreMapping, StoreMappingPayload } from '@/types/pdv-mapping.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStoreMapping } from '@/services/pdv-mapping.service';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Store, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { ApiResponse } from '@/types/api';

// Simple types for Store dropdown
interface StoreOption {
    id: number;
    name: string;
    cnpj: string | null;
}

interface StoreMappingItemProps {
    mapping: StoreMapping;
    stores: StoreOption[];
}

const StoreMappingItem: React.FC<StoreMappingItemProps> = ({ mapping, stores }) => {
    const [selectedStoreId, setSelectedStoreId] = useState<string>(mapping.store?.id.toString() || '');
    const [alias, setAlias] = useState(mapping.alias || '');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const updateMutation = useMutation({
        mutationFn: updateStoreMapping,
        onSuccess: (response) => {
            const warning = response.warning;
            toast({
                title: warning ? "Atenção: Divergência detectada" : "Mapeamento salvo",
                description: warning || "Loja vinculada com sucesso.",
                variant: warning ? "destructive" : "default", // Using destructive color for visibility, ideally yellow/warning if available
                className: warning ? "bg-yellow-50 border-yellow-200 text-yellow-900" : undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['pdv-stores'] });
        },
        onError: () => {
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível atualizar o mapeamento.",
                variant: "destructive",
            });
        }
    });

    const handleSave = () => {
        if (!selectedStoreId) return;

        const payload: StoreMappingPayload = {
            pdv_store_id: mapping.pdv_store_id,
            store_id: parseInt(selectedStoreId),
            alias: alias,
            cnpj: mapping.cnpj || undefined // Pass existing CNPJ for validation check on backend
        };
        updateMutation.mutate(payload);
    };

    const hasChanges = selectedStoreId !== (mapping.store?.id.toString() || '') || alias !== (mapping.alias || '');
    const selectedStore = stores.find(s => s.id.toString() === selectedStoreId);
    const cnpjMismatch = mapping.cnpj && selectedStore?.cnpj && mapping.cnpj !== selectedStore.cnpj;

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">PDV ID: {mapping.pdv_store_id}</Badge>
                    {mapping.cnpj && (
                        <span className="text-xs text-muted-foreground font-mono">
                            CNPJ: {mapping.cnpj}
                        </span>
                    )}
                </div>
                <div>
                    <Input
                        placeholder="Apelido (ex: Loja Centro PDV)"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="max-w-[300px] mt-2 h-8"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end">
                <div className="w-[300px]">
                    <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma loja do ERP..." />
                        </SelectTrigger>
                        <SelectContent>
                            {stores.map(store => (
                                <SelectItem key={store.id} value={store.id.toString()}>
                                    {store.name} {store.cnpj ? `(${store.cnpj})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedStoreId && cnpjMismatch && (
                        <div className="text-xs text-yellow-600 mt-1 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            CNPJ não confere! ({selectedStore?.cnpj})
                        </div>
                    )}
                </div>

                <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasChanges || updateMutation.isPending}
                >
                    {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                </Button>
            </div>
        </div>
    );
};

interface StoreMappingListProps {
    mappings: StoreMapping[];
    isLoading: boolean;
}

export const StoreMappingList: React.FC<StoreMappingListProps> = ({ mappings, isLoading }) => {
    // Fetch internal stores for the dropdown
    const { data: stores } = useQuery({
        queryKey: ['admin-stores'],
        queryFn: async () => {
            // Adjust endpoint to get list of stores for admin selection
            // Usually we have something like /admin/stores or /config/lojas
            // Using a hypothetical endpoint, assuming standard API
            const response = await apiGet<ApiResponse<StoreOption[]>>('/admin/stores/options');
            return response.data || [];
        },
        initialData: [], // Default to empty array if not fetched yet
    }) as { data: StoreOption[] };
    // Typescript might complain about initialData type/return type mismatch if not careful, casting for simplicity in this snippet Context.

    if (isLoading) {
        return <div className="text-center py-8 text-muted-foreground">Carregando lojas...</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                        <Store className="mr-2 h-5 w-5" />
                        Mapeamento de Lojas
                    </CardTitle>
                    <CardDescription>
                        Vincule os IDs de loja recebidos do PDV às Lojas cadastradas no ERP para relatórios corretos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mappings.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                            Nenhuma loja do PDV identificada até o momento.
                        </div>
                    ) : (
                        mappings.map(mapping => (
                            <StoreMappingItem
                                key={mapping.id}
                                mapping={mapping}
                                stores={stores}
                            />
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
