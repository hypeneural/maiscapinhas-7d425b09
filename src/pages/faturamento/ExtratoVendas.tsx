import React from 'react';
import { vendasDiarias, lojas } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

const ExtratoVendas: React.FC = () => {
  const { user } = useAuth();
  const { currentStore } = usePermissions();
  
  const minhasVendas = vendasDiarias
    .filter((v) => String(v.vendedorId) === String(user?.id))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const loja = lojas.find((l) => String(l.id) === String(currentStore?.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Extrato de Vendas
        </h1>
        <p className="text-muted-foreground">
          Histórico dos seus dias trabalhados em {loja?.nome || currentStore?.name || 'sua loja'}
        </p>
      </div>

      <div className="space-y-4">
        {minhasVendas.map((venda, index) => {
          const percentual = (venda.valorVendido / venda.metaDia) * 100;
          const batiuMeta = percentual >= 100;

          return (
            <Card
              key={venda.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        batiuMeta ? 'bg-success/10' : 'bg-destructive/10'
                      }`}
                    >
                      {batiuMeta ? (
                        <TrendingUp className="w-6 h-6 text-success" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {new Date(venda.data).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Meta: R$ {venda.metaDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-xl font-bold">
                        R$ {venda.valorVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {percentual.toFixed(0)}% da meta
                      </p>
                    </div>
                    <StatusBadge
                      status={batiuMeta ? 'verde' : 'vermelho'}
                      label={batiuMeta ? 'Meta ✓' : 'Abaixo'}
                      size="sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {minhasVendas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma venda registrada ainda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExtratoVendas;
