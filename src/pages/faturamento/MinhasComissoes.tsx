import React from 'react';
import { vendasDiarias, regrasComissao, lojas } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, Wallet } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Progress } from '@/components/ui/progress';

const MinhasComissoes: React.FC = () => {
  const { user } = useAuth();
  const { currentStore } = usePermissions();
  
  const minhasVendas = vendasDiarias.filter((v) => String(v.vendedorId) === String(user?.id));
  const totalVendas = minhasVendas.reduce((acc, v) => acc + v.valorVendido, 0);
  
  const loja = lojas.find((l) => String(l.id) === String(currentStore?.id));
  const metaMensal = loja?.metaMensal || 50000;
  const percentualMeta = (totalVendas / metaMensal) * 100;

  // Determina a faixa de comissão
  const regraAtual = [...regrasComissao]
    .sort((a, b) => b.percentualMeta - a.percentualMeta)
    .find((r) => percentualMeta >= r.percentualMeta);

  const proximaRegra = regrasComissao.find(
    (r) => r.percentualMeta > percentualMeta
  );

  const comissaoAtual = regraAtual?.percentualComissao || 0;
  const valorComissao = (totalVendas * comissaoAtual) / 100;

  const faltaParaProxima = proximaRegra
    ? (metaMensal * proximaRegra.percentualMeta) / 100 - totalVendas
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-secondary" />
          Minhas Comissões
        </h1>
        <p className="text-muted-foreground">
          Previsão de comissão baseada no atingimento da meta mensal
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Vendas do Mês"
          value={`R$ ${totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          variant="secondary"
        />
        <StatCard
          title="Meta Atingida"
          value={`${percentualMeta.toFixed(0)}%`}
          subtitle={`de R$ ${metaMensal.toLocaleString('pt-BR')}`}
          icon={Target}
          variant={percentualMeta >= 100 ? 'success' : percentualMeta >= 80 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Comissão Projetada"
          value={`R$ ${valorComissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${comissaoAtual}% sobre vendas`}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      {/* Faixas de Comissão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faixas de Comissão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {regrasComissao.map((regra) => {
            const isAtual = regraAtual?.id === regra.id;
            const atingido = percentualMeta >= regra.percentualMeta;

            return (
              <div
                key={regra.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isAtual
                    ? 'border-secondary bg-secondary/5'
                    : atingido
                    ? 'border-success/30 bg-success/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {regra.percentualMeta}% da meta
                    </span>
                    {isAtual && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                        Sua faixa atual
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-secondary">
                    {regra.percentualComissao}%
                  </span>
                </div>
                <Progress
                  value={Math.min((percentualMeta / regra.percentualMeta) * 100, 100)}
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Meta: R$ {((metaMensal * regra.percentualMeta) / 100).toLocaleString('pt-BR')}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Próxima faixa */}
      {proximaRegra && faltaParaProxima > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-6 text-center">
            <p className="text-lg">
              Faltam{' '}
              <span className="font-bold text-primary">
                R$ {faltaParaProxima.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>{' '}
              para subir para{' '}
              <span className="font-bold text-secondary">
                {proximaRegra.percentualComissao}% de comissão
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MinhasComissoes;
