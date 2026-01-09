/**
 * StoreSwitcher Component
 * 
 * Allows users with access to multiple stores to switch between them.
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import { cn } from '@/lib/utils';

export const StoreSwitcher: React.FC = () => {
    const { user } = useAuth();
    const { stores, currentStore, setCurrentStore } = usePermissions();

    // Don't show if user has access to only one store
    if (!user || stores.length <= 1) {
        // Still show current store info if available
        if (currentStore) {
            return (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{currentStore.name}</span>
                    <Badge variant="outline" className="text-xs">
                        {ROLE_LABELS[currentStore.role]}
                    </Badge>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <Select
                value={String(currentStore?.id || '')}
                onValueChange={(value) => setCurrentStore(parseInt(value, 10))}
            >
                <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                    {stores.map((store) => (
                        <SelectItem key={store.id} value={String(store.id)}>
                            <div className="flex items-center gap-2">
                                <span>{store.name}</span>
                                <span
                                    className={cn(
                                        'text-[10px] px-1.5 py-0.5 rounded-full',
                                        ROLE_COLORS[store.role]
                                    )}
                                >
                                    {ROLE_LABELS[store.role]}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
