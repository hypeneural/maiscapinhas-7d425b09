import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  endTime: Date;
  label?: string;
  onComplete?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTime,
  label = 'Fim do turno em',
  onComplete,
}) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        onComplete?.();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setIsUrgent(hours === 0 && minutes < 30);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
        isUrgent
          ? 'bg-destructive/10 border-destructive/30 animate-pulse'
          : 'bg-card border-border'
      )}
    >
      <Clock
        className={cn(
          'w-5 h-5',
          isUrgent ? 'text-destructive' : 'text-secondary'
        )}
      />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              'font-display text-2xl font-bold tabular-nums',
              isUrgent ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:
            {formatNumber(timeLeft.seconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
