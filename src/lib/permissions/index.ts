/**
 * Permission System
 * 
 * Barrel export for all permission-related types and utilities.
 */

// Schemas & Types
export {
    roleSchema,
    storeWithRoleSchema,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS,
    roleHasPermission,
    isRoleAtLeast,
    getHighestRoleFromStores,
} from './schemas';

export type { Role, Permission, StoreWithRole } from './schemas';

// Constants
export {
    ROLE_LABELS,
    ROLE_COLORS,
    ROLE_BADGE_VARIANTS,
    DEFAULT_ROUTES,
} from './constants';
