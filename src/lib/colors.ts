/**
 * Color Utilities
 * 
 * Status-based colors for ERP semaphore indicators.
 */

/**
 * Get status color classes based on achievement percentage
 */
export function getAchievementColor(
    value: number,
    thresholds = { warning: 80, success: 100 }
): string {
    if (value >= thresholds.success) {
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
    }
    if (value >= thresholds.warning) {
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950';
    }
    return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
}

/**
 * Get status text color based on achievement percentage
 */
export function getAchievementTextColor(
    value: number,
    thresholds = { warning: 80, success: 100 }
): string {
    if (value >= thresholds.success) {
        return 'text-green-600 dark:text-green-400';
    }
    if (value >= thresholds.warning) {
        return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-red-600 dark:text-red-400';
}

/**
 * Get divergence color based on amount
 */
export function getDivergenceColor(divergence: number): string {
    const abs = Math.abs(divergence);

    if (abs <= 0.01) {
        return 'text-green-600 dark:text-green-400'; // OK
    }
    if (abs <= 50) {
        return 'text-yellow-600 dark:text-yellow-400'; // Attention
    }
    return 'text-red-600 dark:text-red-400'; // Critical
}

/**
 * Get shift status color
 */
export function getShiftStatusColor(status: string): string {
    const colors: Record<string, string> = {
        open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get store status color (farol)
 */
export function getStoreStatusColor(status: 'verde' | 'amarelo' | 'vermelho' | string): string {
    const colors: Record<string, string> = {
        verde: 'bg-green-500',
        amarelo: 'bg-yellow-500',
        vermelho: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
}

/**
 * Get priority color for pending items
 */
export function getPriorityColor(priority: 'low' | 'medium' | 'high' | string): string {
    const colors: Record<string, string> = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
}

/**
 * Get gauge chart color based on percentage
 */
export function getGaugeColor(percentage: number): string {
    if (percentage >= 100) return 'hsl(152, 69%, 31%)'; // Green
    if (percentage >= 80) return 'hsl(45, 93%, 47%)';   // Yellow
    return 'hsl(0, 84%, 60%)';                          // Red
}
