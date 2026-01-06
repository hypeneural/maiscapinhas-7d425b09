import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'verde' | 'amarelo' | 'vermelho' | 'pendente' | 'conferido' | 'divergente';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const statusConfig = {
  verde: {
    classes: 'bg-success/10 text-success border-success/30',
    label: 'Meta batida',
  },
  amarelo: {
    classes: 'bg-warning/10 text-warning border-warning/30',
    label: 'Atenção',
  },
  vermelho: {
    classes: 'bg-destructive/10 text-destructive border-destructive/30',
    label: 'Crítico',
  },
  pendente: {
    classes: 'bg-muted text-muted-foreground border-border',
    label: 'Pendente',
  },
  conferido: {
    classes: 'bg-success/10 text-success border-success/30',
    label: 'Conferido',
  },
  divergente: {
    classes: 'bg-destructive/10 text-destructive border-destructive/30',
    label: 'Divergente',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  pulse = false,
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
        config.classes,
        sizeConfig[size],
        pulse && 'animate-pulse'
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'verde' || status === 'conferido' ? 'bg-success' : '',
          status === 'amarelo' ? 'bg-warning' : '',
          status === 'vermelho' || status === 'divergente' ? 'bg-destructive' : '',
          status === 'pendente' ? 'bg-muted-foreground' : ''
        )}
      />
      {label || config.label}
    </span>
  );
};
