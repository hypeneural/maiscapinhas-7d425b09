import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Store, Inbox, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPdvUserSuggestions, getPdvUserMappings, getPdvStores } from '@/services/pdv-mapping.service';
import { UnmappedUsersTable } from '@/components/pdv-mapping/UnmappedUsersTable';
import { MappedUsersTable } from '@/components/pdv-mapping/MappedUsersTable';
import { StoreMappingList } from '@/components/pdv-mapping/StoreMappingList';

const PdvMapping: React.FC = () => {
    const [activeTab, setActiveTab] = useState('inbox');

    // --- Queries ---

    // 1. Suggestions (Inbox)
    const {
        data: suggestionsData,
        isLoading: isLoadingSuggestions,
        refetch: refetchSuggestions
    } = useQuery({
        queryKey: ['pdv-suggestions'],
        queryFn: getPdvUserSuggestions,
        refetchOnWindowFocus: false,
    });
    const suggestions = suggestionsData?.data || [];

    // 2. Mappings (Directory)
    const {
        data: mappingsData,
        isLoading: isLoadingMappings,
        refetch: refetchMappings
    } = useQuery({
        queryKey: ['pdv-mappings'],
        queryFn: async () => {
            // Fetch all for now. Implementation of server-side pagination can be added later to the component
            const response = await getPdvUserMappings({ page: 1, per_page: 100 });
            return response.data;
        },
        refetchOnWindowFocus: false,
    });
    const mappings = mappingsData || [];

    // 3. Stores
    const {
        data: storesData,
        isLoading: isLoadingStores,
        refetch: refetchStores
    } = useQuery({
        queryKey: ['pdv-stores'],
        queryFn: getPdvStores,
        refetchOnWindowFocus: false,
    });
    const stores = storesData?.data || [];

    const handleRefresh = () => {
        refetchSuggestions();
        refetchMappings();
        refetchStores();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mapeamento PDV</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie a vinculação entre vendedores do PDV externo e usuários do ERP.
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="inbox" className="relative">
                        <Inbox className="w-4 h-4 mr-2" />
                        Não Mapeados (Inbox)
                        {suggestions.length > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                                {suggestions.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="directory">
                        <Users className="w-4 h-4 mr-2" />
                        Mapeados (Diretório)
                    </TabsTrigger>
                    <TabsTrigger value="stores">
                        <Store className="w-4 h-4 mr-2" />
                        Lojas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inbox" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usuários Não Mapeados</CardTitle>
                            <CardDescription>
                                Vendedores detectados em vendas recentes que ainda não possuem vínculo com usuário do ERP.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UnmappedUsersTable
                                data={suggestions}
                                isLoading={isLoadingSuggestions}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="directory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usuários Mapeados</CardTitle>
                            <CardDescription>
                                Lista de todos os vínculos ativos entre identidades do PDV e usuários do ERP.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MappedUsersTable
                                data={mappings}
                                isLoading={isLoadingMappings}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stores" className="space-y-4">
                    <StoreMappingList
                        mappings={stores}
                        isLoading={isLoadingStores}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PdvMapping;
