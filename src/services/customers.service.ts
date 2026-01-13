/**
 * Customers Service
 * 
 * API service for customer management.
 * Includes CRUD operations and device management.
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type {
    Customer,
    CustomerDevice,
    CustomerFilters,
    CreateCustomerRequest,
    UpdateCustomerRequest,
    CreateDeviceRequest,
    UpdateDeviceRequest,
} from '@/types/customers.types';

// ============================================================
// Customer CRUD
// ============================================================

/**
 * List customers with optional filters
 */
export async function listCustomers(
    filters?: CustomerFilters
): Promise<PaginatedResponse<Customer>> {
    const params: Record<string, unknown> = {};

    if (filters?.name) params.name = filters.name;
    if (filters?.email) params.email = filters.email;
    if (filters?.phone) params.phone = filters.phone;
    if (filters?.city) params.city = filters.city;
    if (filters?.state) params.state = filters.state;
    if (filters?.has_device !== undefined) params.has_device = filters.has_device;
    if (filters?.brand_id) params.brand_id = filters.brand_id;
    if (filters?.model_id) params.model_id = filters.model_id;
    if (filters?.page) params.page = filters.page;
    if (filters?.per_page) params.per_page = filters.per_page;
    if (filters?.sort) params.sort = filters.sort;
    if (filters?.direction) params.direction = filters.direction;

    return apiGet<PaginatedResponse<Customer>>('/customers', params);
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(id: number): Promise<Customer> {
    const response = await apiGet<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
}

/**
 * Create a new customer
 */
export async function createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiPost<ApiResponse<Customer>>('/customers', data);
    return response.data;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
    id: number,
    data: UpdateCustomerRequest
): Promise<Customer> {
    const response = await apiPut<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: number): Promise<void> {
    await apiDelete(`/customers/${id}`);
}

// ============================================================
// Customer Devices
// ============================================================

/**
 * List devices for a customer
 */
export async function listDevices(customerId: number): Promise<CustomerDevice[]> {
    const response = await apiGet<ApiResponse<CustomerDevice[]>>(
        `/customers/${customerId}/devices`
    );
    return response.data;
}

/**
 * Add a device to a customer
 */
export async function addDevice(
    customerId: number,
    data: CreateDeviceRequest
): Promise<CustomerDevice> {
    const response = await apiPost<ApiResponse<CustomerDevice>>(
        `/customers/${customerId}/devices`,
        data
    );
    return response.data;
}

/**
 * Update a customer's device
 */
export async function updateDevice(
    customerId: number,
    deviceId: number,
    data: UpdateDeviceRequest
): Promise<CustomerDevice> {
    const response = await apiPut<ApiResponse<CustomerDevice>>(
        `/customers/${customerId}/devices/${deviceId}`,
        data
    );
    return response.data;
}

/**
 * Remove a device from a customer
 */
export async function removeDevice(
    customerId: number,
    deviceId: number
): Promise<void> {
    await apiDelete(`/customers/${customerId}/devices/${deviceId}`);
}

// ============================================================
// Service Object
// ============================================================

export const customersService = {
    list: listCustomers,
    get: getCustomer,
    create: createCustomer,
    update: updateCustomer,
    delete: deleteCustomer,
    listDevices,
    addDevice,
    updateDevice,
    removeDevice,
};

export default customersService;
