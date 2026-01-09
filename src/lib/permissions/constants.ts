/**
 * Permission Constants
 * 
 * Labels, colors, and icons for roles.
 */

import type { Role } from './schemas';

/**
 * Role display labels in Portuguese
 */
export const ROLE_LABELS: Record<Role, string> = {
    admin: 'Administrador',
    gerente: 'Gerente',
    conferente: 'Conferente',
    vendedor: 'Vendedor',
};

/**
 * Role colors for UI (CSS classes)
 */
export const ROLE_COLORS: Record<Role, string> = {
    admin: 'bg-primary text-primary-foreground',
    gerente: 'bg-blue-500 text-white',
    conferente: 'bg-amber-500 text-white',
    vendedor: 'bg-emerald-500 text-white',
};

/**
 * Role badge variants for shadcn Badge
 */
export const ROLE_BADGE_VARIANTS: Record<Role, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    admin: 'default',
    gerente: 'secondary',
    conferente: 'outline',
    vendedor: 'outline',
};

/**
 * Default route for each role after login
 */
export const DEFAULT_ROUTES: Record<Role, string> = {
    admin: '/',
    gerente: '/',
    conferente: '/conferencia/lancar',
    vendedor: '/',
};
