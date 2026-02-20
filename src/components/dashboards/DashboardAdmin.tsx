/**
 * Dashboard Admin
 *
 * Super admin dashboard with top-level filters and visual KPIs.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAdminDashboard, useConsolidatedReport, useRanking } from '@/hooks/api/use-dashboard';
import { useStores } from '@/hooks/api/use-stores';
import { getStoreIdentifier, resolveStoreIdentifierForReports } from '@/lib/store-identifiers';
import { MonthPicker } from '@/components/MonthPicker';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoTooltip } from '@/components/InfoTooltip';
import { MedalIcon } from '@/components/MedalIcon';
import { StorePerformanceChart, GoalDistributionChart, SalesProjectionChart } from '@/components/charts';
import { AnnouncementDashboardSection } from '@/components/announcements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  AlertTriangle,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Filter,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Store,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DASHBOARD_TOOLTIPS, DASHBOARD_LABELS, STATUS_COLORS } from '@/lib/dashboard.constants';
import type {
  AdminDashboardParams,
  ConsolidatedReportParams,
  ForecastStatus,
  ReportPeriodPreset,
} from '@/types/dashboard.types';

type DashboardFilterMode = 'month' | 'period' | 'day' | 'custom';

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

const toInputDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getMonthStartInputDate = () => {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
};

const formatDateBr = (value: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
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

const getStoreStatus = (achievementRate: number): 'green' | 'yellow' | 'red' => {
  if (achievementRate >= 100) return 'green';
  if (achievementRate >= 80) return 'yellow';
  return 'red';
};

const getForecastStatus = (projection: number, goal: number): ForecastStatus => {
  if (goal <= 0) {
    return 'AT_RISK';
  }

  const rate = (projection / goal) * 100;
  if (rate >= 100) return 'ON_TRACK';
  if (rate >= 90) return 'AT_RISK';
  return 'BEHIND';
};

export const DashboardAdmin: React.FC = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [mode, setMode] = useState<DashboardFilterMode>('month');
  const [month, setMonth] = useState<string>(getCurrentMonth());
  const [periodPreset, setPeriodPreset] = useState<ReportPeriodPreset>('this_month');
  const [dayDate, setDayDate] = useState<string>(toInputDate(new Date()));
  const [fromDate, setFromDate] = useState<string>(getMonthStartInputDate());
  const [toDate, setToDate] = useState<string>(toInputDate(new Date()));

  const { data: stores = [], isLoading: storesLoading } = useStores();

  useEffect(() => {
    if (storeFilter === 'all' || stores.length === 0) {
      return;
    }

    const matchByNumericId = stores.find((store) => String(store.id) === storeFilter);
    if (!matchByNumericId) {
      return;
    }

    const normalizedIdentifier = getStoreIdentifier(matchByNumericId);
    if (normalizedIdentifier !== storeFilter) {
      setStoreFilter(normalizedIdentifier);
    }
  }, [storeFilter, stores]);

  const resolvedStoreId = useMemo(() => {
    if (storeFilter === 'all') {
      return undefined;
    }
    return resolveStoreIdentifierForReports(storeFilter, stores);
  }, [storeFilter, stores]);

  const selectedStore = useMemo(() => {
    if (storeFilter === 'all') {
      return null;
    }

    return stores.find((store) => {
      const identifier = getStoreIdentifier(store);
      if (identifier === storeFilter) {
        return true;
      }

      if (resolvedStoreId === undefined) {
        return false;
      }

      return String(store.id) === String(resolvedStoreId);
    }) ?? null;
  }, [resolvedStoreId, storeFilter, stores]);

  const dashboardFilters = useMemo<AdminDashboardParams>(() => {
    const base: AdminDashboardParams = {};

    if (resolvedStoreId !== undefined) {
      base.store_id = resolvedStoreId;
    }

    if (mode === 'month') {
      base.month = month;
      return base;
    }

    if (mode === 'period') {
      base.period = periodPreset;
      return base;
    }

    if (mode === 'day') {
      base.date = dayDate;
      return base;
    }

    base.from = fromDate;
    base.to = toDate;
    return base;
  }, [resolvedStoreId, mode, month, periodPreset, dayDate, fromDate, toDate]);

  const rankingFilters = useMemo(
    () => ({ ...dashboardFilters, limit: 5, order: 'desc' as const }),
    [dashboardFilters]
  );

  const worstRankingFilters = useMemo(
    () => ({ ...dashboardFilters, limit: 5, order: 'asc' as const }),
    [dashboardFilters]
  );

  const consolidatedFilters = useMemo<ConsolidatedReportParams>(
    () => ({ ...dashboardFilters }),
    [dashboardFilters]
  );

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
    refetch: refetchDashboard,
  } = useAdminDashboard(dashboardFilters);

  const {
    data: ranking,
    isFetching: rankingFetching,
    refetch: refetchRanking,
  } = useRanking(rankingFilters);

  const {
    data: worstRanking,
    isFetching: worstRankingFetching,
    refetch: refetchWorstRanking,
  } = useRanking(worstRankingFilters);

  const {
    data: consolidated,
    isFetching: consolidatedFetching,
    refetch: refetchConsolidated,
  } = useConsolidatedReport(consolidatedFilters);

  const isRefreshing = dashboardFetching || rankingFetching || worstRankingFetching || consolidatedFetching;
  const isInitialLoading = dashboardLoading && !dashboard;

  const handleManualRefresh = async () => {
    await Promise.all([
      refetchDashboard(),
      refetchRanking(),
      refetchWorstRanking(),
      refetchConsolidated(),
    ]);
  };

  const handleResetFilters = () => {
    setStoreFilter('all');
    setMode('month');
    setMonth(getCurrentMonth());
    setPeriodPreset('this_month');
    setDayDate(toInputDate(new Date()));
    setFromDate(getMonthStartInputDate());
    setToDate(toInputDate(new Date()));
  };

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

  const appliedPeriodLabel = useMemo(() => {
    if (mode === 'month') {
      return formatMonthLabel(month);
    }
    if (mode === 'period') {
      return PERIOD_LABELS[periodPreset];
    }
    if (mode === 'day') {
      return formatDateBr(dayDate);
    }
    return `${formatDateBr(fromDate)} ate ${formatDateBr(toDate)}`;
  }, [mode, month, periodPreset, dayDate, fromDate, toDate]);

  const selectedStoreLabel = useMemo(() => {
    if (!selectedStore) {
      return 'Todas as lojas';
    }

    const city = readStoreCity(selectedStore);
    if (city) {
      return `${selectedStore.name} - ${city}`;
    }

    return selectedStore.name;
  }, [selectedStore]);

  const totalSales = dashboard?.total_sales.total ?? 0;
  const totalSalesCount = dashboard?.total_sales.count ?? 0;
  const salesByStore = dashboard?.sales_by_store ?? [];
  const closingsSummary = dashboard?.closings_summary ?? { approved: 0, submitted: 0, draft: 0 };
  const consolidatedStores = consolidated?.stores ?? [];
  const storesWithSales = useMemo(
    () =>
      consolidatedStores
        .filter((store) => store.sales.current_amount > 0)
        .sort((a, b) => b.sales.current_amount - a.sales.current_amount),
    [consolidatedStores]
  );
  const storesForBeacon = storesWithSales.slice(0, 12);
  const storesWithSalesCount = storesWithSales.length;
  const totalStoresCount = selectedStore ? 1 : Math.max(stores.length, consolidatedStores.length);
  const averageTicket = totalSalesCount > 0 ? totalSales / totalSalesCount : 0;

  const totalGoal = consolidated?.consolidated.total_goal ?? 0;
  const totalProjection = consolidated?.consolidated.total_linear_projection ?? totalSales;
  const totalAchievementRate =
    consolidated?.consolidated.total_achievement_rate ??
    (totalGoal > 0 ? (totalSales / totalGoal) * 100 : 0);

  const activeSellers = ranking?.stats.total_sellers ?? dashboard?.top_sellers.length ?? 0;
  const salesPerSeller = activeSellers > 0 ? totalSales / activeSellers : 0;
  const aboveGoal = ranking?.stats.above_goal ?? 0;
  const belowGoal = ranking?.stats.below_goal ?? Math.max(activeSellers - aboveGoal, 0);
  const averageAchievement = ranking?.stats.average_achievement ?? 0;
  const yoySeries = consolidatedStores
    .map((store) => store.comparison?.yoy_growth)
    .filter((value): value is number => Number.isFinite(value));
  const avgYoy = yoySeries.length > 0 ? yoySeries.reduce((acc, value) => acc + value, 0) / yoySeries.length : null;

  const bestRankingEntries = useMemo(() => {
    const merged = [...(ranking?.podium ?? []), ...(ranking?.ranking ?? [])];
    const deduped = new Map<number, (typeof merged)[number]>();

    for (const entry of merged) {
      const existing = deduped.get(entry.seller.id);
      if (!existing || existing.position > entry.position) {
        deduped.set(entry.seller.id, entry);
      }
    }

    return Array.from(deduped.values()).sort((a, b) => a.position - b.position).slice(0, 5);
  }, [ranking]);

  const worstRankingEntries = useMemo(() => {
    const merged = [...(worstRanking?.podium ?? []), ...(worstRanking?.ranking ?? [])];
    if (merged.length === 0) {
      return [...bestRankingEntries].sort((a, b) => a.total_sold - b.total_sold).slice(0, 5);
    }
    return merged.sort((a, b) => a.total_sold - b.total_sold).slice(0, 5);
  }, [bestRankingEntries, worstRanking]);

  const storeChartData = consolidated?.stores?.map((store) => ({
    store_id: store.store_id,
    store_name: store.store_name,
    current_amount: store.sales.current_amount,
    goal_amount: store.sales.goal_amount,
    achievement_rate: store.sales.achievement_rate,
  })) ?? [];

  const focusStore = useMemo(() => {
    const storesInScope = storesWithSales.length > 0 ? storesWithSales : consolidatedStores;
    if (storesInScope.length === 0) {
      return null;
    }
    return [...storesInScope].sort((a, b) => a.sales.achievement_rate - b.sales.achievement_rate)[0];
  }, [storesWithSales, consolidatedStores]);

  const daysElapsed =
    consolidated?.stores?.find((store) => typeof store.days_elapsed === 'number')?.days_elapsed ??
    new Date().getDate();
  const daysTotal =
    consolidated?.stores?.find((store) => typeof store.days_total === 'number')?.days_total ?? 31;

  const forecastStatus = getForecastStatus(totalProjection, totalGoal);
  const projectionGap = totalProjection - totalGoal;
  const remainingToGoal = Math.max(0, totalGoal - totalSales);
  const yoyTrendLabel =
    avgYoy === null
      ? 'Sem comparativo anual'
      : `${avgYoy >= 0 ? '+' : ''}${avgYoy.toFixed(1)}% vs ano anterior`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{DASHBOARD_LABELS.panelTitle}</h1>
            <p className="text-sm text-muted-foreground">
              Visao executiva da rede. Periodo aplicado: <span className="font-medium text-foreground">{appliedPeriodLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Filtros da Dashboard
                </SheetTitle>
                <SheetDescription>
                  Ajuste loja e periodo para atualizar indicadores, rankings e graficos do painel super admin.
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
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={getStoreIdentifier(store)}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modo</p>
                  <Select value={mode} onValueChange={(value) => setMode(value as DashboardFilterMode)}>
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
                    <MonthPicker value={month} onChange={setMonth} className="h-9 w-full" />
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
                    <Input type="date" value={dayDate} onChange={(event) => setDayDate(event.target.value)} />
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
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                    Atualizar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 gap-1.5"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Resetar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Atualizar
          </Button>

          <Badge variant="outline" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            {selectedStoreLabel}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            {appliedPeriodLabel}
          </Badge>
          {isRefreshing && (
            <Badge variant="secondary" className="gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Atualizando
            </Badge>
          )}
        </div>
      </div>

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
          {dashboard?.filters?.timezone && (
            <Badge variant="secondary" className="gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {dashboard.filters.timezone}
            </Badge>
          )}
          {dashboard?.filters?.mode && (
            <Badge variant="outline" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Modo API: {dashboard.filters.mode}
            </Badge>
          )}
        </CardContent>
      </Card>

      <AnnouncementDashboardSection />

      {isInitialLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <Card className="border-dashed bg-muted/30">
            <CardContent className="grid gap-3 py-4 md:grid-cols-3">
              <div className="flex items-start gap-3 rounded-lg bg-background/70 p-3">
                <TrendingUp className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ritmo projetado</p>
                  <p className="text-sm font-medium">
                    {projectionGap >= 0 ? 'Projecao acima da meta' : 'Projecao abaixo da meta'} ({formatCurrency(Math.abs(projectionGap))})
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-background/70 p-3">
                <Store className="mt-0.5 h-4 w-4 text-secondary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Loja foco</p>
                  <p className="text-sm font-medium">
                    {focusStore
                      ? `${focusStore.store_name} (${focusStore.sales.achievement_rate.toFixed(0)}%)`
                      : 'Sem dados suficientes para destaque'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-background/70 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conferencia de caixa</p>
                  <p className="text-sm font-medium">
                    {closingsSummary.submitted > 0
                      ? `${closingsSummary.submitted} caixa(s) aguardando aprovacao`
                      : 'Sem pendencias de caixa no periodo'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <StatCard
                title={DASHBOARD_LABELS.networkSales}
                value={formatCompactCurrency(totalSales)}
                subtitle={`${totalSalesCount} vendas`}
                icon={TrendingUp}
                variant="secondary"
              />
              <div className="absolute right-3 top-3">
                <InfoTooltip content={DASHBOARD_TOOLTIPS.networkSales} />
              </div>
            </div>

            <div className="relative">
              <StatCard
                title={DASHBOARD_LABELS.networkGoal}
                value={totalGoal > 0 ? `${totalAchievementRate.toFixed(0)}%` : 'Sem meta'}
                subtitle={totalGoal > 0 ? `Meta: ${formatCompactCurrency(totalGoal)}` : 'Cadastre metas para habilitar comparacao'}
                icon={Target}
                variant={totalAchievementRate >= 100 ? 'success' : totalAchievementRate >= 80 ? 'warning' : 'danger'}
              />
              <div className="absolute right-3 top-3">
                <InfoTooltip content={DASHBOARD_TOOLTIPS.networkGoal} />
              </div>
            </div>

            <div className="relative">
              <StatCard
                title={DASHBOARD_LABELS.activeSellers}
                value={activeSellers}
                subtitle={`${aboveGoal} acima da meta`}
                icon={Users}
                variant="default"
              />
              <div className="absolute right-3 top-3">
                <InfoTooltip content={DASHBOARD_TOOLTIPS.activeSellers} />
              </div>
            </div>

            <div className="relative">
              <StatCard
                title={DASHBOARD_LABELS.pendingCash}
                value={closingsSummary.submitted}
                subtitle={`${closingsSummary.approved} aprovados`}
                icon={closingsSummary.submitted > 0 ? AlertTriangle : CheckCircle2}
                variant={closingsSummary.submitted > 0 ? 'warning' : 'success'}
              />
              <div className="absolute right-3 top-3">
                <InfoTooltip content={DASHBOARD_TOOLTIPS.pendingCash} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="animate-fade-in border-border/60">
              <CardContent className="space-y-1 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ticket medio</p>
                <p className="text-xl font-bold">{formatCurrency(averageTicket)}</p>
                <p className="text-xs text-muted-foreground">{totalSalesCount} vendas no periodo</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-border/60">
              <CardContent className="space-y-1 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Venda por vendedor</p>
                <p className="text-xl font-bold">{formatCurrency(salesPerSeller)}</p>
                <p className="text-xs text-muted-foreground">{activeSellers} vendedor(es) com movimentacao</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-border/60">
              <CardContent className="space-y-1 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lojas com venda</p>
                <p className="text-xl font-bold">{storesWithSalesCount}</p>
                <p className="text-xs text-muted-foreground">
                  {totalStoresCount > 0 ? `${storesWithSalesCount}/${totalStoresCount} lojas ativas` : 'Sem lojas no periodo'}
                </p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-border/60">
              <CardContent className="space-y-1 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comparativo anual</p>
                <p className={cn('text-xl font-bold', avgYoy !== null && avgYoy >= 0 ? 'text-emerald-600' : 'text-amber-600')}>
                  {yoyTrendLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {remainingToGoal > 0 ? `Falta ${formatCurrency(remainingToGoal)} para meta` : 'Meta total atingida'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {DASHBOARD_LABELS.topSellers}
                  <InfoTooltip content={DASHBOARD_TOOLTIPS.totalSold} />
                </CardTitle>
                <Link to="/gestao/ranking">
                  <Button variant="ghost" size="sm">
                    {DASHBOARD_LABELS.viewAll}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {bestRankingEntries.map((entry) => {
                  const position = entry.position;
                  const medalPosition = position <= 3 ? (position as 1 | 2 | 3) : null;
                  const achievementClass =
                    entry.achievement_rate >= 100
                      ? 'text-green-600'
                      : entry.achievement_rate >= 80
                        ? 'text-amber-600'
                        : 'text-red-600';

                  return (
                    <div
                      key={`${entry.seller.id}-${entry.position}`}
                      className="flex items-center gap-4 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted/70"
                    >
                      {medalPosition ? (
                        <MedalIcon position={medalPosition} size="md" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {position}
                        </div>
                      )}

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                        {entry.seller.name.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{entry.seller.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{entry.seller.store_name}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-bold">{formatCurrency(entry.total_sold)}</p>
                        <p className={cn('text-xs font-semibold', achievementClass)}>
                          {entry.achievement_rate.toFixed(0)}% da meta
                        </p>
                      </div>
                    </div>
                  );
                })}

                {bestRankingEntries.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    <p>Nenhum vendedor encontrado para o filtro aplicado.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-red-200/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Desempenho em atencao
                  <InfoTooltip content="Lista dos vendedores com menor volume no periodo filtrado." />
                </CardTitle>
                <Link to="/gestao/ranking">
                  <Button variant="ghost" size="sm">
                    {DASHBOARD_LABELS.viewAll}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {worstRankingEntries.map((entry, index) => (
                  <div
                    key={`${entry.seller.id}-${entry.position}-worst`}
                    className="flex items-center gap-4 rounded-lg border border-red-200/50 bg-red-50/50 p-3 transition-colors hover:bg-red-100/50 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      {index + 1}
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-sm font-bold text-white">
                      {entry.seller.name.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{entry.seller.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{entry.seller.store_name}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(entry.total_sold)}
                      </p>
                      <p className="text-xs font-semibold text-red-500">
                        {entry.achievement_rate.toFixed(0)}% da meta
                      </p>
                    </div>
                  </div>
                ))}

                {worstRankingEntries.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-10 w-10 opacity-50" />
                    <p>Sem dados para listar desempenho em atencao.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {activeSellers > 0 && (
            <GoalDistributionChart
              aboveGoal={aboveGoal}
              belowGoal={belowGoal}
              averageAchievement={averageAchievement}
              className="animate-fade-in"
            />
          )}

          {storeChartData.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <StorePerformanceChart stores={storeChartData} className="animate-fade-in" />

              <Card className="animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Store className="h-5 w-5 text-secondary" />
                    {DASHBOARD_LABELS.storeBeacon}
                    <InfoTooltip content="Status das lojas por atingimento de meta no filtro atual." />
                  </CardTitle>
                  <Link to="/gestao/desempenho-lojas">
                    <Button variant="ghost" size="sm">
                      {DASHBOARD_LABELS.viewDetails}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {storesForBeacon.map((store) => {
                    const status = getStoreStatus(store.sales.achievement_rate);
                    const statusStyles = STATUS_COLORS[status];

                    return (
                      <div key={store.store_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className={cn('h-2 w-2 rounded-full', statusStyles.bg)} />
                            <span className="truncate font-medium">{store.store_name}</span>
                          </div>
                          <span className={cn('text-sm font-semibold', statusStyles.text)}>
                            {store.sales.achievement_rate.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={Math.min(store.sales.achievement_rate, 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(store.sales.current_amount)}</span>
                          <span>Meta: {formatCurrency(store.sales.goal_amount)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {storesForBeacon.length === 0 &&
                    salesByStore
                      .filter((store) => store.total > 0)
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 12)
                      .map((store) => (
                        <div key={store.store_id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{store.store_name}</span>
                            <span className="text-sm font-semibold">{formatCurrency(store.total)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{store.count} vendas</p>
                        </div>
                      ))}

                  {storesForBeacon.length === 0 && salesByStore.filter((store) => store.total > 0).length === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Nenhuma loja com venda para o periodo selecionado.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="animate-fade-in">
              <CardContent className="py-10 text-center">
                <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                <p className="font-medium">Sem dados consolidados para o filtro aplicado</p>
                <p className="text-sm text-muted-foreground">
                  Tente ampliar o periodo ou trocar a loja para visualizar desempenho comparativo.
                </p>
              </CardContent>
            </Card>
          )}

          {consolidated && totalGoal > 0 && (
            <SalesProjectionChart
              currentSales={consolidated.consolidated.total_sales}
              goalAmount={consolidated.consolidated.total_goal}
              linearProjection={consolidated.consolidated.total_linear_projection}
              daysElapsed={daysElapsed}
              daysTotal={daysTotal}
              status={forecastStatus}
              className="animate-fade-in"
            />
          )}
        </>
      )}
    </div>
  );
};

export default DashboardAdmin;
