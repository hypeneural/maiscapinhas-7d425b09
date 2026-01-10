/**
 * Dashboard Admin
 * 
 * Modernized dashboard for managers and admins with:
 * - Professional icons (no emojis)
 * - Explanatory tooltips for all metrics
 * - Interactive Recharts visualizations
 * - Clean, organized layout
 */

import React from 'react';
import { useAdminDashboard, useRanking, useConsolidatedReport } from '@/hooks/api/use-dashboard';
import { StatCard } from '@/components/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoTooltip } from '@/components/InfoTooltip';
import { TrendBadge } from '@/components/TrendBadge';
import { MedalIcon } from '@/components/MedalIcon';
import { StorePerformanceChart, GoalDistributionChart, SalesProjectionChart } from '@/components/charts';
import {
  Trophy,
  Store,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  ChevronRight,
  LayoutDashboard,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DASHBOARD_TOOLTIPS, DASHBOARD_LABELS, STATUS_COLORS } from '@/lib/dashboard.constants';
import type { ForecastStatus } from '@/types/dashboard.types';

// Get current month in YYYY-MM format
const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

// Get store status color based on achievement
const getStoreStatus = (achievementRate: number): 'green' | 'yellow' | 'red' => {
  if (achievementRate >= 100) return 'green';
  if (achievementRate >= 80) return 'yellow';
  return 'red';
};

// Get forecast status from projection
const getForecastStatus = (projection: number, goal: number): ForecastStatus => {
  const rate = (projection / goal) * 100;
  if (rate >= 100) return 'ON_TRACK';
  if (rate >= 90) return 'AT_RISK';
  return 'BEHIND';
};

export const DashboardAdmin: React.FC = () => {
  const currentMonth = getCurrentMonth();

  // Fetch admin dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard({ month: currentMonth });

  // Fetch ranking - top sellers
  const { data: ranking } = useRanking({ month: currentMonth, limit: 5 });

  // Fetch ranking - worst sellers (ascending order)
  const { data: worstRanking } = useRanking({ month: currentMonth, limit: 5, order: 'asc' });

  // Fetch consolidated report (for forecasts)
  const { data: consolidated } = useConsolidatedReport(currentMonth);

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold">{DASHBOARD_LABELS.panelTitle}</h1>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  // Fallback for missing data
  const totalSales = dashboard?.total_sales.total || 0;
  const totalSalesCount = dashboard?.total_sales.count || 0;
  const salesByStore = dashboard?.sales_by_store || [];
  const topSellers = dashboard?.top_sellers || [];
  const closingsSummary = dashboard?.closings_summary || { approved: 0, submitted: 0, draft: 0 };

  // Calculate network stats
  const totalGoal = consolidated?.consolidated.total_goal || 0;
  const achievementRate = totalGoal > 0 ? (totalSales / totalGoal) * 100 : 0;
  const projection = consolidated?.consolidated.total_linear_projection || 0;

  // Calculate active sellers from ranking
  const activeSellers = ranking?.stats?.total_sellers || topSellers.length;
  const aboveGoal = ranking?.stats?.above_goal || 0;
  const belowGoal = activeSellers - aboveGoal;
  const averageAchievement = ranking?.stats?.average_achievement || 0;

  // Divergence stats (from closings)
  const pendingClosings = closingsSummary.submitted || 0;

  // Get days info from first store in consolidated
  const daysElapsed = consolidated?.stores?.[0]?.days_elapsed || new Date().getDate();
  const daysTotal = consolidated?.stores?.[0]?.days_total || 31;

  // Prepare store data for chart
  const storeChartData = consolidated?.stores?.map((store) => ({
    store_id: store.store_id,
    store_name: store.store_name,
    current_amount: store.sales.current_amount,
    goal_amount: store.sales.goal_amount,
    achievement_rate: store.sales.achievement_rate,
  })) || [];

  // Calculate forecast status
  const forecastStatus = getForecastStatus(projection, totalGoal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutDashboard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">
            {DASHBOARD_LABELS.panelTitle}
          </h1>
          <p className="text-muted-foreground">
            Visão geral da rede Mais Capinhas - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <StatCard
            title={DASHBOARD_LABELS.networkSales}
            value={`R$ ${(totalSales / 1000).toFixed(1)}k`}
            subtitle={`${totalSalesCount} vendas`}
            icon={TrendingUp}
            variant="secondary"
            trend={consolidated ? {
              value: ((projection / totalGoal) * 100) - achievementRate,
              isPositive: projection > totalGoal
            } : undefined}
          />
          <div className="absolute top-3 right-3">
            <InfoTooltip content={DASHBOARD_TOOLTIPS.networkSales} />
          </div>
        </div>

        <div className="relative">
          <StatCard
            title={DASHBOARD_LABELS.networkGoal}
            value={`${achievementRate.toFixed(0)}%`}
            subtitle={`de R$ ${(totalGoal / 1000).toFixed(0)}k`}
            icon={Target}
            variant={achievementRate >= 100 ? 'success' : achievementRate >= 80 ? 'warning' : 'danger'}
          />
          <div className="absolute top-3 right-3">
            <InfoTooltip content={DASHBOARD_TOOLTIPS.networkGoal} />
          </div>
        </div>

        <div className="relative">
          <StatCard
            title={DASHBOARD_LABELS.activeSellers}
            value={activeSellers}
            subtitle={aboveGoal > 0 ? `${aboveGoal} acima da meta` : undefined}
            icon={Users}
            variant="default"
          />
          <div className="absolute top-3 right-3">
            <InfoTooltip content={DASHBOARD_TOOLTIPS.activeSellers} />
          </div>
        </div>

        <div className="relative">
          <StatCard
            title={DASHBOARD_LABELS.pendingCash}
            value={pendingClosings}
            subtitle={`${closingsSummary.approved} aprovados`}
            icon={pendingClosings > 5 ? AlertTriangle : pendingClosings > 0 ? Clock : CheckCircle}
            variant={pendingClosings > 5 ? 'danger' : pendingClosings > 0 ? 'warning' : 'success'}
          />
          <div className="absolute top-3 right-3">
            <InfoTooltip content={DASHBOARD_TOOLTIPS.pendingCash} />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendedores - Ranking */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-5 h-5 text-accent" />
              {DASHBOARD_LABELS.topSellers}
              <InfoTooltip content={DASHBOARD_TOOLTIPS.totalSold} />
            </CardTitle>
            <Link to="/gestao/ranking">
              <Button variant="ghost" size="sm">
                {DASHBOARD_LABELS.viewAll}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {(ranking?.podium || topSellers.slice(0, 3)).map((item, index) => {
              const position = (index + 1) as 1 | 2 | 3;
              const seller = 'seller' in item ? item.seller : item;
              const totalSold = 'total_sold' in item ? item.total_sold : item.total;
              const storeName = 'seller' in item ? item.seller.store_name : '';
              const achievementRateItem = 'achievement_rate' in item ? item.achievement_rate : null;

              return (
                <div
                  key={'seller_id' in item ? item.seller_id : item.seller.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <MedalIcon position={position} size="md" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-white">
                    {('name' in seller ? seller.name : seller.name).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {'name' in seller ? seller.name : seller.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {storeName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      R$ {totalSold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {achievementRateItem !== null && (
                      <InfoTooltip content={DASHBOARD_TOOLTIPS.achievementRate}>
                        <p className={cn(
                          "text-sm font-medium",
                          achievementRateItem >= 100 ? "text-green-600" :
                            achievementRateItem >= 80 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {achievementRateItem.toFixed(0)}% da meta
                        </p>
                      </InfoTooltip>
                    )}
                  </div>
                </div>
              );
            })}
            {topSellers.length === 0 && !ranking?.podium && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado de ranking disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Piores Vendedores - Bottom Ranking */}
        <Card className="animate-fade-in border-red-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Piores do Mês
              <InfoTooltip content="Os 5 vendedores com menor volume de vendas no mês atual. Acompanhe para identificar necessidades de treinamento ou suporte." />
            </CardTitle>
            <Link to="/gestao/ranking">
              <Button variant="ghost" size="sm">
                {DASHBOARD_LABELS.viewAll}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {worstRanking?.ranking?.slice(0, 5).map((item, index) => {
              const position = index + 1;
              return (
                <div
                  key={item.seller.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm">
                    {position}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-sm font-bold text-white">
                    {item.seller.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {item.seller.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.seller.store_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-red-600 dark:text-red-400">
                      R$ {item.total_sold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm font-medium text-red-500">
                      {item.achievement_rate.toFixed(0)}% da meta
                    </p>
                  </div>
                </div>
              );
            })}
            {(!worstRanking?.ranking || worstRanking.ranking.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goal Distribution Chart */}
      {ranking?.stats && (
        <GoalDistributionChart
          aboveGoal={aboveGoal}
          belowGoal={belowGoal}
          averageAchievement={averageAchievement}
          className="animate-fade-in"
        />
      )}

      {/* Store Performance Chart */}
      {storeChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StorePerformanceChart stores={storeChartData} className="animate-fade-in" />

          {/* Farol de Lojas - Compact List */}
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="w-5 h-5 text-secondary" />
                {DASHBOARD_LABELS.storeBeacon}
                <InfoTooltip content="Status de cada loja em relação à meta mensal" />
              </CardTitle>
              <Link to="/gestao/lojas">
                <Button variant="ghost" size="sm">
                  {DASHBOARD_LABELS.viewDetails}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {consolidated?.stores?.map((store) => {
                const status = getStoreStatus(store.sales.achievement_rate);
                const statusConfig = STATUS_COLORS[status];

                return (
                  <div key={store.store_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', statusConfig.bg)} />
                        <span className="font-medium truncate">{store.store_name}</span>
                      </div>
                      <InfoTooltip content={DASHBOARD_TOOLTIPS.storeStatus[status]}>
                        <span className={cn("text-sm font-semibold", statusConfig.text)}>
                          {store.sales.achievement_rate.toFixed(0)}%
                        </span>
                      </InfoTooltip>
                    </div>
                    <Progress
                      value={Math.min(store.sales.achievement_rate, 100)}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        R$ {store.sales.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span>
                        Meta: R$ {store.sales.goal_amount.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!consolidated?.stores && salesByStore.length > 0 && salesByStore.map((store) => (
                <div key={store.store_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{store.store_name}</span>
                    <span className="text-sm font-medium">
                      R$ {store.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{store.count} vendas</p>
                </div>
              ))}
              {salesByStore.length === 0 && !consolidated?.stores && (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado de lojas disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projeção de Fechamento */}
      {consolidated && (
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
    </div>
  );
};
