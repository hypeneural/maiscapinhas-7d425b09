import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { GaugeChart } from '@/components/GaugeChart';
import { CountdownTimer } from '@/components/CountdownTimer';
import { BonusProgress } from '@/components/BonusProgress';
import { StatCard } from '@/components/StatCard';
import { vendasDiarias, calcularProximoBonus, lojas } from '@/data/mockData';
import { Wallet, TrendingUp, Target, Calendar } from 'lucide-react';

export const DashboardVendedor: React.FC = () => {
  const { user } = useAuth();
  const { currentStore } = usePermissions();

  // Mock data para o vendedor logado (comparing with String for mock compatibility)
  const vendaHoje = vendasDiarias.find(
    (v) => String(v.vendedorId) === String(user?.id) && v.data === '2026-01-06'
  ) || {
    valorVendido: 1250.50,
    metaDia: 1666.67,
    bonusGanho: 25,
  };

  const loja = lojas.find((l) => String(l.id) === String(currentStore?.id));
  const metaMes = loja?.metaMensal || 50000;
  const metaDia = metaMes / 30;

  // Vendas acumuladas do mês
  const vendasMes = vendasDiarias
    .filter((v) => String(v.vendedorId) === String(user?.id))
    .reduce((acc, v) => acc + v.valorVendido, 0);
  const percentualMes = (vendasMes / metaMes) * 100;

  // Próximo bônus
  const proximoBonus = calcularProximoBonus(vendaHoje.valorVendido);

  // Fim do turno (mock: 18h de hoje)
  const fimTurno = new Date();
  fimTurno.setHours(18, 0, 0, 0);

  // Comissão projetada
  const comissaoPercentual = percentualMes >= 120 ? 4 : percentualMes >= 100 ? 3 : percentualMes >= 80 ? 2 : 0;
  const comissaoProjetada = (vendasMes * comissaoPercentual) / 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Olá, {user?.name?.split(' ')[0] || 'Vendedor'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Vamos bater a meta hoje? Você consegue!
          </p>
        </div>
        <CountdownTimer endTime={fimTurno} />
      </div>

      {/* Gauge Central */}
      <div className="bg-card rounded-2xl border p-6 shadow-lg animate-fade-in">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold">Performance do Dia</h2>
          <p className="text-sm text-muted-foreground">
            {loja?.nome || currentStore?.name || 'Sua loja'}
          </p>
        </div>
        <div className="flex justify-center">
          <GaugeChart
            value={vendaHoje.valorVendido}
            max={metaDia}
            label="da meta diária"
            size="lg"
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-2xl font-display font-bold text-secondary">
            R$ {vendaHoje.valorVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">vendidos hoje</p>
        </div>
      </div>

      {/* Próximo Bônus */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <BonusProgress
          valorVendido={vendaHoje.valorVendido}
          proximaFaixa={vendaHoje.valorVendido + proximoBonus.faltam}
          valorBonus={proximoBonus.valorBonus}
        />
      </div>

      {/* Stats do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vendas do Mês"
          value={`R$ ${vendasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          variant="secondary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Meta Mensal"
          value={`${percentualMes.toFixed(0)}%`}
          subtitle={`de R$ ${metaMes.toLocaleString('pt-BR')}`}
          icon={Target}
          variant={percentualMes >= 100 ? 'success' : percentualMes >= 80 ? 'warning' : 'danger'}
        />
        <StatCard
          title="Comissão Projetada"
          value={`R$ ${comissaoProjetada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          subtitle={`${comissaoPercentual}% sobre vendas`}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Dias Trabalhados"
          value="4"
          subtitle="de 22 dias úteis"
          icon={Calendar}
          variant="default"
        />
      </div>
    </div>
  );
};
