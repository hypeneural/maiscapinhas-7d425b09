/**
 * Authentication Service
 * 
 * Handles login, logout, password reset, and user profile operations.
 */

import { apiPost, apiGet, apiPut, setToken, clearToken } from '@/lib/api';
import type {
    ApiResponse,
    LoginResponse,
    CurrentUserResponse,
    User
} from '@/types/api';

/**
 * Login credentials
 */
interface LoginCredentials {
    email: string;
    password: string;
    device_name?: string;
}

/**
 * Authenticate user and store token
 */
export async function login(credentials: LoginCredentials): Promise<User> {
    const response = await apiPost<ApiResponse<LoginResponse>>('/auth/login', {
        ...credentials,
        device_name: credentials.device_name || `web-${navigator.userAgent.slice(0, 50)}`,
    });

    // Store the token securely
    setToken(response.data.token);

    return response.data.user;
}

/**
 * Logout current session
 */
export async function logout(): Promise<void> {
    try {
        await apiPost('/auth/logout');
    } finally {
        // Always clear token, even if API call fails
        clearToken();
    }
}

/**
 * Logout all sessions for current user
 */
export async function logoutAll(): Promise<void> {
    try {
        await apiPost('/auth/logout-all');
    } finally {
        clearToken();
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
    const response = await apiGet<ApiResponse<CurrentUserResponse>>('/me');
    return response.data.user;
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<void> {
    await apiPost('/auth/forgot-password', { email });
}

/**
 * Reset password with token
 */
export async function resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}): Promise<void> {
    await apiPost('/auth/reset-password', data);
}

/**
 * Change current user's password
 */
export async function changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
}): Promise<void> {
    await apiPut('/auth/password', data);
}
