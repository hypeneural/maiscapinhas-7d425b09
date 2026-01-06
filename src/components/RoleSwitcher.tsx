import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  conferente: 'Conferente',
  vendedor: 'Vendedor',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-primary text-primary-foreground',
  gerente: 'bg-secondary text-secondary-foreground',
  conferente: 'bg-warning/20 text-warning-foreground',
  vendedor: 'bg-success/20 text-success',
};

export const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-2 bg-muted rounded-lg border border-dashed border-warning">
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
        DEV
      </Badge>
      <Select value={user.role} onValueChange={(value) => switchRole(value as UserRole)}>
        <SelectTrigger className="w-40 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(roleLabels) as UserRole[]).map((role) => (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${roleColors[role]}`} />
                {roleLabels[role]}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
