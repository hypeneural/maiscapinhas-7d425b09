import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, clearToken } from './token';
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
 */
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor: Inject auth token and request ID
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
        // Handle 401 Unauthorized: Clear token and redirect to login
        if (error.response?.status === 401) {
            clearToken();

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }

        return Promise.reject(parseApiError(error));
    }
);

/**
 * Helper to make GET requests with type safety
 */
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
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
 * Helper to make DELETE requests with type safety
 */
export async function apiDelete<T>(url: string): Promise<T> {
    const response = await api.delete<T>(url);
    return response.data;
}

/**
 * Helper to upload files via multipart/form-data
 */
export async function apiUpload<T>(
    url: string,
    file: File,
    fieldName: string = 'file',
    method: 'POST' | 'PUT' = 'PUT'
): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await api.request<T>({
        method,
        url,
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
}

export default api;
