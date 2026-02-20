import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    CalendarIcon,
    ChevronDown,
    ChevronUp,
    CreditCard,
    Filter,
    Globe,
    MapPin,
    RotateCcw,
    Store as StoreIcon,
    UserRound,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getStores } from '@/services/stores.service';
import { getStoreSellers, getStorePaymentMethods } from '@/services/reports.service';
import { getStoreIdentifier, resolveStoreIdentifierForReports } from '@/lib/store-identifiers';
import type { OperacoesFilters as FilterType } from '@/types/pdv-operacoes.types';
import { DateRange } from 'react-day-picker';
import { useAuth } from '@/contexts/AuthContext';
import { getChannelVisual, getPaymentVisual, getStatusVisual, getTypeVisual } from './operacaoVisuals';

interface OperacoesFiltersProps {
    filters: FilterType;
    onFilterChange: (filters: FilterType) => void;
    isLoading?: boolean;
}

export const OperacoesFilters: React.FC<OperacoesFiltersProps> = ({
    filters, onFilterChange, isLoading,
}) => {
    const { user } = useAuth();
    const isSuperAdmin = user?.is_super_admin || user?.roles?.includes('admin');

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: filters.from ? new Date(filters.from + 'T00:00:00') : new Date(),
        to: filters.to ? new Date(filters.to + 'T00:00:00') : new Date(),
    });

    // ── Data Sources ──
    const { data: stores, isLoading: isLoadingStores } = useQuery({
        queryKey: ['stores'],
        queryFn: () => getStores(),
        staleTime: 1000 * 60 * 5,
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

    const { data: sellers, isLoading: isLoadingSellers } = useQuery({
        queryKey: ['op-sellers', resolvedStoreId],
        queryFn: () => resolvedStoreId ? getStoreSellers(resolvedStoreId) : getStoreSellers(),
        enabled: !shouldWaitStoreResolution,
        staleTime: 1000 * 60 * 5,
    });

    const { data: paymentMethods, isLoading: isLoadingPayments } = useQuery({
        queryKey: ['op-payment-methods', resolvedStoreId],
        queryFn: () => getStorePaymentMethods(resolvedStoreId!),
        enabled: !shouldWaitStoreResolution && !!resolvedStoreId,
        staleTime: 1000 * 60 * 5,
    });

    // ── Date Sync ──
    useEffect(() => {
        if (dateRange?.from) {
            onFilterChange({
                ...filters,
                from: format(dateRange.from, 'yyyy-MM-dd'),
                to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(dateRange.from, 'yyyy-MM-dd'),
                page: 1,
            });
        }
    }, [dateRange]);

    // ── Handlers ──
    const handleStoreChange = (value: string) => {
        const newFilters: FilterType = { ...filters, page: 1 };
        if (value === 'all') {
            delete newFilters.store_id;
        } else {
            newFilters.store_id = value;
        }
        // Clear dependent filters
        delete newFilters.vendedor_id;
        delete newFilters.meio_pagamento;
        delete newFilters.id_finalizador;
        onFilterChange(newFilters);
    };

    const handleSelectChange = (key: keyof FilterType) => (value: string) => {
        const newFilters: FilterType = { ...filters, page: 1 };
        if (value === 'all' || value === '') {
            delete newFilters[key];
        } else {
            (newFilters as any)[key] = key === 'turno_seq' || key === 'vendedor_id'
                ? (isNaN(Number(value)) ? value : Number(value))
                : value;
        }
        onFilterChange(newFilters);
    };

    const setDatePreset = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'month') => {
        const today = new Date();
        let from: Date, to: Date;
        switch (preset) {
            case 'today': from = today; to = today; break;
            case 'yesterday': from = subDays(today, 1); to = subDays(today, 1); break;
            case '7days': from = subDays(today, 6); to = today; break;
            case '30days': from = subDays(today, 29); to = today; break;
            case 'month': from = startOfMonth(today); to = today; break;
        }
        setDateRange({ from, to });
    };

    const clearFilters = () => {
        const today = new Date();
        setDateRange({ from: today, to: today });
        onFilterChange({
            page: 1,
            per_page: filters.per_page || 15,
            sort: filters.sort || 'desc',
            from: format(today, 'yyyy-MM-dd'),
            to: format(today, 'yyyy-MM-dd'),
        });
    };

    // Count active advanced filters
    const advancedFilterCount = [
        filters.turno_seq,
        filters.vendedor_id,
        filters.meio_pagamento,
        filters.min_total,
        filters.max_total,
    ].filter(v => v !== undefined && v !== null && v !== '').length;

    const operationTypeOptions = [
        { value: 'venda', visual: getTypeVisual('venda') },
        { value: 'fechamento_caixa', visual: getTypeVisual('fechamento_caixa') },
    ];

    const statusOptions = [
        { value: 'concluido', visual: getStatusVisual('concluido') },
        { value: 'cancelado', visual: getStatusVisual('cancelado') },
        { value: 'FECHADO', visual: getStatusVisual('FECHADO') },
        { value: 'ABERTO', visual: getStatusVisual('ABERTO') },
    ];

    const channelOptions = [
        { value: 'HIPER_CAIXA', visual: getChannelVisual('HIPER_CAIXA') },
        { value: 'HIPER_LOJA', visual: getChannelVisual('HIPER_LOJA') },
    ];

    const renderIconOption = (
        label: string,
        Icon: React.ElementType,
        iconClass?: string,
    ) => (
        <span className="inline-flex items-center gap-2">
            <Icon className={cn('h-3.5 w-3.5 text-muted-foreground', iconClass)} />
            <span>{label}</span>
        </span>
    );

    return (
        <div className="space-y-3 bg-card p-4 rounded-xl border shadow-sm">
            {/* ── Row 1: Date Presets ── */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-1">Período:</span>
                {([
                    ['today', 'Hoje'],
                    ['yesterday', 'Ontem'],
                    ['7days', '7 dias'],
                    ['30days', '30 dias'],
                    ['month', 'Este mês'],
                ] as const).map(([key, label]) => (
                    <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-7 text-xs rounded-full px-3 transition-all",
                            // Highlight if matches
                            filters.from === format(
                                key === 'today' ? new Date() :
                                    key === 'yesterday' ? subDays(new Date(), 1) :
                                        key === '7days' ? subDays(new Date(), 6) :
                                            key === '30days' ? subDays(new Date(), 29) :
                                                startOfMonth(new Date()),
                                'yyyy-MM-dd') &&
                            "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                        onClick={() => setDatePreset(key)}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {/* ── Row 2: Primary Filters ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Date Range Picker */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Data</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal h-9",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                {dateRange?.from ? (
                                    dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() ? (
                                        <span className="text-xs">
                                            {format(dateRange.from, "dd/MM/yy")} — {format(dateRange.to, "dd/MM/yy")}
                                        </span>
                                    ) : (
                                        <span className="text-xs">{format(dateRange.from, "dd/MM/yyyy")}</span>
                                    )
                                ) : (
                                    <span className="text-xs">Selecione</span>
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

                {/* Store */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Loja</label>
                    <Select
                        value={resolvedStoreId?.toString() || 'all'}
                        onValueChange={handleStoreChange}
                        disabled={isLoadingStores && !stores?.length}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todas as lojas" />
                        </SelectTrigger>
                        <SelectContent>
                            {isSuperAdmin && (
                                <SelectItem value="all">
                                    {renderIconOption('Todas as lojas', Globe, 'text-sky-600 dark:text-sky-400')}
                                </SelectItem>
                            )}
                            {stores?.map((store) => {
                                const storeCity = (store as { city?: string | null }).city;
                                return (
                                    <SelectItem key={store.id} value={getStoreIdentifier(store)}>
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="inline-flex items-center gap-2 min-w-0">
                                                <StoreIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="truncate">{store.name}</span>
                                            </span>
                                            {!!storeCity && (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {storeCity}
                                                </span>
                                            )}
                                        </span>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tipo Operação */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <Select
                        value={filters.tipo_operacao || 'all'}
                        onValueChange={handleSelectChange('tipo_operacao')}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            {operationTypeOptions.map(({ value, visual }) => {
                                const Icon = visual.icon;
                                return (
                                    <SelectItem key={value} value={value}>
                                        {renderIconOption(visual.label, Icon, visual.iconClass)}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={handleSelectChange('status')}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {statusOptions.map(({ value, visual }) => {
                                const Icon = visual.icon;
                                return (
                                    <SelectItem key={value} value={value}>
                                        {renderIconOption(visual.label, Icon, visual.iconClass)}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── Advanced Filters Toggle ── */}
            <div className="flex items-center justify-between pt-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                    <Filter className="h-3.5 w-3.5" />
                    Filtros avançados
                    {advancedFilterCount > 0 && (
                        <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full bg-primary text-primary-foreground">
                            {advancedFilterCount}
                        </Badge>
                    )}
                    {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    disabled={isLoading}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpar filtros
                </Button>
            </div>

            {/* ── Advanced Filters (Collapsible) ── */}
            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-dashed animate-in slide-in-from-top-2 duration-200">
                    {/* Canal */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Canal</label>
                        <Select
                            value={filters.canal || 'all'}
                            onValueChange={handleSelectChange('canal')}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os canais</SelectItem>
                                {channelOptions.map(({ value, visual }) => {
                                    const Icon = visual.icon;
                                    return (
                                        <SelectItem key={value} value={value}>
                                            {renderIconOption(
                                                value === 'HIPER_CAIXA' ? 'Caixa (PDV)' : 'Loja (App)',
                                                Icon,
                                                visual.iconClass,
                                            )}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Turno */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Turno</label>
                        <Select
                            value={filters.turno_seq?.toString() || 'all'}
                            onValueChange={handleSelectChange('turno_seq')}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Todos" />
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

                    {/* Vendedor */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Vendedor</label>
                    <Select
                        value={filters.vendedor_id?.toString() || 'all'}
                        onValueChange={handleSelectChange('vendedor_id')}
                        disabled={isLoadingSellers}
                    >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={!selectedStoreId ? "Todos (Global)" : "Todos da loja"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os vendedores</SelectItem>
                                {sellers?.map((seller) => (
                                    <SelectItem
                                        key={seller.unique_key || seller.id}
                                        value={seller.id.toString()}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>
                                                {seller.nome}
                                                {!selectedStoreId && seller.store_name && ` (${seller.store_name})`}
                                                {seller.source === 'pdv_registry' && ' (PDV)'}
                                            </span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Meio de Pagamento */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Pagamento</label>
                    <Select
                        value={filters.meio_pagamento || 'all'}
                        onValueChange={handleSelectChange('meio_pagamento')}
                        disabled={!selectedStoreId || isLoadingPayments}
                    >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={!selectedStoreId ? "Selecione uma loja" : "Todos"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {renderIconOption('Todos os meios', CreditCard)}
                                </SelectItem>
                                {paymentMethods?.map((pm) => {
                                    const paymentVisual = getPaymentVisual(pm.nome);
                                    const PaymentIcon = paymentVisual.icon;
                                    return (
                                        <SelectItem key={pm.id} value={pm.nome}>
                                            {renderIconOption(paymentVisual.label, PaymentIcon, paymentVisual.iconClass)}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Value Range */}
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground">Faixa de Valor (R$)</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Mínimo"
                                type="number"
                                value={filters.min_total || ''}
                                onChange={(e) => onFilterChange({ ...filters, page: 1, min_total: e.target.value || undefined })}
                                className="h-9"
                            />
                            <Input
                                placeholder="Máximo"
                                type="number"
                                value={filters.max_total || ''}
                                onChange={(e) => onFilterChange({ ...filters, page: 1, max_total: e.target.value || undefined })}
                                className="h-9"
                            />
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Ordenação</label>
                        <Select
                            value={filters.sort || 'desc'}
                            onValueChange={handleSelectChange('sort')}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">Mais recentes</SelectItem>
                                <SelectItem value="asc">Mais antigos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* ── Global View Info ── */}
            {!filters.store_id && (
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs border border-blue-100 dark:border-blue-900">
                    <Filter className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                        Visualizando operações de <strong>todas as lojas</strong> (Visão Global).
                        Selecione uma loja para habilitar filtros de vendedor e pagamento.
                    </span>
                </div>
            )}
        </div>
    );
};
