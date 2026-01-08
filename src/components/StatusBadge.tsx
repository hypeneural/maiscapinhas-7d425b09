import { cn } from '@/lib/utils';

type StatusType = 'verde' | 'amarelo' | 'vermelho' | 'pendente' | 'conferido' | 'divergente';
type VariantType = 'success' | 'warning' | 'error' | 'default' | 'info';

interface StatusBadgeProps {
  status?: StatusType;
  variant?: VariantType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const statusConfig = {
  verde: {
    classes: 'bg-success/10 text-success border-success/30',
    label: 'Meta batida',
    dotClass: 'bg-success',
  },
  amarelo: {
    classes: 'bg-warning/10 text-warning border-warning/30',
    label: 'Atenção',
    dotClass: 'bg-warning',
  },
  vermelho: {
    classes: 'bg-destructive/10 text-destructive border-destructive/30',
    label: 'Crítico',
    dotClass: 'bg-destructive',
  },
  pendente: {
    classes: 'bg-muted text-muted-foreground border-border',
    label: 'Pendente',
    dotClass: 'bg-muted-foreground',
  },
  conferido: {
    classes: 'bg-success/10 text-success border-success/30',
    label: 'Conferido',
    dotClass: 'bg-success',
  },
  divergente: {
    classes: 'bg-destructive/10 text-destructive border-destructive/30',
    label: 'Divergente',
    dotClass: 'bg-destructive',
  },
};

const variantConfig = {
  success: {
    classes: 'bg-success/10 text-success border-success/30',
    dotClass: 'bg-success',
  },
  warning: {
    classes: 'bg-warning/10 text-warning border-warning/30',
    dotClass: 'bg-warning',
  },
  error: {
    classes: 'bg-destructive/10 text-destructive border-destructive/30',
    dotClass: 'bg-destructive',
  },
  default: {
    classes: 'bg-muted text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
  },
  info: {
    classes: 'bg-primary/10 text-primary border-primary/30',
    dotClass: 'bg-primary',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  label,
  size = 'md',
  pulse = false,
  className,
  children,
}) => {
  // Determine config based on status or variant
  const config = status
    ? statusConfig[status]
    : variant
    ? variantConfig[variant]
    : variantConfig.default;

  const displayLabel = children || label || (status ? statusConfig[status]?.label : null);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
        config.classes,
        sizeConfig[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', config.dotClass)} />
      {displayLabel}
    </span>
  );
};
