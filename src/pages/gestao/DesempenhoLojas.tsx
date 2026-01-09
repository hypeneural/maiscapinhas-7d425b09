import React, { useState } from 'react';
import { Store, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Target, DollarSign, Calendar as CalendarIcon, Info, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { MonthPicker } from '@/components/MonthPicker';
import { StatusIndicator, StatusDot } from '@/components/StatusIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useConsolidatedPerformance } from '@/hooks/api/use-reports';
import { useStores } from '@/hooks/api/use-stores';
import { Progress } from '@/components/ui/progress';

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Colors for charts
const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(142, 76%, 36%)'];

const DesempenhoLojas: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

  // Fetch data from API
  const { data: storesData } = useStores();
  const { data: performanceData, isLoading, isError, error } = useConsolidatedPerformance(selectedMonth);

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

  // Get store name from stores data
  const getStoreName = (storeId: number): string => {
    const store = storesData?.find(s => s.id === storeId);
    return store?.name || `Loja ${storeId}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Desempenho por Loja"
          description="Análise comparativa de todas as unidades da rede"
          icon={Store}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Desempenho por Loja"
          description="Análise comparativa de todas as unidades da rede"
          icon={Store}
        />
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-2">Erro ao carregar desempenho</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Tente novamente mais tarde'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const consolidated = performanceData?.consolidated;
  const stores = performanceData?.stores || [];

  // Chart data for bar comparison
  const chartData = stores.map(store => ({
    name: getStoreName(store.store_id).split(' - ').pop() || getStoreName(store.store_id),
    atual: store.sales.current_amount,
    meta: store.sales.goal_amount,
    anoAnterior: store.comparison.same_period_last_year,
  }));

  // Pie chart data for distribution
  const pieData = stores.map(store => ({
    name: getStoreName(store.store_id).split(' - ').pop() || getStoreName(store.store_id),
    value: store.sales.current_amount,
  }));

  // Count stores by status
  const statusCounts = {
    onTrack: stores.filter(s => s.forecast.status === 'ON_TRACK').length,
    atRisk: stores.filter(s => s.forecast.status === 'AT_RISK').length,
    behind: stores.filter(s => s.forecast.status === 'BEHIND').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Desempenho por Loja"
        description="Análise comparativa de todas as unidades da rede"
        icon={Store}
        actions={
          <MonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
          />
        }
      />

      {/* Resumo da Rede */}
      {consolidated && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    Total da Rede
                    <InfoTooltip>Soma das vendas de todas as lojas no período</InfoTooltip>
                  </p>
                  <p className="text-2xl font-bold">
                    R$ {consolidated.total_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/20">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    Meta da Rede
                    <InfoTooltip>Meta consolidada de todas as lojas</InfoTooltip>
                  </p>
                  <p className="text-2xl font-bold">
                    R$ {consolidated.total_goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <StatusBadge
                  variant={consolidated.total_achievement_rate >= 100 ? 'success' : consolidated.total_achievement_rate >= 80 ? 'warning' : 'error'}
                  className="text-lg"
                >
                  {consolidated.total_achievement_rate.toFixed(0)}%
                </StatusBadge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    Projeção Linear
                    <InfoTooltip>Estimativa do total mensal baseada no ritmo atual (run rate)</InfoTooltip>
                  </p>
                  <p className="text-2xl font-bold">
                    R$ {consolidated.total_linear_projection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-secondary/20">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status das Lojas</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">{statusCounts.onTrack}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">{statusCounts.atRisk}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">{statusCounts.behind}</span>
                    </div>
                  </div>
                </div>
                <Store className="w-6 h-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Atual vs Meta
              <InfoTooltip>Comparativo entre vendas atuais e meta de cada loja</InfoTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="atual" name="Atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" name="Meta" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Distribuição de Vendas
              <InfoTooltip>Participação de cada loja no total de vendas da rede</InfoTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Lojas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Farol de Lojas
            <InfoTooltip>Visão detalhada de cada loja com projeções e comparativo</InfoTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Loja</th>
                  <th className="text-right py-3 px-4 font-semibold">Vendido</th>
                  <th className="text-right py-3 px-4 font-semibold">Meta</th>
                  <th className="text-center py-3 px-4 font-semibold">% Meta</th>
                  <th className="text-right py-3 px-4 font-semibold">
                    <span className="flex items-center justify-end">
                      Projeção
                      <InfoTooltip>Projeção linear baseada no ritmo atual</InfoTooltip>
                    </span>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    <span className="flex items-center justify-center">
                      YoY
                      <InfoTooltip>Crescimento comparado ao mesmo período do ano anterior</InfoTooltip>
                    </span>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => {
                  const storeName = getStoreName(store.store_id);
                  const progressPercent = Math.min((store.days_elapsed / store.days_total) * 100, 100);

                  return (
                    <tr key={store.store_id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <StatusDot
                          status={store.forecast.status}
                          tooltip={
                            store.forecast.status === 'ON_TRACK' ? 'Meta será atingida' :
                              store.forecast.status === 'AT_RISK' ? 'Meta em risco' : 'Meta não será atingida'
                          }
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{storeName}</p>
                          <p className="text-xs text-muted-foreground">
                            Dia {store.days_elapsed}/{store.days_total}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        R$ {store.sales.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        R$ {store.sales.goal_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          variant={store.sales.achievement_rate >= 100 ? 'success' : store.sales.achievement_rate >= 80 ? 'warning' : 'error'}
                        >
                          {store.sales.achievement_rate.toFixed(0)}%
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-secondary">
                        R$ {store.forecast.linear_projection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <div className={cn(
                          'flex items-center justify-center gap-1 text-sm font-medium',
                          store.comparison.yoy_growth >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {store.comparison.yoy_growth >= 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          {Math.abs(store.comparison.yoy_growth).toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-full">
                                <Progress value={progressPercent} className="h-2" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{progressPercent.toFixed(0)}% do mês decorrido</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesempenhoLojas;
