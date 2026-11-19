/**
 * ViewToggle Component
 * 
 * Toggle between table and kanban view modes.
 */

import React from 'react';
import { LayoutList, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'kanban';

interface ViewToggleProps {
    mode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onModeChange }: ViewToggleProps) {
    return (
        <div className="flex items-center gap-0.5 border rounded-lg p-0.5 bg-muted/30">
            <Button
                variant={mode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                    'h-7 px-2.5 text-xs gap-1.5 transition-all',
                    mode === 'table' ? 'shadow-sm' : 'hover:bg-muted'
                )}
                onClick={() => onModeChange('table')}
            >
                <LayoutList className="h-3.5 w-3.5" />
                Tabela
            </Button>
            <Button
                variant={mode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                    'h-7 px-2.5 text-xs gap-1.5 transition-all',
                    mode === 'kanban' ? 'shadow-sm' : 'hover:bg-muted'
                )}
                onClick={() => onModeChange('kanban')}
            >
                <Columns3 className="h-3.5 w-3.5" />
                Kanban
            </Button>
        </div>
    );
}
