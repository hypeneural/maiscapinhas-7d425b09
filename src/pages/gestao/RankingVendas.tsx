import React, { useState } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { usuarios, lojas, vendasDiarias } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RankingVendas: React.FC = () => {
  const [selectedLoja, setSelectedLoja] = useState<string>('todas');
  const [periodo, setPeriodo] = useState<string>('mes');

  // Calcular ranking de vendedores
  const vendedores = usuarios.filter(u => u.role === 'vendedor' && u.ativo);
  
  const rankingData = vendedores.map(vendedor => {
    const loja = lojas.find(l => l.id === vendedor.lojaId);
    const vendas = vendasDiarias.filter(v => v.vendedorId === vendedor.id);
    const totalVendido = vendas.reduce((acc, v) => acc + v.valorVendido, 0);
    const metaTotal = vendas.reduce((acc, v) => acc + v.metaDia, 0);
    const percentualMeta = metaTotal > 0 ? (totalVendido / metaTotal) * 100 : 0;
    const bonusTotal = vendas.reduce((acc, v) => acc + v.bonusGanho, 0);

    return {
      vendedor,
      loja,
      totalVendido,
      metaTotal,
      percentualMeta,
      bonusTotal,
      diasTrabalhados: vendas.length,
    };
  }).sort((a, b) => b.totalVendido - a.totalVendido);

  const filteredRanking = selectedLoja === 'todas' 
    ? rankingData 
    : rankingData.filter(r => r.loja?.id === selectedLoja);

  const chartData = filteredRanking.slice(0, 6).map((r, index) => ({
    name: r.vendedor.nome.split(' ')[0],
    vendas: r.totalVendido,
    meta: r.metaTotal,
    rank: index + 1,
  }));

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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ranking de Vendas"
        description="Acompanhe o desempenho dos vendedores da rede"
        icon={Trophy}
        actions={
          <div className="flex gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLoja} onValueChange={setSelectedLoja}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Lojas</SelectItem>
                {lojas.map(loja => (
                  <SelectItem key={loja.id} value={loja.id}>{loja.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Top 3 Destaque */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredRanking.slice(0, 3).map((item, index) => (
          <Card 
            key={item.vendedor.id} 
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
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
                  index === 0 && 'bg-yellow-500/20 text-yellow-600',
                  index === 1 && 'bg-gray-400/20 text-gray-600',
                  index === 2 && 'bg-amber-600/20 text-amber-700'
                )}>
                  {item.vendedor.nome.charAt(0)}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{item.vendedor.nome}</CardTitle>
                  <p className="text-xs text-muted-foreground">{item.loja?.nome}</p>
                </div>
                {getRankIcon(index + 1)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vendido</span>
                  <span className="font-bold text-lg">
                    R$ {item.totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Meta</span>
                  <StatusBadge
                    variant={item.percentualMeta >= 100 ? 'success' : item.percentualMeta >= 80 ? 'warning' : 'error'}
                  >
                    {item.percentualMeta.toFixed(0)}%
                  </StatusBadge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Bônus</span>
                  <span className="font-medium text-secondary">
                    R$ {item.bonusTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de Barras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Comparativo de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `R$ ${(v/1000).toFixed(1)}k`} />
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

      {/* Tabela Completa */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo</CardTitle>
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
                  <th className="text-right py-3 px-4 font-semibold">Meta</th>
                  <th className="text-center py-3 px-4 font-semibold">% Ating.</th>
                  <th className="text-right py-3 px-4 font-semibold">Bônus</th>
                  <th className="text-center py-3 px-4 font-semibold">Dias</th>
                </tr>
              </thead>
              <tbody>
                {filteredRanking.map((item, index) => (
                  <tr 
                    key={item.vendedor.id} 
                    className={cn(
                      'border-b transition-colors hover:bg-muted/50',
                      index < 3 && 'bg-primary/5'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(index + 1)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {item.vendedor.nome.charAt(0)}
                        </div>
                        <span className="font-medium">{item.vendedor.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{item.loja?.nome}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      R$ {item.totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      R$ {item.metaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        variant={item.percentualMeta >= 100 ? 'success' : item.percentualMeta >= 80 ? 'warning' : 'error'}
                      >
                        <span className="flex items-center gap-1">
                          {item.percentualMeta >= 100 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {item.percentualMeta.toFixed(0)}%
                        </span>
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-secondary">
                      R$ {item.bonusTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      {item.diasTrabalhados}
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
