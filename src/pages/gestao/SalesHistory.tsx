import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import { SalesFilters } from './components/SalesFilters';
import { SalesTable } from './components/SalesTable';
import { SaleDetailsSheet } from './components/SaleDetailsSheet';
import { getSalesHistory } from '@/services/reports.service';
import { getStores } from '@/services/stores.service';
import { resolveStoreIdentifierForReports } from '@/lib/store-identifiers';
import type { SalesFilters as FilterType, Sale } from '@/types/sales-history.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { TrendingUp, ShoppingBag } from 'lucide-react';

const SalesHistory: React.FC = () => {
    const [filters, setFilters] = useState<FilterType>({
        page: 1,
        per_page: 15,
        sort: 'desc',
        from: format(new Date(), 'yyyy-MM-dd'), // Current day
        to: format(new Date(), 'yyyy-MM-dd'),
    });

    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { data: stores, isLoading: isLoadingStores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => getStores(),
        staleTime: 1000 * 60 * 5,
    });
    const resolvedStoreId = resolveStoreIdentifierForReports(filters.store_id, stores);
    const shouldWaitStoreMetadata = Boolean(filters.store_id)
        && /^\d+$/.test(String(filters.store_id))
        && isLoadingStores;

    // Fetch Sales Data
    const { data: salesData, isLoading, isError } = useQuery({
        queryKey: ['sales-history', filters, resolvedStoreId],
        queryFn: () => getSalesHistory({
            ...filters,
            store_id: resolvedStoreId,
        }),
        enabled: !shouldWaitStoreMetadata,
        placeholderData: keepPreviousData,
    });

    const handleFilterChange = (newFilters: FilterType) => {
        setFilters(newFilters);
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleSaleClick = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Histórico de Vendas</h1>
                <p className="text-muted-foreground">
                    Visualize e monitore as vendas integradas de todas as lojas.
                </p>
            </div>

            {/* Summary Cards */}
            {salesData?.summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Vendido
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(salesData.summary.total_vendido)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                No período selecionado
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Qtd. Vendas
                            </CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {salesData.summary.total_vendas}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Transações registradas
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <SalesFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                isLoading={isLoading}
            />

            <SalesTable
                data={salesData}
                isLoading={isLoading}
                onPageChange={handlePageChange}
                onSaleClick={handleSaleClick}
            />

            <SaleDetailsSheet
                sale={selectedSale}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    );
};

export default SalesHistory;
