import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  DollarSign,
  Filter,
  PieChart as PieChartIcon,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { InfoTooltip } from '@/components/InfoTooltip';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusDot } from '@/components/StatusIndicator';
import { MonthPicker } from '@/components/MonthPicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useConsolidatedPerformance } from '@/hooks/api/use-reports';
import { useStores } from '@/hooks/api/use-stores';
import { getStoreIdentifier, resolveStoreIdentifierForReports } from '@/lib/store-identifiers';
import type {
  ConsolidatedPerformanceFilters,
  ReportPeriodPreset,
} from '@/types/api';

type FilterMode = 'month' | 'period' | 'day' | 'custom';

const PERIOD_LABELS: Record<ReportPeriodPreset, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  last_7_days: 'Ultimos 7 dias',
  last_30_days: 'Ultimos 30 dias',
  this_month: 'Mes atual',
  last_month: 'Mes anterior',
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const toInputDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getMonthStartInputDate = () => {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return formatCurrency(value);
};

const formatDateBr = (value: string) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
};

const formatMonthLabel = (value: string) => {
  const [yearRaw, monthRaw] = value.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return value;
  }
  return new Date(year, monthIndex, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
};

const compactStoreName = (name: string) => {
  const normalized = name.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 20) {
    return normalized;
  }

  const parts = normalized.split(' - ');
  if (parts.length > 1 && parts[parts.length - 1].length <= 18) {
    return parts[parts.length - 1];
  }

  return `${normalized.slice(0, 18)}...`;
};

const readStoreCity = (store: unknown): string | null => {
  if (!store || typeof store !== 'object' || !('city' in store)) {
    return null;
  }

  const city = (store as { city?: unknown }).city;
  if (typeof city !== 'string' || city.trim() === '') {
    return null;
  }

  return city.trim();
};

const getSliceColor = (index: number, total: number) => {
  const angle = Math.round((index / Math.max(total, 1)) * 320);
  return `hsl(${angle} 72% 52%)`;
};

interface SalesTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    name: string;
    color: string;
    value: number;
  }>;
}

const SalesTooltip: React.FC<SalesTooltipProps> = ({ active, label, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <p key={entry.name} className="flex items-center justify-between gap-4 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

interface DistributionTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      fullName: string;
      share: number;
      value: number;
      achievement: number;
    };
  }>;
}

const DistributionTooltip: React.FC<DistributionTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold">{data.fullName}</p>
      <div className="space-y-1 text-muted-foreground">
        <p className="flex items-center justify-between gap-4">
          <span>Venda</span>
          <span className="font-medium text-foreground">{formatCurrency(data.value)}</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span>Participacao</span>
          <span className="font-medium text-foreground">{data.share.toFixed(1)}%</span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span>Atingimento</span>
          <span className={cn('font-medium', data.achievement >= 100 ? 'text-emerald-600' : data.achievement >= 80 ? 'text-amber-600' : 'text-red-600')}>
            {data.achievement.toFixed(1)}%
          </span>
        </p>
      </div>
    </div>
  );
};

const DesempenhoLojas: React.FC = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [mode, setMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [periodPreset, setPeriodPreset] = useState<ReportPeriodPreset>('this_month');
  const [selectedDay, setSelectedDay] = useState<string>(toInputDate(new Date()));
  const [fromDate, setFromDate] = useState<string>(getMonthStartInputDate());
  const [toDate, setToDate] = useState<string>(toInputDate(new Date()));
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null);

  const { data: storesData = [], isLoading: storesLoading } = useStores();

  const resolvedStoreId = useMemo(() => {
    if (storeFilter === 'all') {
      return undefined;
    }
    return resolveStoreIdentifierForReports(storeFilter, storesData);
  }, [storeFilter, storesData]);

  const selectedStore = useMemo(() => {
    if (storeFilter === 'all') {
      return null;
    }

    return storesData.find((store) => {
      const identifier = getStoreIdentifier(store);
      if (identifier === storeFilter) {
        return true;
      }

      if (resolvedStoreId === undefined) {
        return false;
      }

      return String(store.id) === String(resolvedStoreId);
    }) ?? null;
  }, [storeFilter, storesData, resolvedStoreId]);

  const filters = useMemo<ConsolidatedPerformanceFilters>(() => {
    const base: ConsolidatedPerformanceFilters = {};

    if (resolvedStoreId !== undefined) {
      base.store_id = resolvedStoreId;
    }

    if (mode === 'month') {
      base.month = selectedMonth;
      return base;
    }

    if (mode === 'period') {
      base.period = periodPreset;
      return base;
    }

    if (mode === 'day') {
      base.date = selectedDay;
      return base;
    }

    base.from = fromDate;
    base.to = toDate;
    return base;
  }, [resolvedStoreId, mode, selectedMonth, periodPreset, selectedDay, fromDate, toDate]);

  const {
    data: performanceData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useConsolidatedPerformance(filters);

  const consolidated = performanceData?.consolidated;
  const rawStores = performanceData?.stores ?? [];

  const stores = useMemo(() => {
    const totalSales = consolidated?.total_sales ?? 0;

    return rawStores.map((store) => {
      const meta = storesData.find((item) => String(item.id) === String(store.store_id));
      const baseName = meta?.name ?? `Loja ${store.store_id}`;
      const city = readStoreCity(meta);
      const displayName = city ? `${baseName} - ${city}` : baseName;
      const share = totalSales > 0 ? (store.sales.current_amount / totalSales) * 100 : 0;

      return {
        ...store,
        displayName,
        shortName: compactStoreName(displayName),
        city,
        share,
      };
    });
  }, [rawStores, storesData, consolidated?.total_sales]);

  const storesWithSales = useMemo(
    () => stores.filter((store) => store.sales.current_amount > 0).sort((a, b) => b.sales.current_amount - a.sales.current_amount),
    [stores]
  );

  const topStore = storesWithSales[0] ?? null;
  const activeStoresCount = storesWithSales.length;
  const totalStoresCount = selectedStore ? 1 : stores.length;
  const averagePerActiveStore =
    activeStoresCount > 0 && consolidated ? consolidated.total_sales / activeStoresCount : 0;

  const statusCounts = useMemo(
    () => ({
      onTrack: stores.filter((store) => store.forecast.status === 'ON_TRACK').length,
      atRisk: stores.filter((store) => store.forecast.status === 'AT_RISK').length,
      behind: stores.filter((store) => store.forecast.status === 'BEHIND').length,
    }),
    [stores]
  );

  const barChartData = useMemo(
    () =>
      storesWithSales.slice(0, 12).map((store) => ({
        name: store.shortName,
        fullName: store.displayName,
        atual: store.sales.current_amount,
        meta: store.sales.goal_amount,
        anoAnterior: store.comparison.same_period_last_year,
      })),
    [storesWithSales]
  );

  const distributionData = useMemo(() => {
    const list = storesWithSales.slice(0, 12);
    return list.map((store, index) => ({
      id: store.store_id,
      name: store.shortName,
      fullName: store.displayName,
      value: store.sales.current_amount,
      share: store.share,
      achievement: store.sales.achievement_rate,
      color: getSliceColor(index, list.length),
    }));
  }, [storesWithSales]);

  const activeSlice = activeSliceIndex !== null ? distributionData[activeSliceIndex] : null;

  const appliedPeriodLabel = useMemo(() => {
    if (mode === 'month') return formatMonthLabel(selectedMonth);
    if (mode === 'period') return PERIOD_LABELS[periodPreset];
    if (mode === 'day') return formatDateBr(selectedDay);
    return `${formatDateBr(fromDate)} ate ${formatDateBr(toDate)}`;
  }, [mode, selectedMonth, periodPreset, selectedDay, fromDate, toDate]);

  const selectedStoreLabel = useMemo(() => {
    if (!selectedStore) {
      return 'Todas as lojas';
    }
    const city = readStoreCity(selectedStore);
    return city ? `${selectedStore.name} - ${city}` : selectedStore.name;
  }, [selectedStore]);

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (toDate && value > toDate) {
      setToDate(value);
    }
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    if (fromDate && value < fromDate) {
      setFromDate(value);
    }
  };

  const handleResetFilters = () => {
    setStoreFilter('all');
    setMode('month');
    setSelectedMonth(getCurrentMonth());
    setPeriodPreset('this_month');
    setSelectedDay(toInputDate(new Date()));
    setFromDate(getMonthStartInputDate());
    setToDate(toInputDate(new Date()));
  };

  const networkGoal = consolidated?.total_goal ?? 0;
  const networkSales = consolidated?.total_sales ?? 0;
  const networkAchievement = consolidated?.total_achievement_rate ?? 0;
  const networkProjection = consolidated?.total_linear_projection ?? networkSales;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Desempenho por Loja"
        description="Painel comparativo multiloja com foco em metas, participacao e ritmo de vendas."
        icon={Store}
        actions={
          <>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Filtros de Periodicidade
                  </SheetTitle>
                  <SheetDescription>
                    Escolha loja e periodicidade para atualizar os cards, graficos e o farol de desempenho.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Loja</p>
                    <Select
                      value={storeFilter}
                      onValueChange={setStoreFilter}
                      disabled={storesLoading}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Todas as lojas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as lojas</SelectItem>
                        {storesData.map((store) => (
                          <SelectItem key={store.id} value={getStoreIdentifier(store)}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modo</p>
                    <Select value={mode} onValueChange={(value) => setMode(value as FilterMode)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Mes
                          </div>
                        </SelectItem>
                        <SelectItem value="period">
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-3.5 w-3.5" />
                            Periodo pre-definido
                          </div>
                        </SelectItem>
                        <SelectItem value="day">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            Dia especifico
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Intervalo customizado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {mode === 'month' && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mes</p>
                      <MonthPicker value={selectedMonth} onChange={setSelectedMonth} className="h-9 w-full" />
                    </div>
                  )}

                  {mode === 'period' && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Periodo</p>
                      <Select
                        value={periodPreset}
                        onValueChange={(value) => setPeriodPreset(value as ReportPeriodPreset)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {mode === 'day' && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dia</p>
                      <Input type="date" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} />
                    </div>
                  )}

                  {mode === 'custom' && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Intervalo</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" value={fromDate} onChange={(event) => handleFromDateChange(event.target.value)} />
                        <Input type="date" value={toDate} onChange={(event) => handleToDateChange(event.target.value)} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 gap-1.5"
                      onClick={() => refetch()}
                      disabled={isFetching}
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                      Atualizar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 gap-1.5"
                      onClick={handleResetFilters}
                    >
                      Resetar
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              Atualizar
            </Button>
          </>
        }
      />

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-secondary/5 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          <Badge variant="secondary" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {selectedStoreLabel}
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <CalendarRange className="h-3.5 w-3.5" />
            {appliedPeriodLabel}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Visao Super Admin
          </Badge>
          {isFetching && (
            <Badge variant="outline" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Atualizando dados
            </Badge>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-[360px] rounded-xl" />
            <Skeleton className="h-[360px] rounded-xl" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[420px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : isError ? (
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <p className="mb-2 font-semibold text-destructive">Erro ao carregar desempenho por loja</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Tente novamente em instantes.'}
            </p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center text-sm text-muted-foreground">
                      Total da rede
                      <InfoTooltip content="Soma das vendas das lojas no periodo selecionado." />
                    </p>
                    <p className="text-2xl font-bold">{formatCompactCurrency(networkSales)}</p>
                  </div>
                  <div className="rounded-full bg-primary/20 p-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center text-sm text-muted-foreground">
                      Atingimento da meta
                      <InfoTooltip content="Percentual consolidado de vendas sobre a meta da rede." />
                    </p>
                    <p className="text-2xl font-bold">{networkAchievement.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Meta: {formatCompactCurrency(networkGoal)}</p>
                  </div>
                  <StatusBadge
                    variant={networkAchievement >= 100 ? 'success' : networkAchievement >= 80 ? 'warning' : 'error'}
                    className="text-base"
                  >
                    {networkAchievement >= 100 ? 'No alvo' : networkAchievement >= 80 ? 'Atencao' : 'Atrasado'}
                  </StatusBadge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center text-sm text-muted-foreground">
                      Lojas com venda
                      <InfoTooltip content="Quantidade de lojas que registraram vendas no periodo." />
                    </p>
                    <p className="text-2xl font-bold">{activeStoresCount}</p>
                    <p className="text-xs text-muted-foreground">
                      {totalStoresCount > 0 ? `${activeStoresCount}/${totalStoresCount} lojas` : 'Sem lojas no recorte'}
                    </p>
                  </div>
                  <div className="rounded-full bg-secondary/20 p-3">
                    <Store className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center text-sm text-muted-foreground">
                      Media por loja ativa
                      <InfoTooltip content="Ticket medio de vendas por loja ativa no periodo selecionado." />
                    </p>
                    <p className="text-2xl font-bold">{formatCompactCurrency(averagePerActiveStore)}</p>
                    <p className="text-xs text-muted-foreground">
                      Projecao rede: {formatCompactCurrency(networkProjection)}
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950/40">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-dashed bg-muted/30">
            <CardContent className="grid gap-3 py-4 md:grid-cols-3">
              <div className="rounded-lg bg-background/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lider de vendas</p>
                <p className="text-sm font-medium">
                  {topStore ? `${topStore.displayName} (${formatCurrency(topStore.sales.current_amount)})` : 'Sem loja com venda'}
                </p>
              </div>
              <div className="rounded-lg bg-background/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status das lojas</p>
                <p className="text-sm font-medium">
                  {statusCounts.onTrack} no alvo, {statusCounts.atRisk} em risco, {statusCounts.behind} atrasadas
                </p>
              </div>
              <div className="rounded-lg bg-background/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Leitura rapida</p>
                <p className="text-sm font-medium">
                  Passe o mouse nos graficos para ver valores detalhados por loja e participacao.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Atual x Meta por Loja
                  <InfoTooltip content="Comparativo entre venda atual e meta no recorte filtrado." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {barChartData.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma loja com venda para o periodo selecionado.
                  </div>
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 8, right: 12, left: 4, bottom: 28 }} barCategoryGap={12}>
                        <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} height={58} tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={formatCompactCurrency} tick={{ fontSize: 11 }} width={56} />
                        <RechartsTooltip content={<SalesTooltip />} />
                        <Bar dataKey="meta" name="Meta" fill="hsl(var(--muted-foreground))" fillOpacity={0.25} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="atual" name="Atual" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-5 w-5 text-secondary" />
                  Distribuicao de Vendas
                  <InfoTooltip content="Participacao de cada loja no total vendido. Passe o mouse para detalhes." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {distributionData.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Nenhuma distribuicao disponivel para o periodo filtrado.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="relative h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={102}
                            paddingAngle={2}
                            onMouseEnter={(_, index) => setActiveSliceIndex(index)}
                            onMouseLeave={() => setActiveSliceIndex(null)}
                            animationDuration={700}
                          >
                            {distributionData.map((entry, index) => (
                              <Cell
                                key={entry.id}
                                fill={entry.color}
                                opacity={activeSliceIndex === null || activeSliceIndex === index ? 1 : 0.35}
                                stroke="hsl(var(--background))"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<DistributionTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Participacao</p>
                        <p className="text-lg font-bold">{activeSlice ? `${activeSlice.share.toFixed(1)}%` : 'Passe o mouse'}</p>
                        <p className="max-w-[160px] text-xs text-muted-foreground">
                          {activeSlice ? activeSlice.fullName : 'Selecione uma fatia para ver os detalhes.'}
                        </p>
                      </div>
                    </div>

                    <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                      {distributionData.map((entry, index) => (
                        <button
                          key={entry.id}
                          type="button"
                          onMouseEnter={() => setActiveSliceIndex(index)}
                          onMouseLeave={() => setActiveSliceIndex(null)}
                          className={cn(
                            'w-full rounded-lg border p-2 text-left transition-all',
                            activeSliceIndex === index ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="truncate text-sm font-medium">{entry.fullName}</span>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">{entry.share.toFixed(1)}%</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(entry.value)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                Farol de Lojas
                <InfoTooltip content="Visao detalhada por loja com status, meta, projeção e crescimento anual." />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Loja</th>
                      <th className="px-4 py-3 text-right font-semibold">Venda</th>
                      <th className="px-4 py-3 text-right font-semibold">Meta</th>
                      <th className="px-4 py-3 text-right font-semibold">Projecao</th>
                      <th className="px-4 py-3 text-center font-semibold">% Meta</th>
                      <th className="px-4 py-3 text-center font-semibold">YoY</th>
                      <th className="px-4 py-3 text-center font-semibold">Participacao</th>
                      <th className="px-4 py-3 text-center font-semibold">Progresso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          Sem dados para o filtro selecionado.
                        </td>
                      </tr>
                    )}

                    {stores.map((store) => (
                      <tr key={store.store_id} className="border-b transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <StatusDot
                            status={store.forecast.status}
                            tooltip={
                              store.forecast.status === 'ON_TRACK'
                                ? 'Meta deve ser atingida'
                                : store.forecast.status === 'AT_RISK'
                                  ? 'Meta em risco'
                                  : 'Meta abaixo do esperado'
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{store.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {store.city ?? 'Cidade nao informada'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(store.sales.current_amount)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(store.sales.goal_amount)}</td>
                        <td className="px-4 py-3 text-right font-medium text-secondary">{formatCurrency(store.forecast.linear_projection)}</td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge
                            variant={
                              store.sales.achievement_rate >= 100
                                ? 'success'
                                : store.sales.achievement_rate >= 80
                                  ? 'warning'
                                  : 'error'
                            }
                          >
                            {store.sales.achievement_rate.toFixed(1)}%
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold',
                              store.comparison.yoy_growth >= 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                            )}
                          >
                            {store.comparison.yoy_growth >= 0 ? '+' : ''}
                            {store.comparison.yoy_growth.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium">{store.share.toFixed(1)}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Progress value={Math.min(store.sales.achievement_rate, 100)} className="h-2" />
                            <p className="text-center text-[11px] text-muted-foreground">
                              {store.days_elapsed}/{store.days_total} dias
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Use o botao <strong>Filtros</strong> para alternar entre mes, dia, periodo pre-definido ou intervalo customizado.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Target className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  O grafico de distribuicao mostra apenas lojas com venda no recorte atual para facilitar comparacao.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DesempenhoLojas;
