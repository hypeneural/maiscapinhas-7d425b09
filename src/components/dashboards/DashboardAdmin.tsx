import React from 'react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { vendasDiarias, usuarios, lojas, turnos } from '@/data/mockData';
import { 
  Trophy, 
  Store, 
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export const DashboardAdmin: React.FC = () => {
  // Top 3 vendedores
  const vendedoresStats = usuarios
    .filter((u) => u.role === 'vendedor')
    .map((vendedor) => {
      const vendas = vendasDiarias
        .filter((v) => v.vendedorId === vendedor.id)
        .reduce((acc, v) => acc + v.valorVendido, 0);
      const loja = lojas.find((l) => l.id === vendedor.lojaId);
      const meta = loja?.metaMensal || 50000;
      return {
        vendedor,
        vendas,
        percentual: (vendas / meta) * 100,
      };
    })
    .sort((a, b) => b.vendas - a.vendas);

  const top3 = vendedoresStats.slice(0, 3);

  // Farol de lojas
  const lojasStats = lojas.map((loja) => {
    const vendasLoja = vendasDiarias
      .filter((v) => v.lojaId === loja.id)
      .reduce((acc, v) => acc + v.valorVendido, 0);
    const percentual = (vendasLoja / loja.metaMensal) * 100;
    const status = percentual >= 100 ? 'verde' : percentual >= 80 ? 'amarelo' : 'vermelho';
    return { loja, vendasLoja, percentual, status };
  });

  // Quebra de caixa
  const turnosDivergentes = turnos.filter((t) => t.diferenca && t.diferenca !== 0);
  const totalDivergencia = turnosDivergentes.reduce(
    (acc, t) => acc + Math.abs(t.diferenca || 0),
    0
  );
  const percentualQuebra = (totalDivergencia / 100000) * 100; // Base fictícia

  // Total de vendas da rede
  const totalVendasRede = vendasDiarias.reduce((acc, v) => acc + v.valorVendido, 0);
  const metaRede = lojas.reduce((acc, l) => acc + l.metaMensal, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          Painel de Gestão 📊
        </h1>
        <p className="text-muted-foreground">
          Visão geral da rede Mais Capinhas
        </p>
      </div>

      {/* Stats gerais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vendas da Rede"
          value={`R$ ${(totalVendasRede / 1000).toFixed(1)}k`}
          icon={TrendingUp}
          variant="secondary"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Meta da Rede"
          value={`${((totalVendasRede / metaRede) * 100).toFixed(0)}%`}
          subtitle={`de R$ ${(metaRede / 1000).toFixed(0)}k`}
          icon={Target}
          variant="primary"
        />
        <StatCard
          title="Vendedores Ativos"
          value={usuarios.filter((u) => u.role === 'vendedor' && u.ativo).length}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Quebra de Caixa"
          value={`${percentualQuebra.toFixed(2)}%`}
          subtitle={`R$ ${totalDivergencia.toFixed(2)} total`}
          icon={AlertTriangle}
          variant={percentualQuebra > 1 ? 'danger' : 'warning'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Vendedores */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Top 3 Vendedores do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {top3.map((item, index) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div
                  key={item.vendedor.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-2xl">{medals[index]}</span>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-white">
                    {item.vendedor.nome.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.vendedor.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {lojas.find((l) => l.id === item.vendedor.lojaId)?.nome}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      R$ {item.vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.percentual.toFixed(0)}% da meta
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Farol de Lojas */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-secondary" />
              Farol de Lojas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lojasStats.map((item) => (
              <div key={item.loja.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.loja.nome}</span>
                    <StatusBadge 
                      status={item.status as 'verde' | 'amarelo' | 'vermelho'} 
                      size="sm" 
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {item.percentual.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(item.percentual, 100)} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    R$ {item.vendasLoja.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span>
                    Meta: R$ {item.loja.metaMensal.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Maiores Divergências */}
      <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Maiores Divergências de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Vendedor</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Loja</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Data</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Diferença</th>
                  <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {turnosDivergentes.map((turno) => {
                  const vendedor = usuarios.find((u) => u.id === turno.vendedorId);
                  const loja = lojas.find((l) => l.id === turno.lojaId);
                  return (
                    <tr key={turno.id} className="border-b last:border-0">
                      <td className="py-3">{vendedor?.nome}</td>
                      <td className="py-3 text-muted-foreground">{loja?.codigo}</td>
                      <td className="py-3 text-muted-foreground">{turno.data}</td>
                      <td className="py-3 text-right font-medium text-destructive">
                        R$ {Math.abs(turno.diferenca || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge 
                          status={turno.justificado ? 'conferido' : 'divergente'} 
                          label={turno.justificado ? 'Justificado' : 'Pendente'}
                          size="sm" 
                        />
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
