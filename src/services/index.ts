// Export all services
// Note: dashboard.service and reports.service have overlapping exports
// Import them directly when needed to avoid naming conflicts
export * from './auth.service';
export * from './sales.service';
export * from './cash.service';
export * from './finance.service';
export * from './stores.service';

// Re-export specific dashboard functions to avoid conflicts
export {
    getSellerDashboard,
    getConferenteDashboard,
    getAdminDashboard,
    getPendingShifts as getDashboardPendingShifts,
    getDivergentShifts as getDashboardDivergentShifts,
    dashboardService,
} from './dashboard.service';

// Re-export specific report functions
export {
    getRanking,
    getConsolidatedPerformance,
    getStorePerformance,
    getCashIntegrity,
    getBirthdays,
} from './reports.service';
