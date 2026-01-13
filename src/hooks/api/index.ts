// Export all API hooks
// Note: use-dashboard and use-reports have overlapping exports
// Import specific hooks directly from their modules when needed
export * from './use-auth';
export * from './use-sales';
export * from './use-cash';
export * from './use-finance';
export * from './use-stores';

// Re-export specific dashboard hooks to avoid conflicts with reports
export {
    dashboardKeys,
    useSellerDashboard,
    useConferenteDashboard,
    useAdminDashboard,
    usePendingShifts,
    useDivergentShifts,
    useCashIntegrity,
    useConsolidatedReport,
    useDashboardVendedor,
    useDashboardConferente,
    useDashboardAdmin,
} from './use-dashboard';

// Note: for report hooks (useRanking, useStorePerformance, etc.),
// import directly from './use-reports' to avoid naming conflicts

// New hooks
export * from './use-customers';
export * from './use-phone-catalog';
export * from './use-pedidos';
export * from './use-capas';
