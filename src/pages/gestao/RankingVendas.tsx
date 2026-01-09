import React, { useState, useMemo } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Filter, Info, Users, Target, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { MonthPicker } from '@/components/MonthPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRanking } from '@/hooks/api/use-reports';
import { useStores } from '@/hooks/api/use-stores';
import type { RankingEntry } from '@/types/api';

// Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const RankingVendas: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedLoja, setSelectedLoja] = useState<string>('todas');

  // Fetch data from API
  const { data: storesData } = useStores();
  const { data: rankingData, isLoading, isError, error } = useRanking({
    month: selectedMonth,
    store_id: selectedLoja !== 'todas' ? Number(selectedLoja) : undefined,
    limit: 50,
  });

  // Combined podium + ranking list
  const allRankingEntries = useMemo(() => {
    if (!rankingData) return [];
    return [...(rankingData.podium || []), ...(rankingData.ranking || [])];
  }, [rankingData]);

  // Chart data for top 6
  const chartData = useMemo(() => {
    return allRankingEntries.slice(0, 6).map((entry) => ({
      name: entry.seller.name.split(' ')[0],
      vendas: entry.total_sold,
      meta: entry.goal,
      rank: entry.position,
    }));
  }, [allRankingEntries]);

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{position}</span>;
  };

  const getBarColor = (index: number) => {
    if (index === 0) return 'hsl(var(--accent))';
    if (index === 1) return 'hsl(var(--secondary))';
    if (index === 2) return 'hsl(var(--primary))';
    return 'hsl(var(--muted-foreground))';
  };

  // Helper component for info tooltips
  const InfoTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <Info className="w-4 h-4 text-muted-foreground cursor-help ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{children}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Ranking de Vendas"
          description="Acompanhe o desempenho dos vendedores da rede"
          icon={Trophy}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-32 w-full" />
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
          title="Ranking de Vendas"
          description="Acompanhe o desempenho dos vendedores da rede"
          icon={Trophy}
        />
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-2">Erro ao carregar ranking</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Tente novamente mais tarde'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const podium = rankingData?.podium || [];
  const stats = rankingData?.stats;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ranking de Vendas"
        description="Acompanhe o desempenho dos vendedores da rede"
        icon={Trophy}
        actions={
          <div className="flex gap-2">
            <MonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
            <Select value={selectedLoja} onValueChange={setSelectedLoja}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Lojas</SelectItem>
                {storesData?.map(store => (
                  <SelectItem key={store.id} value={String(store.id)}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Vendedores</p>
                  <p className="text-xl font-bold">{stats.total_sellers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Batendo Meta
                    <InfoTooltip>Vendedores com atingimento ≥ 100%</InfoTooltip>
                  </p>
                  <p className="text-xl font-bold text-green-600">{stats.above_goal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Abaixo da Meta</p>
                  <p className="text-xl font-bold text-red-600">{stats.below_goal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Média Atingimento
                    <InfoTooltip>Média do % de atingimento de todos vendedores</InfoTooltip>
                  </p>
                  <p className="text-xl font-bold">{stats.average_achievement.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top 3 Destaque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {podium.map((item, index) => (
          <Card
            key={item.seller.id}
            className={cn(
              'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
              index === 0 && 'ring-2 ring-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-transparent'
            )}
          >
            <div className={cn(
              'absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10',
              index === 0 && 'bg-yellow-500',
              index === 1 && 'bg-gray-400',
              index === 2 && 'bg-amber-600'
            )} />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden',
                  index === 0 && 'bg-yellow-500/20 text-yellow-600',
                  index === 1 && 'bg-gray-400/20 text-gray-600',
                  index === 2 && 'bg-amber-600/20 text-amber-700'
                )}>
                  {item.seller.avatar_url ? (
                    <img src={item.seller.avatar_url} alt={item.seller.name} className="w-full h-full object-cover" />
                  ) : (
                    item.seller.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{item.seller.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{item.seller.store_name}</p>
                </div>
                {getRankIcon(item.position)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    Vendido
                    <InfoTooltip>Total vendido no período selecionado</InfoTooltip>
                  </span>
                  <span className="font-bold text-lg">
                    R$ {item.total_sold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vendas</span>
                  <span className="font-medium">{item.sale_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    Atingimento
                    <InfoTooltip>Percentual da meta individual atingida</InfoTooltip>
                  </span>
                  <StatusBadge
                    variant={item.achievement_rate >= 100 ? 'success' : item.achievement_rate >= 80 ? 'warning' : 'error'}
                  >
                    {item.achievement_rate.toFixed(0)}%
                  </StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    Bônus
                    <InfoTooltip>Bônus acumulado confirmado no período</InfoTooltip>
                  </span>
                  <span className="font-medium text-secondary">
                    R$ {item.bonus_accumulated.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de Barras */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Comparativo de Vendas
              <InfoTooltip>Top 6 vendedores ordenados por total vendido</InfoTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Vendas']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="vendas" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela Completa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ranking Completo
            <InfoTooltip>Lista completa ordenada por total vendido</InfoTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold">#</th>
                  <th className="text-left py-3 px-4 font-semibold">Vendedor</th>
                  <th className="text-left py-3 px-4 font-semibold">Loja</th>
                  <th className="text-right py-3 px-4 font-semibold">Vendido</th>
                  <th className="text-center py-3 px-4 font-semibold">Qtd Vendas</th>
                  <th className="text-right py-3 px-4 font-semibold">Meta</th>
                  <th className="text-center py-3 px-4 font-semibold">% Ating.</th>
                  <th className="text-right py-3 px-4 font-semibold">Bônus</th>
                </tr>
              </thead>
              <tbody>
                {allRankingEntries.map((item: RankingEntry) => (
                  <tr
                    key={item.seller.id}
                    className={cn(
                      'border-b transition-colors hover:bg-muted/50',
                      item.position <= 3 && 'bg-primary/5'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(item.position)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium overflow-hidden">
                          {item.seller.avatar_url ? (
                            <img src={item.seller.avatar_url} alt={item.seller.name} className="w-full h-full object-cover" />
                          ) : (
                            item.seller.name.charAt(0)
                          )}
                        </div>
                        <span className="font-medium">{item.seller.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{item.seller.store_name}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      R$ {item.total_sold.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">{item.sale_count}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      R$ {item.goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        variant={item.achievement_rate >= 100 ? 'success' : item.achievement_rate >= 80 ? 'warning' : 'error'}
                      >
                        <span className="flex items-center gap-1">
                          {item.achievement_rate >= 100 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {item.achievement_rate.toFixed(0)}%
                        </span>
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-secondary">
                      R$ {item.bonus_accumulated.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingVendas;
