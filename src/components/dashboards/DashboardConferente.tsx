/**
 * Dashboard Conferente
 * 
 * Dashboard for cash register reviewers with pending closings,
 * divergences, and store sales overview.
 */

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useConferenteDashboard, usePendingShifts, useDivergentShifts } from '@/hooks/api/use-dashboard';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { AnnouncementDashboardSection } from '@/components/announcements';
import {
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  DollarSign,
  Users,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const DashboardConferente: React.FC = () => {
  const { currentStore } = usePermissions();
  const storeId = currentStore?.id || 0;

  // Fetch dashboard data
  const { data, isLoading, error } = useConferenteDashboard({
    store_id: storeId,
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch pending shifts for detailed view
  const { data: pendingData } = usePendingShifts(storeId);

  // Fetch divergent shifts
  const { data: divergentData } = useDivergentShifts(storeId);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Conferência de Caixa 📝
          </h1>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
            Conferência de Caixa 📝
          </h1>
          <p className="text-destructive">
            Não foi possível carregar o dashboard. Tente novamente.
          </p>
        </div>
      </div>
    );
  }

  // Destructure data
  const {
    pending_closings,
    pending_count,
    store_sales,
    shifts_today,
    top_sellers
  } = data;

  const divergentCount = divergentData?.total_divergent || 0;
  const closedToday = shifts_today?.closed || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          Conferência de Caixa 📝
        </h1>
        <p className="text-muted-foreground">
          {currentStore?.name || 'Gerencie os envelopes e validações do dia'}
        </p>
      </div>

      {/* Announcements Section */}
      <AnnouncementDashboardSection storeId={storeId} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="A Conferir"
          value={pending_count}
          subtitle="envelopes aguardando"
          icon={Clock}
          variant={pending_count > 5 ? 'danger' : pending_count > 2 ? 'warning' : 'primary'}
        />
        <StatCard
          title="Com Divergência"
          value={divergentCount}
          subtitle="precisam de atenção"
          icon={AlertTriangle}
          variant={divergentCount > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Fechados Hoje"
          value={closedToday}
          subtitle="turnos processados"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Vendas da Loja"
          value={`R$ ${store_sales.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${store_sales.count} vendas`}
          icon={DollarSign}
          variant="secondary"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pendentes */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Envelopes Pendentes
            </CardTitle>
            <Link to="/conferencia/lancar">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pending_closings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>Todos os envelopes foram conferidos! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending_closings.slice(0, 4).map((closing) => (
                  <div
                    key={closing.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {closing.cash_shift.seller.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{closing.cash_shift.seller.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Turno {closing.cash_shift.shift_code} • {closing.cash_shift.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge
                        status={closing.status === 'submitted' ? 'pendente' : 'rascunho'}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Divergências */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Divergências Abertas
            </CardTitle>
            <Link to="/conferencia/divergencias">
              <Button variant="ghost" size="sm">
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!divergentData || divergentData.shifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
                <p>Nenhuma divergência pendente!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {divergentData.shifts.slice(0, 4).map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-sm font-medium text-destructive">
                        {shift.seller_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{shift.seller_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Turno {shift.shift_code} • {shift.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">
                        {shift.divergence < 0 ? '-' : '+'}
                        R$ {Math.abs(shift.divergence).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <StatusBadge
                        status={shift.has_justification ? 'conferido' : 'divergente'}
                        label={shift.has_justification ? 'Justificado' : 'Pendente'}
                        size="sm"
                        pulse={!shift.has_justification}
                      />
                    </div>
                  </div>
                ))}
                {divergentData.total_divergence_value !== 0 && (
                  <div className="pt-2 border-t text-right">
                    <p className="text-sm text-muted-foreground">Total divergências:</p>
                    <p className={cn(
                      "font-bold",
                      divergentData.total_divergence_value < 0 ? 'text-destructive' : 'text-green-600'
                    )}>
                      {divergentData.total_divergence_value < 0 ? '-' : '+'}
                      R$ {Math.abs(divergentData.total_divergence_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Vendedores do Dia */}
      {top_sellers && top_sellers.length > 0 && (
        <Card className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Top Vendedores do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top_sellers.slice(0, 3).map((seller, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={seller.seller_id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="text-2xl">{medals[index]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{seller.name}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {seller.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <Link to="/conferencia/lancar">
          <Button size="lg" className="gap-2 shadow-glow">
            <FileCheck className="w-5 h-5" />
            Iniciar Nova Conferência
          </Button>
        </Link>
      </div>
    </div>
  );
};
