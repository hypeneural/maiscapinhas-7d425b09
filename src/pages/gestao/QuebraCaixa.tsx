import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, User, Store, Calendar, AlertCircle, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { usuarios, lojas, turnos } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const QuebraCaixa: React.FC = () => {
  const [selectedLoja, setSelectedLoja] = useState<string>('todas');
  const [periodo, setPeriodo] = useState<string>('mes');

  // Calcular quebras por vendedor
  const vendedores = usuarios.filter(u => u.role === 'vendedor' && u.ativo);
  
  const quebrasPorVendedor = vendedores.map(vendedor => {
    const loja = lojas.find(l => l.id === vendedor.lojaId);
    const turnosVendedor = turnos.filter(t => t.vendedorId === vendedor.id);
    const turnosComDivergencia = turnosVendedor.filter(t => t.diferenca && t.diferenca !== 0);
    const totalDivergencia = turnosComDivergencia.reduce((acc, t) => acc + Math.abs(t.diferenca || 0), 0);
    const percentualQuebra = turnosVendedor.length > 0 
      ? (turnosComDivergencia.length / turnosVendedor.length) * 100 
      : 0;
    const turnosJustificados = turnosComDivergencia.filter(t => t.justificado).length;

    return {
      vendedor,
      loja,
      totalTurnos: turnosVendedor.length,
      turnosComDivergencia: turnosComDivergencia.length,
      turnosJustificados,
      turnosNaoJustificados: turnosComDivergencia.length - turnosJustificados,
      totalDivergencia,
      percentualQuebra,
    };
  }).sort((a, b) => b.percentualQuebra - a.percentualQuebra);

  // Filtrar por loja
  const quebrasFiltradas = selectedLoja === 'todas'
    ? quebrasPorVendedor
    : quebrasPorVendedor.filter(q => q.loja?.id === selectedLoja);

  // Estatísticas gerais
  const totalQuebrasRede = quebrasFiltradas.reduce((acc, q) => acc + q.totalDivergencia, 0);
  const turnosTotais = quebrasFiltradas.reduce((acc, q) => acc + q.totalTurnos, 0);
  const turnosComProblema = quebrasFiltradas.reduce((acc, q) => acc + q.turnosComDivergencia, 0);
  const percentualGeralQuebra = turnosTotais > 0 ? (turnosComProblema / turnosTotais) * 100 : 0;

  // Dados para gráfico
  const chartData = quebrasFiltradas.slice(0, 6).map(q => ({
    name: q.vendedor.nome.split(' ')[0],
    valor: q.totalDivergencia,
    percentual: q.percentualQuebra,
  }));

  // Dados para gráfico de pizza
  const pieData = [
    { name: 'Sem Divergência', value: turnosTotais - turnosComProblema, color: 'hsl(var(--secondary))' },
    { name: 'Justificados', value: quebrasFiltradas.reduce((acc, q) => acc + q.turnosJustificados, 0), color: 'hsl(var(--accent))' },
    { name: 'Não Justificados', value: quebrasFiltradas.reduce((acc, q) => acc + q.turnosNaoJustificados, 0), color: 'hsl(var(--destructive))' },
  ];

  const getRiskLevel = (percentual: number): 'success' | 'warning' | 'error' => {
    if (percentual <= 5) return 'success';
    if (percentual <= 15) return 'warning';
    return 'error';
  };

  const getRiskLabel = (percentual: number): string => {
    if (percentual <= 5) return 'Baixo';
    if (percentual <= 15) return 'Médio';
    return 'Alto';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quebra de Caixa"
        description="Análise de divergências e riscos operacionais"
        icon={AlertTriangle}
        actions={
          <div className="flex gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mês</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn(
          'relative overflow-hidden',
          percentualGeralQuebra > 10 && 'ring-2 ring-destructive/50'
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">% Quebra da Rede</p>
                <p className="text-3xl font-bold">{percentualGeralQuebra.toFixed(1)}%</p>
              </div>
              <div className={cn(
                'p-3 rounded-full',
                percentualGeralQuebra <= 5 && 'bg-green-500/20',
                percentualGeralQuebra > 5 && percentualGeralQuebra <= 15 && 'bg-yellow-500/20',
                percentualGeralQuebra > 15 && 'bg-red-500/20'
              )}>
                <AlertTriangle className={cn(
                  'w-6 h-6',
                  percentualGeralQuebra <= 5 && 'text-green-600',
                  percentualGeralQuebra > 5 && percentualGeralQuebra <= 15 && 'text-yellow-600',
                  percentualGeralQuebra > 15 && 'text-red-600'
                )} />
              </div>
            </div>
            <StatusBadge variant={getRiskLevel(percentualGeralQuebra)} className="mt-2">
              Risco {getRiskLabel(percentualGeralQuebra)}
            </StatusBadge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Divergências</p>
                <p className="text-2xl font-bold text-destructive">
                  R$ {totalQuebrasRede.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turnos com Problema</p>
                <p className="text-2xl font-bold">{turnosComProblema}/{turnosTotais}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendedores em Risco</p>
                <p className="text-2xl font-bold text-destructive">
                  {quebrasFiltradas.filter(q => q.percentualQuebra > 15).length}
                </p>
              </div>
              <User className="w-6 h-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Quebras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <TrendingDown className="w-5 h-5" />
              Maiores Divergências por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `R$ ${v}`} />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Divergência']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.percentual > 15 ? 'hsl(var(--destructive))' : entry.percentual > 5 ? 'hsl(var(--accent))' : 'hsl(var(--secondary))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Turnos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Turnos</CardTitle>
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
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Turnos']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Vendedor</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold">Risco</th>
                  <th className="text-left py-3 px-4 font-semibold">Vendedor</th>
                  <th className="text-left py-3 px-4 font-semibold">Loja</th>
                  <th className="text-center py-3 px-4 font-semibold">Turnos</th>
                  <th className="text-center py-3 px-4 font-semibold">Divergências</th>
                  <th className="text-center py-3 px-4 font-semibold">Justificados</th>
                  <th className="text-right py-3 px-4 font-semibold">Valor Total</th>
                  <th className="text-center py-3 px-4 font-semibold">% Quebra</th>
                </tr>
              </thead>
              <tbody>
                {quebrasFiltradas.map((item) => (
                  <tr 
                    key={item.vendedor.id} 
                    className={cn(
                      'border-b transition-colors hover:bg-muted/50',
                      item.percentualQuebra > 15 && 'bg-destructive/5'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        item.percentualQuebra <= 5 && 'bg-green-500',
                        item.percentualQuebra > 5 && item.percentualQuebra <= 15 && 'bg-yellow-500',
                        item.percentualQuebra > 15 && 'bg-red-500'
                      )} />
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
                    <td className="py-3 px-4 text-center">{item.totalTurnos}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn(
                        'font-medium',
                        item.turnosComDivergencia > 0 && 'text-destructive'
                      )}>
                        {item.turnosComDivergencia}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-muted-foreground">
                        {item.turnosJustificados}/{item.turnosComDivergencia}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-destructive">
                      R$ {item.totalDivergencia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge variant={getRiskLevel(item.percentualQuebra)}>
                        {item.percentualQuebra.toFixed(1)}%
                      </StatusBadge>
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

export default QuebraCaixa;
