/**
 * InfoTooltip Component
 * 
 * A reusable tooltip with an info icon for displaying explanatory text.
 * Used throughout the dashboard to provide context for KPIs and metrics.
 */

import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  /** Tooltip content to display */
  content: string;
  /** Optional children to wrap with tooltip (defaults to info icon) */
  children?: React.ReactNode;
  /** Side to display tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Additional className for the trigger */
  className?: string;
  /** Size of the info icon */
  iconSize?: 'sm' | 'md' | 'lg';
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  children,
  side = 'top',
  className,
  iconSize = 'sm',
}) => {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {children ? (
          <span className={cn('cursor-help', className)}>{children}</span>
        ) : (
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-help',
              className
            )}
            aria-label="Mais informações"
          >
            <Info className={iconSizes[iconSize]} />
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-sm">
        {content}
      </TooltipContent>
    </Tooltip>
  );
};

export default InfoTooltip;
