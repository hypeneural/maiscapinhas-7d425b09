/**
 * Query Provider
 * 
 * Configured TanStack Query provider for the application.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

/**
 * QueryClient instance with optimized defaults
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 5 minutes
            staleTime: 1000 * 60 * 5,
            // Cache data for 30 minutes
            gcTime: 1000 * 60 * 30,
            // Only retry once on failure
            retry: 1,
            // Don't refetch on window focus (can be noisy in ERP)
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
        },
        mutations: {
            // Don't retry mutations
            retry: false,
        },
    },
});

interface QueryProviderProps {
    children: ReactNode;
}

/**
 * Query Provider component
 */
export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        </QueryClientProvider>
    );
}

/**
 * Export queryClient for use outside React components
 */
export { queryClient };
