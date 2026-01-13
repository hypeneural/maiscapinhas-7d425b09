import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, handleUnauthorized } from './token';
import { parseApiError } from './error-handler';

/**
 * API Base URL - Uses Vite proxy in development to avoid CORS
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Request timeout in milliseconds
 */
const REQUEST_TIMEOUT = 30000;

/**
 * Axios instance configured for MaisCapinhas API
 * 
 * IMPORTANT: We do NOT set a default Content-Type header here.
 * The interceptor below handles Content-Type dynamically:
 * - For FormData: Let the browser set it automatically (with boundary)
 * - For other requests: Set application/json
 */
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
        'Accept': 'application/json',
        // ⚠️ NO Content-Type here! It's handled in the interceptor below.
    },
});

/**
 * Request interceptor: Inject auth token, request ID, and handle Content-Type
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Inject Bearer token if available
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for traceability
        config.headers['X-Request-Id'] = crypto.randomUUID();

        // Handle Content-Type based on data type
        // For FormData, do NOT set Content-Type - let the browser handle it with boundary
        // For other data types, set application/json
        if (config.data instanceof FormData) {
            // Delete any existing Content-Type to let browser set multipart/form-data with boundary
            delete config.headers['Content-Type'];
        } else if (config.data !== undefined) {
            // Only set JSON content type if there's data and it's not FormData
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => {
        return Promise.reject(parseApiError(error));
    }
);

/**
 * Response interceptor: Handle auth errors globally
 */
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Handle 401 Unauthorized: Clear token and trigger callback
        if (error.response?.status === 401) {
            // Only handle if not already on login page
            if (!window.location.pathname.includes('/login')) {
                handleUnauthorized();
            }
        }

        return Promise.reject(parseApiError(error));
    }
);

/**
 * Helper to make GET requests with type safety
 * Accepts any object with optional properties as params
 */
export async function apiGet<T>(url: string, params?: object): Promise<T> {
    const response = await api.get<T>(url, { params });
    return response.data;
}

/**
 * Helper to make POST requests with type safety
 */
export async function apiPost<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response = await api.post<T>(url, data);
    return response.data;
}

/**
 * Helper to make PUT requests with type safety
 */
export async function apiPut<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response = await api.put<T>(url, data);
    return response.data;
}

/**
 * Helper to make PATCH requests with type safety
 */
export async function apiPatch<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response = await api.patch<T>(url, data);
    return response.data;
}

/**
 * Helper to make DELETE requests with type safety
 * Supports optional config for requests that need body data
 */
export async function apiDelete<T>(url: string, config?: { data?: unknown }): Promise<T> {
    const response = await api.delete<T>(url, config);
    return response.data;
}

/**
 * Helper to upload files via multipart/form-data
 * 
 * IMPORTANT: 
 * - Always use POST method (backend accepts POST for file uploads)
 * - Do NOT set Content-Type manually - the browser sets it automatically
 *   with the correct boundary for multipart/form-data
 * - The interceptor above will NOT add Content-Type for FormData
 */
export async function apiUpload<T>(
    url: string,
    file: File | Blob,
    fieldName: string = 'file'
): Promise<T> {
    const formData = new FormData();

    // Handle both File and Blob (Blob from canvas crop needs filename)
    if (file instanceof Blob && !(file instanceof File)) {
        formData.append(fieldName, file, `${fieldName}.jpg`);
    } else {
        formData.append(fieldName, file);
    }

    // Always use POST method (no _method spoofing needed)
    const response = await api.post<T>(url, formData);

    return response.data;
}

export default api;
