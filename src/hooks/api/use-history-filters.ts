import { useQuery } from '@tanstack/react-query';
import { cashShiftsService } from '@/services/conference';

export function useHistoryFilters(from?: string, to?: string, storeId?: number) {
    return useQuery({
        queryKey: ['history-filters', from, to, storeId],
        queryFn: async () => {
            const response = await cashShiftsService.getHistoryFilters(from, to, storeId);
            return response.data;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
