import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface GaugeChartProps {
  value: number;
  max: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  formatValue?: (value: number) => string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max,
  label,
  size = 'lg',
  showPercentage = true,
  formatValue = (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const status = useMemo(() => {
    if (percentage >= 100) return 'verde';
    if (percentage >= 80) return 'amarelo';
    return 'vermelho';
  }, [percentage]);

  const strokeColor = useMemo(() => {
    if (status === 'verde') return 'stroke-success';
    if (status === 'amarelo') return 'stroke-warning';
    return 'stroke-destructive';
  }, [status]);

  const bgGlow = useMemo(() => {
    if (status === 'verde') return 'drop-shadow-[0_0_15px_hsl(var(--success)/0.4)]';
    if (status === 'amarelo') return 'drop-shadow-[0_0_15px_hsl(var(--warning)/0.4)]';
    return 'drop-shadow-[0_0_15px_hsl(var(--destructive)/0.4)]';
  }, [status]);

  const sizeConfig = {
    sm: { width: 120, strokeWidth: 8, fontSize: 'text-lg' },
    md: { width: 180, strokeWidth: 12, fontSize: 'text-2xl' },
    lg: { width: 280, strokeWidth: 16, fontSize: 'text-4xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius * 0.75; // 270 degrees
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative', bgGlow)} style={{ width: config.width, height: config.width * 0.8 }}>
        <svg
          width={config.width}
          height={config.width}
          viewBox={`0 0 ${config.width} ${config.width}`}
          className="transform -rotate-[135deg]"
        >
          {/* Background arc */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
          />
          {/* Foreground arc */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            className={cn(strokeColor, 'transition-all duration-1000 ease-out')}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ '--gauge-offset': offset } as React.CSSProperties}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <span className={cn('font-display font-bold', config.fontSize)}>
            {showPercentage ? `${Math.round(percentage)}%` : formatValue(value)}
          </span>
          {label && (
            <span className="text-muted-foreground text-sm mt-1">{label}</span>
          )}
        </div>
      </div>
      
      {/* Value labels */}
      <div className="flex justify-between w-full mt-2 px-4">
        <span className="text-sm text-muted-foreground">R$ 0</span>
        <span className="text-sm font-medium">Meta: {formatValue(max)}</span>
      </div>
    </div>
  );
};
