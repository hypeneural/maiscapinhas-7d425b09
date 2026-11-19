import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, CheckCircle2, XCircle, Clock, Filter, Info, AlertCircle, Percent, FileText, ClipboardCheck, Store, ChevronRight, ArrowUpDown, Building2, Minus, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { MonthPicker } from '@/components/MonthPicker';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCashIntegrity, useGlobalCashIntegrity } from '@/hooks/api/use-reports';
import { useStores } from '@/hooks/api/use-stores';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';
import type { StoreIntegritySummary } from '@/types/api';

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Format currency
const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// Helper component for info tooltips
const InfoTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-4 h-4 text-muted-foreground cursor-help ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-sm">{children}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Get alert icon based on type
const getAlertIcon = (type: 'CRITICAL' | 'WARNING' | 'INFO') => {
  switch (type) {
    case 'CRITICAL':
      return <XCircle className="w-5 h-5 text-destructive" />;
    case 'WARNING':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'INFO':
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

// Get risk level from percentage
const getRiskLabel = (percentage: number): string => {
  if (percentage <= 2) return 'Baixo';
  if (percentage <= 5) return 'Médio';
  return 'Alto';
};

const getStatusColor = (status: 'GREEN' | 'YELLOW' | 'RED') => {
  switch (status) {
    case 'GREEN': return 'text-green-600';
    case 'YELLOW': return 'text-yellow-600';
    case 'RED': return 'text-red-600';
  }
};

const getStatusBg = (status: 'GREEN' | 'YELLOW' | 'RED') => {
  switch (status) {
    case 'GREEN': return 'bg-green-500/20';
    case 'YELLOW': return 'bg-yellow-500/20';
    case 'RED': return 'bg-red-500/20';
  }
};

// Trend indicator component
const TrendIndicator: React.FC<{ delta: number; suffix?: string; inverse?: boolean }> = ({ delta, suffix = 'pp', inverse = false }) => {
  if (Math.abs(delta) < 0.01) return <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="w-3 h-3" /> 0{suffix}</span>;
  const isUp = delta > 0;
  // For break % and divergence, UP is bad (red), DOWN is good (green)
  // For inverse metrics (completion rate), UP is good
  const isGood = inverse ? isUp : !isUp;
  const color = isGood ? 'text-green-600' : 'text-red-600';
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', color)}>
      <Icon className="w-3 h-3" />
      {isUp ? '+' : ''}{delta.toFixed(2)}{suffix}
    </span>
  );
};

// ============================================================
// Skeleton for KPI cards
// ============================================================
const KPISkeletons: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i}>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// ============================================================
// Store filter header (shared)
// ============================================================
const FilterActions: React.FC<{
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedLoja: string;
  setSelectedLoja: (s: string) => void;
  stores: Array<{ id: number; name: string }>;
}> = ({ selectedMonth, setSelectedMonth, selectedLoja, setSelectedLoja, stores }) => (
  <div className="flex gap-2">
    <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
    <Select value={selectedLoja} onValueChange={setSelectedLoja}>
      <SelectTrigger className="w-[200px]">
        <Filter className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Todas as lojas" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as lojas</SelectItem>
        {stores.map(store => (
          <SelectItem key={store.id} value={String(store.id)}>{store.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// ============================================================
// KPI Summary Cards (reusable)
// ============================================================
const KPICards: React.FC<{
  breakPct: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  totalDivergence: number;
  divergenceLines: number;
  justifiedCount: number;
  unjustifiedCount: number;
  completionRate: number;
  closedCount: number;
  totalShifts: number;
  deltaBreakPct?: number;
  deltaDivergence?: number;
}> = ({
  breakPct, status, totalDivergence, divergenceLines,
  justifiedCount, unjustifiedCount, completionRate, closedCount, totalShifts,
  deltaBreakPct, deltaDivergence
}) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* % Quebra */}
      <Card className={cn(
        'relative overflow-hidden',
        breakPct > 5 && 'ring-2 ring-destructive/50'
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                % Quebra
                <InfoTooltip>Percentual de divergência em relação ao valor esperado pelo sistema</InfoTooltip>
              </p>
              <p className="text-3xl font-bold">{breakPct.toFixed(2)}%</p>
              {deltaBreakPct !== undefined && (
                <div className="mt-1">
                  <TrendIndicator delta={deltaBreakPct} suffix="pp" />
                  <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-full', getStatusBg(status))}>
              <Percent className={cn('w-6 h-6', getStatusColor(status))} />
            </div>
          </div>
          <div className="mt-2">
            <StatusIndicator status={status} label={`Risco ${getRiskLabel(breakPct)}`} size="sm" />
          </div>
        </CardContent>
      </Card>

      {/* Divergência Total */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                Divergência Total
                <InfoTooltip>Diferença entre valor esperado e valor real. Negativo indica falta no caixa.</InfoTooltip>
              </p>
              <p className={cn('text-2xl font-bold', totalDivergence < 0 ? 'text-destructive' : 'text-green-600')}>
                {formatCurrency(totalDivergence)}
              </p>
              {deltaDivergence !== undefined && (
                <div className="mt-1">
                  <TrendIndicator delta={deltaDivergence} suffix="" />
                  <span className="text-xs text-muted-foreground ml-1">({formatCurrency(deltaDivergence)})</span>
                </div>
              )}
            </div>
            <TrendingDown className="w-6 h-6 text-destructive" />
          </div>
        </CardContent>
      </Card>

      {/* Divergências */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                Divergências
                <InfoTooltip>Total de linhas com diferença entre esperado e real</InfoTooltip>
              </p>
              <p className="text-2xl font-bold">{divergenceLines}</p>
            </div>
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {justifiedCount} justificadas, {unjustifiedCount} pendentes
          </p>
        </CardContent>
      </Card>

      {/* Taxa de Conclusão */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center">
                Turnos Fechados
                <InfoTooltip>Percentual de turnos com fechamento aprovado</InfoTooltip>
              </p>
              <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
            </div>
            <ClipboardCheck className="w-6 h-6 text-secondary" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {closedCount}/{totalShifts} turnos
          </p>
        </CardContent>
      </Card>
    </div>
  );

// ============================================================
// Store Ranking Table
// ============================================================
const StoreRankingTable: React.FC<{
  stores: StoreIntegritySummary[];
  onSelectStore: (storeId: number) => void;
  sellersByStore?: Record<string, Array<{ user_id: number; user_name: string; total_abs_divergence: number; total_divergence: number; occurrences: number }>>;
}> = ({ stores, onSelectStore, sellersByStore }) => {
  const [sortField, setSortField] = useState<'cash_break_percentage' | 'total_divergence' | 'completion_rate'>('cash_break_percentage');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedStores = useMemo(() => {
    const sorted = [...stores].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return sorted;
  }, [stores, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  if (stores.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Nenhuma loja encontrada</p>
          <p className="text-sm text-muted-foreground">
            Não foram encontrados dados para o período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Ranking de Quebra por Loja
          <InfoTooltip>Lojas ordenadas pela quebra de caixa. Clique para ver detalhes.</InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="-mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-3 px-2 font-medium">#</th>
                <th className="text-left py-3 px-2 font-medium">Loja</th>
                <th
                  className="text-right py-3 px-2 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('cash_break_percentage')}
                >
                  <span className="inline-flex items-center gap-1">
                    % Quebra
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th
                  className="text-right py-3 px-2 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('total_divergence')}
                >
                  <span className="inline-flex items-center gap-1">
                    Divergência
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="text-center py-3 px-2 font-medium">Divergências</th>
                <th className="text-center py-3 px-2 font-medium">Tendência</th>
                <th className="text-left py-3 px-2 font-medium">Vendedor</th>
                <th
                  className="text-right py-3 px-2 font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('completion_rate')}
                >
                  <span className="inline-flex items-center gap-1">
                    Conclusão
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="text-right py-3 px-2 font-medium">Turnos</th>
                <th className="py-3 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sortedStores.map((store, i) => (
                <tr
                  key={store.store_id}
                  className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => onSelectStore(store.store_id)}
                >
                  <td className="py-3 px-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-3 px-2 font-medium">{store.store_name}</td>
                  <td className="py-3 px-2 text-right">
                    <span className={cn(
                      'font-semibold',
                      getStatusColor(store.status)
                    )}>
                      {store.cash_break_percentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className={cn(
                      'font-medium',
                      store.total_divergence < 0 ? 'text-destructive' : 'text-green-600'
                    )}>
                      {formatCurrency(store.total_divergence)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-muted-foreground">
                      {store.divergence_lines}
                    </span>
                    {store.unjustified_count > 0 && (
                      <span className="text-destructive ml-1 text-xs">
                        ({store.unjustified_count} ⚠)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {store.delta_break_pct !== undefined && (
                      <TrendIndicator delta={store.delta_break_pct} suffix="pp" />
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {(() => {
                      const sellers = sellersByStore?.[String(store.store_id)];
                      if (!sellers || sellers.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
                      const top = sellers[0];
                      const firstName = top.user_name.split(' ')[0];
                      const totalAbsDiv = sellers.reduce((sum, s) => sum + s.total_abs_divergence, 0);
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1.5 text-xs cursor-help">
                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="font-medium">{firstName}</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[280px]">
                              <p className="font-medium text-xs mb-1.5">Vendedores com quebra</p>
                              <div className="space-y-1">
                                {sellers.map((s, idx) => (
                                  <div key={s.user_id} className="flex justify-between items-center text-xs gap-3">
                                    <span className={idx === 0 ? 'font-medium' : ''}>{s.user_name}</span>
                                    <span className="text-destructive shrink-0">
                                      {totalAbsDiv > 0 ? ((s.total_abs_divergence / totalAbsDiv) * 100).toFixed(0) : 0}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Progress value={store.completion_rate} className="w-16 h-2" />
                      <span className="text-muted-foreground w-10 text-right">
                        {store.completion_rate.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right text-muted-foreground">
                    {store.shifts_closed}/{store.shifts_total}
                  </td>
                  <td className="py-3 px-2">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// Per-store detail view (improved UX)
// ============================================================
const alertCodeMap: Record<string, string> = {
  QUEBRA_ELEVADA: 'Quebra de Caixa Elevada',
  QUEBRA_ACIMA_LIMITE: 'Quebra Acima do Limite',
  DIVERGENCIAS_SEM_JUSTIFICATIVA: 'Divergências Sem Justificativa',
  APROVACOES_PENDENTES: 'Aprovações Pendentes',
  TURNOS_ABERTOS: 'Turnos Abertos',
  // Legacy codes (backwards compat)
  HIGH_CASH_BREAK: 'Quebra de Caixa Elevada',
  ELEVATED_CASH_BREAK: 'Quebra Acima do Limite',
  UNJUSTIFIED_DIVERGENCES: 'Divergências Sem Justificativa',
  PENDING_BACKLOG: 'Aprovações Pendentes',
  OPEN_SHIFTS: 'Turnos Abertos',
};

const StoreDetailView: React.FC<{
  storeId: number;
  month: string;
  storeName?: string;
  onBack: () => void;
  globalData?: import('@/types/api').GlobalCashIntegrityData | null;
}> = ({ storeId, month, storeName, onBack, globalData }) => {
  const { data: cashData, isLoading, isError, error } = useCashIntegrity(storeId, month);

  // Get per-store trend data from global report
  const storeGlobalInfo = useMemo(() => {
    if (!globalData?.by_store) return null;
    return globalData.by_store.find(s => s.store_id === storeId) || null;
  }, [globalData, storeId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <KPISkeletons />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="pt-6"><Skeleton className="h-[250px] w-full" /></CardContent></Card>
          <Card><CardContent className="pt-6"><Skeleton className="h-[250px] w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center">
          <p className="text-destructive mb-2">Erro ao carregar relatório</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Tente novamente mais tarde'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const integrity = cashData?.cash_integrity;
  const divergence = cashData?.divergence_analysis;
  const workflow = cashData?.workflow_status;
  const alerts = cashData?.alerts || [];

  const pieData = divergence ? [
    { name: 'Justificadas', value: divergence.justified_count, color: 'hsl(var(--secondary))' },
    { name: 'Não Justificadas', value: divergence.unjustified_count, color: 'hsl(var(--destructive))' },
  ] : [];

  const workflowPieData = workflow ? [
    { name: 'Aprovados', value: workflow.closed_count, color: 'hsl(142, 76%, 36%)' },
    { name: 'Pendentes', value: workflow.pending_approval, color: 'hsl(var(--accent))' },
    { name: 'Abertos', value: Math.max(0, workflow.total_shifts - workflow.closed_count - workflow.pending_approval), color: 'hsl(var(--muted-foreground))' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Alertas da Loja */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              variant={alert.type === 'CRITICAL' ? 'destructive' : 'default'}
              className={cn(
                alert.type === 'WARNING' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
                alert.type === 'INFO' && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              )}
            >
              {getAlertIcon(alert.type)}
              <AlertTitle className="ml-2">{alertCodeMap[alert.code] || alert.code}</AlertTitle>
              <AlertDescription className="ml-2">{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* KPI Cards com deltas do global */}
      {integrity && divergence && workflow && (
        <KPICards
          breakPct={integrity.cash_break_percentage}
          status={integrity.status}
          totalDivergence={integrity.total_divergence}
          divergenceLines={divergence.total_lines_with_divergence}
          justifiedCount={divergence.justified_count}
          unjustifiedCount={divergence.unjustified_count}
          completionRate={workflow.completion_rate}
          closedCount={workflow.closed_count}
          totalShifts={workflow.total_shifts}
          deltaBreakPct={storeGlobalInfo?.delta_break_pct}
          deltaDivergence={storeGlobalInfo?.delta_divergence}
        />
      )}

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análise de Divergências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Análise de Divergências
              <InfoTooltip>Proporção de divergências justificadas vs pendentes de justificativa</InfoTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {divergence && divergence.total_lines_with_divergence > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [value, 'Divergências']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de Justificação</span>
                    <span className="font-medium">{divergence.justified_rate.toFixed(0)}%</span>
                  </div>
                  <Progress value={divergence.justified_rate} className="mt-2 h-2" />
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground">Nenhuma divergência registrada</p>
                  <p className="text-xs text-muted-foreground mt-1">Todos os valores conferem ✓</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Andamento dos Turnos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Andamento dos Turnos
              <InfoTooltip>Status dos fechamentos de turno: aprovados, aguardando aprovação e ainda abertos</InfoTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workflow && workflow.total_shifts > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={workflowPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {workflowPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [value, 'Turnos']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {workflowPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Turnos Aprovados
                    </span>
                    <span className="font-medium">{workflow.closed_count}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      Aguardando Aprovação
                    </span>
                    <span className="font-medium">{workflow.pending_approval}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      Turnos Abertos
                    </span>
                    <span className="font-medium">{Math.max(0, workflow.total_shifts - workflow.closed_count - workflow.pending_approval)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum turno registrado</p>
                  <p className="text-xs text-muted-foreground mt-1">Os turnos aparecerão aqui quando forem fechados no PDV</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-store Top Drivers */}
      {globalData?.top_drivers && (
        <StoreTopDrivers storeId={storeId} globalData={globalData} />
      )}

      {/* Resumo Financeiro */}
      {integrity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Resumo Financeiro
              <InfoTooltip>Comparação entre valores esperados pelo sistema e valores reais contados</InfoTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Valor Esperado (Sistema)</p>
                <p className="text-2xl font-bold">{formatCurrency(integrity.total_system_value)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Valor Real (Contado)</p>
                <p className="text-2xl font-bold">{formatCurrency(integrity.total_real_value)}</p>
              </div>
              <div className={cn(
                'p-4 rounded-lg',
                integrity.total_divergence < 0 ? 'bg-red-100 dark:bg-red-950/30' : 'bg-green-100 dark:bg-green-950/30'
              )}>
                <p className="text-sm text-muted-foreground mb-1">Diferença</p>
                <p className={cn(
                  'text-2xl font-bold',
                  integrity.total_divergence < 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {formatCurrency(integrity.total_divergence)}
                </p>
                {storeGlobalInfo?.delta_divergence !== undefined && (
                  <div className="mt-1">
                    <TrendIndicator delta={storeGlobalInfo.delta_divergence} suffix="" />
                    <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
                  </div>
                )}
              </div>
            </div>

            {/* Barra comparativa visual */}
            {integrity.total_system_value > 0 && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-2">Proporção Sistema vs Real</p>
                <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min(100, (integrity.total_real_value / integrity.total_system_value) * 100)}%` }}
                    title={`Real: ${formatCurrency(integrity.total_real_value)}`}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Real: {((integrity.total_real_value / integrity.total_system_value) * 100).toFixed(1)}%</span>
                  <span>Esperado: 100%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================
// Per-store Top Drivers (filtered from global data)
// ============================================================
const StoreTopDrivers: React.FC<{
  storeId: number;
  globalData: import('@/types/api').GlobalCashIntegrityData;
}> = ({ storeId, globalData }) => {
  const drivers = globalData.top_drivers;
  if (!drivers) return null;

  // Filter top_shifts for this store
  const storeShifts = drivers.top_shifts.filter(s => s.store_id === storeId);

  if (storeShifts.length === 0) return null;

  const shiftLabel = (code: string) => {
    const map: Record<string, string> = { M: 'Manhã', T: 'Tarde', N: 'Noite' };
    return map[code] || code;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Principais Causas desta Loja
          <InfoTooltip>Turnos com maior impacto de divergência nesta loja no período</InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {storeShifts.map(shift => (
            <div
              key={shift.shift_id}
              className="p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="text-sm">
                  <p className="font-medium">
                    {new Date(shift.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' · '}{shiftLabel(shift.shift_code)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Operador: {shift.seller_name}
                  </p>
                </div>
                <span className="font-medium text-destructive text-sm shrink-0 ml-2">
                  {formatCurrency(shift.total_divergence)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// Compact Alerts Summary (replaces N full-page alerts)
// ============================================================
const CompactAlertsSummary: React.FC<{
  alerts: Array<{ type: 'CRITICAL' | 'WARNING' | 'INFO'; code: string; message: string; store_name: string; store_id: number }>;
}> = ({ alerts }) => {
  const [expanded, setExpanded] = useState(false);

  const criticalCount = alerts.filter(a => a.type === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.type === 'WARNING').length;
  const infoCount = alerts.filter(a => a.type === 'INFO').length;

  // Show max 2 critical inline, rest collapsed
  const visibleAlerts = expanded ? alerts : alerts.filter(a => a.type === 'CRITICAL').slice(0, 2);
  const hiddenCount = alerts.length - visibleAlerts.length;

  return (
    <div className="space-y-2">
      {/* Summary badge */}
      <div
        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
              <XCircle className="w-3 h-3" />
              {criticalCount} crítico{criticalCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400">
              <AlertTriangle className="w-3 h-3" />
              {warningCount} aviso{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {infoCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
              <Info className="w-3 h-3" />
              {infoCount} info
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 text-xs">
          {expanded ? 'Recolher' : `Ver ${hiddenCount > 0 ? `todos (${alerts.length})` : 'detalhes'}`}
        </Button>
      </div>

      {/* Visible alerts */}
      {visibleAlerts.length > 0 && (
        <div className={cn('space-y-2 transition-all', expanded ? 'max-h-[600px] overflow-y-auto' : '')}>
          {visibleAlerts.map((alert, index) => (
            <Alert
              key={index}
              variant={alert.type === 'CRITICAL' ? 'destructive' : 'default'}
              className={cn(
                'py-2',
                alert.type === 'WARNING' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
                alert.type === 'INFO' && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              )}
            >
              {getAlertIcon(alert.type)}
              <AlertTitle className="ml-2 text-sm">
                {alert.store_name} — {alertCodeMap[alert.code] || alert.code}
              </AlertTitle>
              <AlertDescription className="ml-2 text-xs">{alert.message}</AlertDescription>
            </Alert>
          ))}
          {!expanded && hiddenCount > 0 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              + {hiddenCount} alerta{hiddenCount !== 1 ? 's' : ''} oculto{hiddenCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Insight Card (auto-generated summary)
// ============================================================
const InsightCard: React.FC<{
  globalData: import('@/types/api').GlobalCashIntegrityData;
}> = ({ globalData }) => {
  const insight = useMemo(() => {
    const g = globalData.global;
    const stores = globalData.by_store;
    const lines: string[] = [];

    // Break percentage insight
    const breakPct = g.cash_break_percentage;
    if (breakPct === 0) {
      lines.push('✅ Nenhuma divergência registrada neste período. Parabéns!');
      return lines;
    }

    lines.push(`A quebra geral deste mês é de **${breakPct.toFixed(2)}%** (${formatCurrency(g.total_divergence)}).`);

    // Concentration analysis
    if (stores.length >= 3) {
      const totalAbsDivergence = stores.reduce((sum, s) => sum + Math.abs(s.total_divergence), 0);
      if (totalAbsDivergence > 0) {
        const top3 = stores.slice(0, 3); // already sorted by worst %
        const top3Div = top3.reduce((sum, s) => sum + Math.abs(s.total_divergence), 0);
        const concentrationPct = ((top3Div / totalAbsDivergence) * 100).toFixed(0);
        lines.push(`Top 3 lojas concentram **${concentrationPct}%** da divergência total.`);
      }
    }

    // Unjustified count
    if (g.unjustified_count > 0) {
      lines.push(`${g.unjustified_count} divergência${g.unjustified_count !== 1 ? 's' : ''} ainda sem justificativa.`);
    }

    // Completion
    if (g.pending_approval > 0) {
      lines.push(`${g.pending_approval} fechamento${g.pending_approval !== 1 ? 's' : ''} aguardando aprovação.`);
    }

    return lines;
  }, [globalData]);

  if (insight.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10 shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Resumo do Mês</p>
            {insight.map((line, i) => (
              <p key={i} className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{
                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
              }} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// Top Drivers Section (causa raiz)
// ============================================================
const TopDriversSection: React.FC<{
  topDrivers: NonNullable<import('@/types/api').GlobalCashIntegrityData['top_drivers']>;
  onSelectStore: (storeId: number) => void;
}> = ({ topDrivers, onSelectStore }) => {
  const { by_payment_method, by_seller, top_shifts } = topDrivers;
  const hasData = by_payment_method.length > 0 || by_seller.length > 0 || top_shifts.length > 0;

  if (!hasData) return null;

  const maxByLabel = by_payment_method.length > 0 ? by_payment_method[0].total_abs_divergence : 1;
  const maxBySeller = by_seller.length > 0 ? by_seller[0].total_abs_divergence : 1;

  const shiftLabel = (code: string) => {
    const map: Record<string, string> = { M: 'Manhã', T: 'Tarde', N: 'Noite' };
    return map[code] || code;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Principais Causas
          <InfoTooltip>Análise de causa raiz: onde as divergências se concentram</InfoTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* By Payment Method */}
          {by_payment_method.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Por Meio de Pagamento
              </p>
              <div className="space-y-2">
                {by_payment_method.map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="truncate">{item.label}</span>
                      <span className="font-medium text-destructive shrink-0 ml-2">
                        {formatCurrency(item.total_divergence)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all"
                        style={{ width: `${(item.total_abs_divergence / maxByLabel) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.occurrences} ocorrência{item.occurrences !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por Vendedor */}
          {by_seller.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Por Vendedor
              </p>
              <div className="space-y-2">
                {by_seller.map((item, i) => (
                  <div key={item.user_id} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{i + 1}</span>
                        <span className="truncate">{item.user_name}</span>
                      </span>
                      <span className="font-medium text-destructive shrink-0 ml-2">
                        {formatCurrency(item.total_divergence)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all"
                        style={{ width: `${(item.total_abs_divergence / maxBySeller) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.occurrences} divergência{item.occurrences !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Shifts */}
          {top_shifts.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Turnos Mais Impactantes
              </p>
              <div className="space-y-2">
                {top_shifts.slice(0, 5).map(shift => (
                  <div
                    key={shift.shift_id}
                    className="p-2 rounded-lg bg-muted/50 hover:bg-muted/80 cursor-pointer transition-colors"
                    onClick={() => onSelectStore(shift.store_id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-sm">
                        <p className="font-medium">{shift.store_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(shift.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          {' · '}{shiftLabel(shift.shift_code)}
                          {' · '}{shift.seller_name}
                        </p>
                      </div>
                      <span className="font-medium text-destructive text-sm shrink-0 ml-2">
                        {formatCurrency(shift.total_divergence)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// Meta Badge (updated at + query time + completeness)
// ============================================================
const MetaBadge: React.FC<{
  meta: { generated_at: string; query_ms: number; stores_count: number; stores_with_data: number; data_completeness: number };
}> = ({ meta }) => {
  const timeAgo = useMemo(() => {
    const generated = new Date(meta.generated_at);
    const now = new Date();
    const diffMs = now.getTime() - generated.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    return `há ${diffH}h${diffMin % 60 > 0 ? ` ${diffMin % 60}min` : ''}`;
  }, [meta.generated_at]);

  const completenessLabel = meta.data_completeness >= 1
    ? 'Dados completos'
    : `${(meta.data_completeness * 100).toFixed(0)}% dos dados`;

  return (
    <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Atualizado {timeAgo}
      </span>
      <span>•</span>
      <span>{completenessLabel} ({meta.stores_with_data}/{meta.stores_count} lojas)</span>
      <span>•</span>
      <span>{meta.query_ms}ms</span>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const QuebraCaixa: React.FC = () => {
  const { currentStoreId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced state
  const selectedMonth = searchParams.get('month') || getCurrentMonth();
  const selectedLoja = searchParams.get('store') || 'all';
  const drilldownStoreId = selectedLoja !== 'all' ? Number(selectedLoja) : null;

  // Update URL helpers
  const setSelectedMonth = useCallback((month: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('month', month);
      return next;
    });
  }, [setSearchParams]);

  const handleStoreFilterChange = useCallback((value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'all') {
        next.delete('store');
      } else {
        next.set('store', value);
      }
      return next;
    });
  }, [setSearchParams]);

  const handleDrilldown = useCallback((storeId: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('store', String(storeId));
      return next;
    });
  }, [setSearchParams]);

  const handleBack = useCallback(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('store');
      return next;
    });
  }, [setSearchParams]);

  // Fetch stores list
  const { data: storesData } = useStores();

  // Fetch global data (always, to show on initial view)
  const { data: globalData, isLoading: isGlobalLoading, isError: isGlobalError, error: globalError } = useGlobalCashIntegrity(selectedMonth);

  // Find store name for drill-down
  const drilldownStoreName = useMemo(() => {
    if (!drilldownStoreId) return undefined;
    const fromGlobal = globalData?.by_store?.find(s => s.store_id === drilldownStoreId);
    if (fromGlobal) return fromGlobal.store_name;
    const fromStores = storesData?.find(s => s.id === drilldownStoreId);
    return fromStores?.name;
  }, [drilldownStoreId, globalData, storesData]);

  const isGlobalView = !drilldownStoreId;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quebra de Caixa"
        description={isGlobalView
          ? "Visão global — análise de divergências e riscos em todas as lojas"
          : "Detalhes e análise de divergências da loja selecionada"
        }
        icon={AlertTriangle}
        actions={
          <FilterActions
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedLoja={selectedLoja}
            setSelectedLoja={handleStoreFilterChange}
            stores={storesData || []}
          />
        }
      />

      {/* ====== GLOBAL VIEW ====== */}
      {isGlobalView && (
        <>
          {/* Loading */}
          {isGlobalLoading && (
            <>
              <KPISkeletons />
              <Card><CardContent className="pt-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>
            </>
          )}

          {/* Error */}
          {isGlobalError && (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-center">
                <p className="text-destructive mb-2">Erro ao carregar relatório global</p>
                <p className="text-sm text-muted-foreground">
                  {globalError instanceof Error ? globalError.message : 'Tente novamente mais tarde'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Data loaded */}
          {globalData && (
            <>
              {/* ── Compact Alert Summary ── */}
              {globalData.alerts.length > 0 && (
                <CompactAlertsSummary alerts={globalData.alerts} />
              )}

              {/* ── Auto Insight ── */}
              <InsightCard globalData={globalData} />

              {/* Global KPI Cards */}
              <KPICards
                breakPct={globalData.global.cash_break_percentage}
                status={globalData.global.status}
                totalDivergence={globalData.global.total_divergence}
                divergenceLines={globalData.global.total_divergences}
                justifiedCount={globalData.global.justified_count}
                unjustifiedCount={globalData.global.unjustified_count}
                completionRate={globalData.global.completion_rate}
                closedCount={globalData.global.closed_count}
                totalShifts={globalData.global.total_shifts}
                deltaBreakPct={globalData.global.delta_break_pct}
                deltaDivergence={globalData.global.delta_divergence}
              />

              {/* Store Ranking Table */}
              <StoreRankingTable
                stores={globalData.by_store}
                onSelectStore={handleDrilldown}
                sellersByStore={globalData.top_drivers?.sellers_by_store}
              />

              {/* Top Drivers (causa raiz) */}
              {globalData.top_drivers && (
                <TopDriversSection
                  topDrivers={globalData.top_drivers}
                  onSelectStore={handleDrilldown}
                />
              )}

              {/* Global Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Resumo Financeiro Global
                    <span className="text-sm font-normal text-muted-foreground">
                      ({globalData.store_count} lojas)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Valor Esperado (Sistema)</p>
                      <p className="text-2xl font-bold">{formatCurrency(globalData.global.total_system_value)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Valor Real (Contado)</p>
                      <p className="text-2xl font-bold">{formatCurrency(globalData.global.total_real_value)}</p>
                    </div>
                    <div className={cn(
                      'p-4 rounded-lg',
                      globalData.global.total_divergence < 0 ? 'bg-red-100 dark:bg-red-950/30' : 'bg-green-100 dark:bg-green-950/30'
                    )}>
                      <p className="text-sm text-muted-foreground mb-1">Diferença</p>
                      <p className={cn(
                        'text-2xl font-bold',
                        globalData.global.total_divergence < 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {formatCurrency(globalData.global.total_divergence)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Updated At */}
              <MetaBadge meta={globalData.meta} />

              {/* Smart empty state if no stores have data */}
              {globalData.by_store.every(s => s.cash_break_percentage === 0 && s.shifts_total === 0) && (
                <Card className="border-dashed">
                  <CardContent className="pt-6 text-center py-12">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-lg font-medium mb-2">Nenhuma divergência encontrada</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Não existem fechamentos aprovados com divergências para {new Date(selectedMonth + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Isso pode ser porque os turnos ainda não foram fechados ou aprovados.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* ====== STORE DETAIL VIEW ====== */}
      {!isGlobalView && drilldownStoreId && (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={handleBack}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Store className="w-4 h-4" />
              Visão Global
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{drilldownStoreName || 'Loja selecionada'}</span>
          </div>

          <StoreDetailView
            storeId={drilldownStoreId}
            month={selectedMonth}
            storeName={drilldownStoreName}
            onBack={handleBack}
            globalData={globalData}
          />
        </>
      )}
    </div>
  );
};

export default QuebraCaixa;
