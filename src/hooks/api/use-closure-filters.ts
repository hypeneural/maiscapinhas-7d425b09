import { useQuery } from '@tanstack/react-query';
import { cashClosingsService } from '@/services/conference';

export function useClosureFilters(storeId?: number, date?: string, shiftCode?: string) {
    return useQuery({
        queryKey: ['closure-filters', storeId, date, shiftCode],
        queryFn: async () => {
            const response = await cashClosingsService.getFilters(storeId, date, shiftCode);
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: (previousData) => previousData,
    });
}
