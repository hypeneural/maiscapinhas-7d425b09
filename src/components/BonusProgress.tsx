import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Gift } from 'lucide-react';

interface BonusProgressProps {
  valorVendido: number;
  proximaFaixa: number;
  valorBonus: number;
}

export const BonusProgress: React.FC<BonusProgressProps> = ({
  valorVendido,
  proximaFaixa,
  valorBonus,
}) => {
  const faltam = proximaFaixa - valorVendido;
  const progressoFaixa = Math.min((valorVendido / proximaFaixa) * 100, 100);

  if (faltam <= 0) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-xl p-4 animate-in-scale">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-semibold text-success">Parabéns! 🎉</p>
            <p className="text-sm text-success/80">
              Você garantiu o bônus de R$ {valorBonus.toFixed(2)}!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium">Próximo bônus</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Meta: R$ {proximaFaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out',
              progressoFaixa >= 80
                ? 'bg-gradient-to-r from-secondary to-success'
                : 'bg-gradient-to-r from-primary to-secondary'
            )}
            style={{ width: `${progressoFaixa}%` }}
          />
        </div>
        {/* Gift icon at end */}
        <div
          className="absolute -top-1 right-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-glow-accent"
        >
          <Gift className="w-3 h-3 text-accent-foreground" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm">
          Faltam{' '}
          <span className="font-bold text-secondary">
            R$ {faltam.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>{' '}
          para ganhar{' '}
          <span className="font-bold text-accent">
            R$ {valorBonus.toFixed(2)}
          </span>
        </p>
        <span className="text-xs font-medium text-muted-foreground">
          {progressoFaixa.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
