import React from 'react';
import { vendasDiarias, tabelaBonus } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from '@/components/StatCard';

const MeusBonus: React.FC = () => {
  const { user } = useAuth();
  
  const minhasVendas = vendasDiarias
    .filter((v) => String(v.vendedorId) === String(user?.id))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const totalBonus = minhasVendas.reduce((acc, v) => acc + v.bonusGanho, 0);
  const diasComBonus = minhasVendas.filter((v) => v.bonusGanho > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Gift className="w-6 h-6 text-accent" />
          Meus Bônus
        </h1>
        <p className="text-muted-foreground">
          Bônus diários acumulados (sujeito à conferência de caixa)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Acumulado"
          value={`R$ ${totalBonus.toFixed(2)}`}
          icon={Gift}
          variant="secondary"
        />
        <StatCard
          title="Dias com Bônus"
          value={diasComBonus}
          subtitle={`de ${minhasVendas.length} dias`}
          variant="success"
        />
        <StatCard
          title="Média por Dia"
          value={`R$ ${(totalBonus / (diasComBonus || 1)).toFixed(2)}`}
          variant="primary"
        />
      </div>

      {/* Tabela de Faixas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tabela de Bônus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {tabelaBonus.map((faixa) => (
              <div
                key={faixa.id}
                className="p-4 rounded-lg bg-muted/50 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  R$ {faixa.faixaMinima.toLocaleString('pt-BR')}+
                </p>
                <p className="text-2xl font-bold text-secondary">
                  R$ {faixa.valorBonus}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Bônus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {minhasVendas.map((venda) => (
              <div
                key={venda.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {venda.bonusGanho > 0 ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {new Date(venda.data).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vendas: R$ {venda.valorVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-bold ${
                    venda.bonusGanho > 0 ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {venda.bonusGanho > 0 ? `+R$ ${venda.bonusGanho.toFixed(2)}` : '-'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeusBonus;
