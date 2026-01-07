import React, { useState } from 'react';
import { Store, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { lojas, vendasDiarias, usuarios } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const DesempenhoLojas: React.FC = () => {
  const [periodo, setPeriodo] = useState<string>('mes');

  // Calcular desempenho por loja
  const desempenhoLojas = lojas.map(loja => {
    const vendedoresLoja = usuarios.filter(u => u.lojaId === loja.id && u.role === 'vendedor');
    const vendasLoja = vendasDiarias.filter(v => v.lojaId === loja.id);
    const totalVendido = vendasLoja.reduce((acc, v) => acc + v.valorVendido, 0);
    const metaTotal = vendasLoja.reduce((acc, v) => acc + v.metaDia, 0);
    const percentualMeta = metaTotal > 0 ? (totalVendido / metaTotal) * 100 : 0;
    
    // Simulando dados do ano anterior (para comparativo)
    const totalAnoAnterior = totalVendido * (0.8 + Math.random() * 0.4);
    const crescimento = ((totalVendido - totalAnoAnterior) / totalAnoAnterior) * 100;

    return {
      loja,
      totalVendido,
      metaTotal,
      percentualMeta,
      totalAnoAnterior,
      crescimento,
      vendedoresAtivos: vendedoresLoja.length,
      status: percentualMeta >= 100 ? 'verde' : percentualMeta >= 80 ? 'amarelo' : 'vermelho' as 'verde' | 'amarelo' | 'vermelho',
    };
  }).sort((a, b) => b.percentualMeta - a.percentualMeta);

  const chartData = desempenhoLojas.map(d => ({
    name: d.loja.nome.split(' - ')[1] || d.loja.nome,
    atual: d.totalVendido,
    anterior: d.totalAnoAnterior,
    meta: d.metaTotal,
  }));

  // Dados para gráfico de evolução mensal (simulado)
  const evolucaoMensal = [
    { mes: 'Jan', atual: 45000, anterior: 42000 },
    { mes: 'Fev', atual: 52000, anterior: 48000 },
    { mes: 'Mar', atual: 48000, anterior: 51000 },
    { mes: 'Abr', atual: 61000, anterior: 55000 },
    { mes: 'Mai', atual: 58000, anterior: 52000 },
    { mes: 'Jun', atual: 67000, anterior: 58000 },
  ];

  // Dados para gráfico de pizza (distribuição de vendas)
  const pieData = desempenhoLojas.map(d => ({
    name: d.loja.nome.split(' - ')[1] || d.loja.nome,
    value: d.totalVendido,
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))'];

  const totalRede = desempenhoLojas.reduce((acc, d) => acc + d.totalVendido, 0);
  const metaRede = desempenhoLojas.reduce((acc, d) => acc + d.metaTotal, 0);
  const percentualRede = metaRede > 0 ? (totalRede / metaRede) * 100 : 0;

  const getStatusColor = (status: 'verde' | 'amarelo' | 'vermelho') => {
    switch (status) {
      case 'verde': return 'bg-green-500';
      case 'amarelo': return 'bg-yellow-500';
      case 'vermelho': return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Desempenho por Loja"
        description="Análise comparativa de todas as unidades da rede"
        icon={Store}
        actions={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Resumo da Rede */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total da Rede</p>
                <p className="text-2xl font-bold">
                  R$ {totalRede.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meta da Rede</p>
                <p className="text-2xl font-bold">
                  R$ {metaRede.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <StatusBadge
                variant={percentualRede >= 100 ? 'success' : percentualRede >= 80 ? 'warning' : 'error'}
                className="text-lg"
              >
                {percentualRede.toFixed(0)}%
              </StatusBadge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lojas Ativas</p>
                <p className="text-2xl font-bold">{lojas.filter(l => l.ativo).length}</p>
              </div>
              <Store className="w-6 h-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Batendo Meta</p>
                <p className="text-2xl font-bold text-green-600">
                  {desempenhoLojas.filter(d => d.status === 'verde').length}/{desempenhoLojas.length}
                </p>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Atual vs Ano Anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="atual" name="Atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anterior" name="Ano Anterior" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoMensal}>
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="atual" 
                    name="2026" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="anterior" 
                    name="2025" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição e Farol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Vendas</CardTitle>
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
                  <Tooltip
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

        {/* Farol de Lojas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Farol de Lojas</CardTitle>
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
                    <th className="text-center py-3 px-4 font-semibold">Crescimento</th>
                  </tr>
                </thead>
                <tbody>
                  {desempenhoLojas.map((item) => (
                    <tr key={item.loja.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className={cn('w-4 h-4 rounded-full', getStatusColor(item.status))} />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{item.loja.nome}</p>
                          <p className="text-xs text-muted-foreground">{item.vendedoresAtivos} vendedores</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        R$ {item.totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        R$ {item.metaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          variant={item.status === 'verde' ? 'success' : item.status === 'amarelo' ? 'warning' : 'error'}
                        >
                          {item.percentualMeta.toFixed(0)}%
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-4">
                        <div className={cn(
                          'flex items-center justify-center gap-1 text-sm font-medium',
                          item.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {item.crescimento >= 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          {Math.abs(item.crescimento).toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DesempenhoLojas;
