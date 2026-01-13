/**
 * Customers Hooks
 * 
 * React Query hooks for customer management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersService } from '@/services/customers.service';
import { handleApiError } from '@/lib/api';
import { toast } from 'sonner';
import type {
    CustomerFilters,
    CreateCustomerRequest,
    UpdateCustomerRequest,
    CreateDeviceRequest,
    UpdateDeviceRequest,
} from '@/types/customers.types';

// ============================================================
// Query Keys
// ============================================================

export const customersKeys = {
    all: ['customers'] as const,
    lists: () => [...customersKeys.all, 'list'] as const,
    list: (filters?: CustomerFilters) => [...customersKeys.lists(), filters] as const,
    details: () => [...customersKeys.all, 'detail'] as const,
    detail: (id: number) => [...customersKeys.details(), id] as const,
    devices: (customerId: number) => [...customersKeys.all, 'devices', customerId] as const,
};

// ============================================================
// Customer Hooks
// ============================================================

/**
 * Hook to list customers with filters
 */
export function useCustomers(filters?: CustomerFilters) {
    return useQuery({
        queryKey: customersKeys.list(filters),
        queryFn: () => customersService.list(filters),
    });
}

/**
 * Hook to get a single customer
 */
export function useCustomer(id: number) {
    return useQuery({
        queryKey: customersKeys.detail(id),
        queryFn: () => customersService.get(id),
        enabled: !!id,
    });
}

/**
 * Hook to create a customer
 */
export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCustomerRequest) => customersService.create(data),
        onSuccess: (customer) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
            toast.success(`Cliente "${customer.name}" criado com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a customer
 */
export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCustomerRequest }) =>
            customersService.update(id, data),
        onSuccess: (customer) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(customer.id) });
            toast.success(`Cliente "${customer.name}" atualizado com sucesso!`);
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to delete a customer
 */
export function useDeleteCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => customersService.delete(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.lists() });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(id) });
            toast.success('Cliente excluído com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

// ============================================================
// Device Hooks
// ============================================================

/**
 * Hook to list devices for a customer
 */
export function useCustomerDevices(customerId: number) {
    return useQuery({
        queryKey: customersKeys.devices(customerId),
        queryFn: () => customersService.listDevices(customerId),
        enabled: !!customerId,
    });
}

/**
 * Hook to add a device to a customer
 */
export function useAddDevice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, data }: { customerId: number; data: CreateDeviceRequest }) =>
            customersService.addDevice(customerId, data),
        onSuccess: (device, { customerId }) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.devices(customerId) });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
            toast.success('Aparelho adicionado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to update a customer's device
 */
export function useUpdateDevice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            customerId,
            deviceId,
            data,
        }: {
            customerId: number;
            deviceId: number;
            data: UpdateDeviceRequest;
        }) => customersService.updateDevice(customerId, deviceId, data),
        onSuccess: (_, { customerId }) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.devices(customerId) });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
            toast.success('Aparelho atualizado com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}

/**
 * Hook to remove a device from a customer
 */
export function useRemoveDevice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, deviceId }: { customerId: number; deviceId: number }) =>
            customersService.removeDevice(customerId, deviceId),
        onSuccess: (_, { customerId }) => {
            queryClient.invalidateQueries({ queryKey: customersKeys.devices(customerId) });
            queryClient.invalidateQueries({ queryKey: customersKeys.detail(customerId) });
            toast.success('Aparelho removido com sucesso!');
        },
        onError: (error) => {
            handleApiError(error);
        },
    });
}
