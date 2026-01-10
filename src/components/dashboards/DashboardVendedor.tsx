/**
 * Dashboard Vendedor
 * 
 * Personal dashboard for sellers with real-time sales,
 * bonus gamification, commission projection, and daily pace.
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSellerDashboard } from '@/hooks/api/use-dashboard';
import { GaugeChart } from '@/components/GaugeChart';
import { CountdownTimer } from '@/components/CountdownTimer';
import { BonusProgress } from '@/components/BonusProgress';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  TrendingUp,
  Target,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardVendedor: React.FC = () => {
  const { user } = useAuth();
  const { currentStore } = usePermissions();

  // Fetch dashboard data from API
  const { data, isLoading, error } = useSellerDashboard({
    store_id: currentStore?.id || 0,
    date: new Date().toISOString().split('T')[0],
  });

  // Fim do turno (18h de hoje)
  const fimTurno = new Date();
  fimTurno.setHours(18, 0, 0, 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">
              Olá, {user?.name?.split(' ')[0] || 'Vendedor'}! 👋
            </h1>
            <p className="text-muted-foreground">Carregando seus dados...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Olá, {user?.name?.split(' ')[0] || 'Vendedor'}! 👋
          </h1>
          <p className="text-muted-foreground text-destructive">
            Não foi possível carregar o dashboard. Tente novamente.
          </p>
        </div>
      </div>
    );
  }

  // Destructure dashboard data
  const {
    my_sales,
    bonus_gamification,
    monthly_commission,
    daily_pace
  } = data;

  // Pace icon based on status
  const PaceIcon = daily_pace.status === 'AHEAD'
    ? ArrowUpRight
    : daily_pace.status === 'BEHIND'
      ? ArrowDownRight
      : Minus;

  const paceColor = daily_pace.status === 'AHEAD'
    ? 'text-green-600'
    : daily_pace.status === 'BEHIND'
      ? 'text-red-600'
      : 'text-yellow-600';

  // Commission tier display
  const tierBadgeColor = monthly_commission.current_tier >= 4
    ? 'bg-green-500'
    : monthly_commission.current_tier >= 3
      ? 'bg-blue-500'
      : monthly_commission.current_tier >= 2
        ? 'bg-yellow-500'
        : 'bg-gray-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Olá, {user?.name?.split(' ')[0] || 'Vendedor'}! 👋
          </h1>
          <p className="text-muted-foreground">
            {bonus_gamification.message || 'Vamos bater a meta hoje? Você consegue!'}
          </p>
        </div>
        <CountdownTimer endTime={fimTurno} />
      </div>

      {/* Gauge Central - Vendas do Dia */}
      <div className="bg-card rounded-2xl border p-6 shadow-lg animate-fade-in">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold">Performance do Dia</h2>
          <p className="text-sm text-muted-foreground">
            {currentStore?.name || 'Sua loja'}
          </p>
        </div>
        <div className="flex justify-center">
          <GaugeChart
            value={my_sales.total}
            max={daily_pace.average_daily_sales || my_sales.total * 1.5}
            label="da meta diária"
            size="lg"
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-2xl font-display font-bold text-secondary">
            R$ {my_sales.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            {my_sales.count} vendas hoje
          </p>
        </div>
      </div>

      {/* Próximo Bônus - Gamificação */}
      {bonus_gamification.next_bonus_goal && (
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <BonusProgress
            valorVendido={bonus_gamification.current_amount}
            proximaFaixa={bonus_gamification.next_bonus_goal}
            valorBonus={bonus_gamification.next_bonus_value || 0}
          />
        </div>
      )}

      {/* Pace Diário */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Ritmo Diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                R$ {daily_pace.today_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">
                Média: R$ {daily_pace.average_daily_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PaceIcon className={cn('w-6 h-6', paceColor)} />
              <div className="text-right">
                <p className={cn('text-lg font-bold', paceColor)}>
                  {daily_pace.today_vs_average >= 0 ? '+' : ''}
                  {((daily_pace.today_vs_average / daily_pace.average_daily_sales) * 100).toFixed(0)}%
                </p>
                <Badge variant="outline" className="text-xs">
                  {daily_pace.status === 'AHEAD' ? 'Acima' : daily_pace.status === 'BEHIND' ? 'Abaixo' : 'Na média'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vendas do Mês"
          value={`R$ ${monthly_commission.sales_mtd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          variant="secondary"
          trend={{
            value: monthly_commission.projected_achievement - monthly_commission.achievement_rate,
            isPositive: monthly_commission.projected_achievement > monthly_commission.achievement_rate
          }}
        />
        <StatCard
          title="Meta Mensal"
          value={`${monthly_commission.achievement_rate.toFixed(0)}%`}
          subtitle={`de R$ ${monthly_commission.goal_amount.toLocaleString('pt-BR')}`}
          icon={Target}
          variant={
            monthly_commission.achievement_rate >= 100
              ? 'success'
              : monthly_commission.achievement_rate >= 80
                ? 'warning'
                : 'danger'
          }
        />
        <StatCard
          title="Comissão Atual"
          value={`R$ ${monthly_commission.current_commission_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`Tier ${monthly_commission.current_tier}%`}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Dias Trabalhados"
          value={monthly_commission.days_elapsed}
          subtitle={`de ${monthly_commission.days_total} dias`}
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Projeção de Comissão */}
      {monthly_commission.potential_commission > monthly_commission.current_commission_value && (
        <Card className="border-primary/30 bg-primary/5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Se mantiver o ritmo:</p>
                <p className="text-xl font-bold text-primary">
                  R$ {monthly_commission.potential_commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Projeção tier {monthly_commission.projected_tier}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Faltam para próximo tier:</p>
                <p className="text-lg font-bold">
                  R$ {monthly_commission.gap_to_next_tier.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
