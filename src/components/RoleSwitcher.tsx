/**
 * RoleSwitcher Component
 * 
 * Development-only component to switch between user roles.
 * Uses usePermissions hook for role management.
 */

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, type Role } from '@/lib/permissions';

const roleColors: Record<Role, string> = {
  admin: 'bg-primary text-primary-foreground',
  gerente: 'bg-secondary text-secondary-foreground',
  conferente: 'bg-warning/20 text-warning-foreground',
  vendedor: 'bg-success/20 text-success',
};

export const RoleSwitcher: React.FC = () => {
  const { currentRole, currentStore, setCurrentStore, stores } = usePermissions();

  if (!currentStore || stores.length <= 1) return null;

  // For dev purposes, show store switcher (which also changes role context)
  return (
    <div className="flex items-center gap-3 p-2 bg-muted rounded-lg border border-dashed border-warning">
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
        DEV
      </Badge>
      <Select 
        value={String(currentStore.id)} 
        onValueChange={(value) => setCurrentStore(parseInt(value))}
      >
        <SelectTrigger className="w-48 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store.id} value={String(store.id)}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${roleColors[store.role]}`} />
                {store.name} ({ROLE_LABELS[store.role]})
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentRole && (
        <Badge className={roleColors[currentRole]}>
          {ROLE_LABELS[currentRole]}
        </Badge>
      )}
    </div>
  );
};
