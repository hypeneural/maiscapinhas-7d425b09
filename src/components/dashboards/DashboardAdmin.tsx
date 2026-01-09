/**
 * Dashboard Admin
 * 
 * Consolidated dashboard for managers and admins with
 * store performance, ranking, and cash divergences overview.
 */

import React from 'react';
import { useAdminDashboard, useRanking, useConsolidatedReport } from '@/hooks/api/use-dashboard';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Store,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Get current month in YYYY-MM format
const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

// Get store status color based on achievement
const getStoreStatus = (achievementRate: number): 'green' | 'yellow' | 'red' => {
  if (achievementRate >= 100) return 'green';
  if (achievementRate >= 80) return 'yellow';
  return 'red';
};

const statusColors = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

export const DashboardAdmin: React.FC = () => {
  const currentMonth = getCurrentMonth();

  // Fetch admin dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard({ month: currentMonth });

  // Fetch ranking
  const { data: ranking } = useRanking({ month: currentMonth, limit: 5 });

  // Fetch consolidated report (for forecasts)
  const { data: consolidated } = useConsolidatedReport(currentMonth);

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Painel de Gestão 📊</h1>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
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

  // Divergence stats (from closings)
  const pendingClosings = closingsSummary.submitted || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          Painel de Gestão 📊
        </h1>
        <p className="text-muted-foreground">
          Visão geral da rede Mais Capinhas - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vendas da Rede"
          value={`R$ ${(totalSales / 1000).toFixed(1)}k`}
          subtitle={`${totalSalesCount} vendas`}
          icon={TrendingUp}
          variant="secondary"
          trend={consolidated ? {
            value: ((projection / totalGoal) * 100) - achievementRate,
            isPositive: projection > totalGoal
          } : undefined}
        />
        <StatCard
          title="Meta da Rede"
          value={`${achievementRate.toFixed(0)}%`}
          subtitle={`de R$ ${(totalGoal / 1000).toFixed(0)}k`}
          icon={Target}
          variant={achievementRate >= 100 ? 'success' : achievementRate >= 80 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Vendedores Ativos"
          value={activeSellers}
          subtitle={ranking?.stats?.above_goal ? `${ranking.stats.above_goal} acima da meta` : undefined}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Caixas Pendentes"
          value={pendingClosings}
          subtitle={`${closingsSummary.approved} aprovados`}
          icon={AlertTriangle}
          variant={pendingClosings > 5 ? 'danger' : pendingClosings > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendedores - Ranking */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Top Vendedores do Mês
            </CardTitle>
            <Link to="/gestao/ranking">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {(ranking?.podium || topSellers.slice(0, 3)).map((item, index) => {
              const medals = ['🥇', '🥈', '🥉'];
              const seller = 'seller' in item ? item.seller : item;
              const totalSold = 'total_sold' in item ? item.total_sold : item.total;
              const storeName = 'seller' in item ? item.seller.store_name : '';

              return (
                <div
                  key={'seller_id' in item ? item.seller_id : item.seller.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-2xl">{medals[index]}</span>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-white">
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
                    {'achievement_rate' in item && (
                      <p className="text-sm text-muted-foreground">
                        {item.achievement_rate.toFixed(0)}% da meta
                      </p>
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

        {/* Farol de Lojas */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-secondary" />
              Farol de Lojas
            </CardTitle>
            <Link to="/gestao/lojas">
              <Button variant="ghost" size="sm">
                Ver detalhes
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {consolidated?.stores?.map((store) => {
              const status = getStoreStatus(store.sales.achievement_rate);
              return (
                <div key={store.store_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{store.store_name}</span>
                      <div className={cn('w-2 h-2 rounded-full', statusColors[status])} />
                    </div>
                    <span className="text-sm font-medium">
                      {store.sales.achievement_rate.toFixed(0)}%
                    </span>
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
            {salesByStore.length > 0 && !consolidated?.stores && salesByStore.map((store) => {
              // Fallback when consolidated is not available
              return (
                <div key={store.store_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{store.store_name}</span>
                    <span className="text-sm font-medium">
                      R$ {store.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{store.count} vendas</p>
                </div>
              );
            })}
            {salesByStore.length === 0 && !consolidated?.stores && (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado de lojas disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projeção de Fechamento */}
      {consolidated && (
        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Projeção de Fechamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Vendas Atuais</p>
                <p className="text-2xl font-bold">
                  R$ {(consolidated.consolidated.total_sales / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Meta da Rede</p>
                <p className="text-2xl font-bold">
                  R$ {(consolidated.consolidated.total_goal / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="text-center p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Projeção Linear</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {(consolidated.consolidated.total_linear_projection / 1000).toFixed(1)}k
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-1",
                    consolidated.consolidated.total_linear_projection >= consolidated.consolidated.total_goal
                      ? 'border-green-500 text-green-600'
                      : 'border-yellow-500 text-yellow-600'
                  )}
                >
                  {consolidated.consolidated.total_linear_projection >= consolidated.consolidated.total_goal
                    ? '✓ No caminho'
                    : '⚠ Atenção'
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
