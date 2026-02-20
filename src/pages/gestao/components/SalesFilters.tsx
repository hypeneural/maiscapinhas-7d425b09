import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, X, Filter, CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getStores } from '@/services/stores.service';
import { getStoreSellers, getStoreShifts, getStorePaymentMethods } from '@/services/reports.service';
import { getStoreIdentifier, resolveStoreIdentifierForReports } from '@/lib/store-identifiers';
import type { SalesFilters as FilterType } from '@/types/sales-history.types';
import { DateRange } from 'react-day-picker';
import { useAuth } from '@/contexts/AuthContext';

interface SalesFiltersProps {
    filters: FilterType;
    onFilterChange: (filters: FilterType) => void;
    isLoading?: boolean;
}

export const SalesFilters: React.FC<SalesFiltersProps> = ({
    filters,
    onFilterChange,
    isLoading
}) => {
    const { user } = useAuth();
    const isSuperAdmin = user?.is_super_admin || user?.roles?.includes('admin');

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: filters.from ? new Date(filters.from + 'T00:00:00') : undefined,
        to: filters.to ? new Date(filters.to + 'T00:00:00') : undefined,
    });

    const { data: stores, isLoading: isLoadingStores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => getStores(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const selectedStoreId = filters.store_id;
    const resolvedStoreId = resolveStoreIdentifierForReports(filters.store_id, stores);
    const shouldWaitStoreResolution = Boolean(filters.store_id)
        && /^\d+$/.test(String(filters.store_id))
        && isLoadingStores;

    useEffect(() => {
        if (!filters.store_id || resolvedStoreId === undefined) {
            return;
        }

        const current = String(filters.store_id);
        const resolved = String(resolvedStoreId);
        if (current === resolved) {
            return;
        }

        onFilterChange({
            ...filters,
            store_id: resolvedStoreId,
            page: 1,
        });
    }, [filters, onFilterChange, resolvedStoreId]);

    // Fetch Sellers (Dependent on Store, or Global if none selected)
    const { data: sellers, isLoading: isLoadingSellers } = useQuery({
        queryKey: ['sellers', resolvedStoreId],
        queryFn: () => resolvedStoreId ? getStoreSellers(resolvedStoreId) : getStoreSellers(),
        enabled: !shouldWaitStoreResolution,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch Shifts (Dependent on Store AND Date)
    // We use the start date (from) as the reference date for shifts
    const selectedDate = filters.from;
    const { data: shifts, isLoading: isLoadingShifts } = useQuery({
        queryKey: ['shifts', resolvedStoreId, selectedDate],
        queryFn: () => getStoreShifts(resolvedStoreId!, selectedDate!),
        enabled: !shouldWaitStoreResolution && !!resolvedStoreId && !!selectedDate,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch Payment Methods (Dependent on Store)
    const { data: paymentMethods, isLoading: isLoadingPayments } = useQuery({
        queryKey: ['payment-methods', resolvedStoreId],
        queryFn: () => getStorePaymentMethods(resolvedStoreId!),
        enabled: !shouldWaitStoreResolution && !!resolvedStoreId,
        staleTime: 1000 * 60 * 5,
    });

    // Update filters when date range changes
    useEffect(() => {
        if (dateRange?.from) {
            onFilterChange({
                ...filters,
                from: format(dateRange.from, 'yyyy-MM-dd'),
                to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(dateRange.from, 'yyyy-MM-dd'),
                page: 1, // Reset page on filter change
                // If date changes, shift might be invalid (since shifts are daily)
                id_turno: undefined,
                turno_seq: undefined
            });
        } else if (filters.from && !dateRange) {
            // Clear date filter if range is cleared
            const newFilters = { ...filters };
            delete newFilters.from;
            delete newFilters.to;
            delete newFilters.id_turno; // Shift depends on date
            delete newFilters.turno_seq;
            newFilters.page = 1;
            onFilterChange(newFilters);
        }
    }, [dateRange]);

    const handleStoreChange = (value: string) => {
        const newFilters = { ...filters, page: 1 };
        if (value === 'all') {
            delete newFilters.store_id;
            // Clear dependent filters
            delete newFilters.vendedor_id;
            delete newFilters.id_turno;
            delete newFilters.turno_seq;
            delete newFilters.id_finalizador;
        } else {
            newFilters.store_id = value;
            // Clear items that might not belong to new store
            delete newFilters.vendedor_id;
            delete newFilters.id_turno;
            delete newFilters.turno_seq;
            // Payment methods might share IDs but safe to clear
            delete newFilters.id_finalizador;
        }
        onFilterChange(newFilters);
    };

    const handleChannelChange = (value: string) => {
        const newFilters = { ...filters, page: 1 };
        if (value === 'all') {
            delete newFilters.canal;
        } else {
            newFilters.canal = value;
        }
        onFilterChange(newFilters);
    };

    // Updated Payment Handler using ID from Aux Endpoint
    const handlePaymentIdChange = (value: string) => {
        const newFilters = { ...filters, page: 1 };
        if (value === 'all') {
            delete newFilters.id_finalizador;
        } else {
            newFilters.id_finalizador = value;
        }
        onFilterChange(newFilters);
    };

    const handleSellerChange = (value: string) => {
        const newFilters = { ...filters, page: 1 };
        if (value === 'all') {
            delete newFilters.vendedor_id;
        } else {
            newFilters.vendedor_id = value;
        }
        onFilterChange(newFilters);
    };

    const handleShiftChange = (value: string) => {
        const newFilters = { ...filters, page: 1 };
        if (value === 'all') {
            delete newFilters.turno_seq;
        } else {
            newFilters.turno_seq = Number(value);
        }
        onFilterChange(newFilters);
    }

    // Payment Method text search handler
    const handlePaymentMethodTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFilters = { ...filters, page: 1 };
        if (e.target.value === '') {
            delete newFilters.meio_pagamento;
        } else {
            newFilters.meio_pagamento = e.target.value;
        }
        // Debouncing should ideally be handled by parent or a custom hoo, but for now simple update
        // In a real app add debounce here
        onFilterChange(newFilters);
    };


    const clearFilters = () => {
        setDateRange(undefined);
        onFilterChange({
            page: 1,
            per_page: filters.per_page,
            sort: filters.sort
        });
    };

    return (
        <div className="space-y-4 bg-card p-4 rounded-lg border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Store Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Loja</label>
                    <Select
                        value={resolvedStoreId?.toString() || 'all'}
                        onValueChange={handleStoreChange}
                        disabled={isLoadingStores}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todas as lojas" />
                        </SelectTrigger>
                        <SelectContent>
                            {isSuperAdmin && <SelectItem value="all">Todas as lojas (Global)</SelectItem>}
                            {stores?.map((store) => (
                                <SelectItem key={store.id} value={getStoreIdentifier(store)}>
                                    {store.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                            {format(dateRange.to, "dd/MM/yyyy")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "dd/MM/yyyy")
                                    )
                                ) : (
                                    <span>Selecione um período</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Shift Filter (Simple Sequence) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Turno</label>
                    <Select
                        value={filters.turno_seq?.toString() || 'all'}
                        onValueChange={handleShiftChange}
                        // Enabled only if Date is selected (logic from doc)
                        disabled={!filters.from} // Doc says: "Ao selecionar um dia... habilite"
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={!filters.from ? "Selecione uma data" : "Todos os turnos"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os turnos</SelectItem>
                            <SelectItem value="1">1º Turno</SelectItem>
                            <SelectItem value="2">2º Turno</SelectItem>
                            <SelectItem value="3">3º Turno</SelectItem>
                            <SelectItem value="4">4º Turno</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Seller Filter (Dynamic) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Vendedor</label>
                    <Select
                        value={filters.vendedor_id?.toString() || 'all'}
                        onValueChange={handleSellerChange}
                        disabled={isLoadingSellers}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={
                                !selectedStoreId ? "Todos (Global)" : "Todos da loja"
                            } />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os vendedores</SelectItem>
                            {sellers?.map((seller) => (
                                <SelectItem
                                    key={seller.unique_key || seller.id} // prefer unique_key for global list
                                    value={seller.id.toString()}
                                >
                                    {seller.nome}
                                    {/* Show store name if global view and configured */}
                                    {!selectedStoreId && seller.store_name && ` (${seller.store_name})`}
                                    {seller.source === 'pdv_registry' && ' (PDV)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Channel Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Canal</label>
                    <Select
                        value={filters.canal || 'all'}
                        onValueChange={handleChannelChange}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os canais" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os canais</SelectItem>
                            <SelectItem value="HIPER_CAIXA">Caixa (PDV)</SelectItem>
                            <SelectItem value="HIPER_LOJA">Loja (App/Retaguarda)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Payment Filter (Text Search) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Pagamento (Busca)</label>
                    <Input
                        placeholder="Ex: Pix, Crédito..."
                        value={filters.meio_pagamento || ''}
                        onChange={handlePaymentMethodTextChange}
                    />
                    {/* Optional: Add badges for quick selection if needed */}
                </div>

                {/* Value Range Filter */}
                <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-sm font-medium">Valor (Min - Max)</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Min R$"
                            type="number"
                            value={filters.min_total || ''}
                            onChange={(e) => onFilterChange({ ...filters, page: 1, min_total: e.target.value })}
                            className="w-1/2"
                        />
                        <Input
                            placeholder="Max R$"
                            type="number"
                            value={filters.max_total || ''}
                            onChange={(e) => onFilterChange({ ...filters, page: 1, max_total: e.target.value })}
                            className="w-1/2"
                        />
                    </div>
                </div>

            </div>

            {/* Active Filters Summary (Global View context) */}
            {!filters.store_id && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm border border-blue-100 dark:border-blue-800">
                    <Filter className="h-4 w-4" />
                    <span>Visualizando vendas de <strong>todas as lojas</strong> (Visão Global). Selecione uma loja para filtros específicos.</span>
                </div>
            )}

            <div className="flex justify-end pt-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                >
                    <X className="mr-2 h-4 w-4" />
                    Limpar Filtros
                </Button>
            </div>
        </div>
    );
};
