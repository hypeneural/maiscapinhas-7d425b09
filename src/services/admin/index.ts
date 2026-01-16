/**
 * Admin Services Barrel Export
 * 
 * Re-exports all admin services for easy importing.
 */

export { usersService, default as usersServiceDefault } from './users.service';
export { storesService, default as storesServiceDefault } from './stores.service';
export { goalsService, default as goalsServiceDefault } from './goals.service';
export { rulesService, bonusRulesService, commissionRulesService, default as rulesServiceDefault } from './rules.service';
export { auditService, default as auditServiceDefault } from './audit.service';
export { whatsAppInstancesService, default as whatsAppInstancesServiceDefault } from './whatsapp-instances.service';
export { modulesService, default as modulesServiceDefault } from './modules.service';
export { permissionsService, default as permissionsServiceDefault } from './permissions.service';
export { rolesService, default as rolesServiceDefault } from './roles.service';

// Re-export all service functions for direct import if needed
export * from './users.service';
export * from './stores.service';
export * from './goals.service';
export * from './rules.service';
export * from './audit.service';
export * from './whatsapp-instances.service';
export * from './modules.service';
export * from './permissions.service';
export * from './roles.service';
