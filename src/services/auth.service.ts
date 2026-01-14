/**
 * Authentication Service
 * 
 * Handles login, logout, password reset, and user profile operations.
 * 
 * IMPORTANT: Backend uses Laravel Sanctum (not JWT).
 * - Tokens don't expire automatically
 * - No refresh token endpoint exists
 * - Revocation via logout endpoints only
 */

import { apiPost, apiGet, apiPut, setToken, clearToken } from '@/lib/api';
import type {
    ApiResponse,
    LoginResponse,
    CurrentUserResponse,
    UserWithStores,
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
 * Returns the user data from login response
 */
export async function login(credentials: LoginCredentials): Promise<User> {
    const response = await apiPost<ApiResponse<LoginResponse>>('/auth/login', {
        ...credentials,
        device_name: credentials.device_name || `web-${navigator.userAgent.slice(0, 50)}`,
    });

    // Store the token securely in sessionStorage
    setToken(response.data.token);

    return response.data.user;
}

/**
 * Logout current session
 * Clears token even if API call fails
 */
export async function logout(): Promise<void> {
    try {
        await apiPost('/auth/logout');
    } finally {
        // Always clear token, even if API call fails
        clearToken();
        // Also clear store selection
        sessionStorage.removeItem('currentStoreId');
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
        sessionStorage.removeItem('currentStoreId');
    }
}

/**
 * Get current authenticated user with their stores
 * 
 * Backend returns: { data: { user: {...}, stores: [...] } }
 * We merge this into a single UserWithStores object for convenience
 */
export async function getCurrentUser(): Promise<UserWithStores> {
    const response = await apiGet<ApiResponse<CurrentUserResponse>>('/me');

    // Merge user and stores into a single object
    return {
        ...response.data.user,
        stores: response.data.stores,
    };
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

/**
 * Response from WhatsApp forgot password endpoint
 */
export interface ForgotPasswordWhatsAppResponse {
    message: string;
    phone_masked: string;
    expires_in_minutes: number;
}

/**
 * Request password reset via WhatsApp
 * Sends a 6-digit code to the user's registered WhatsApp number
 */
export async function forgotPasswordWhatsApp(data: {
    email?: string;
    whatsapp?: string;
}): Promise<ForgotPasswordWhatsAppResponse> {
    const response = await apiPost<ApiResponse<ForgotPasswordWhatsAppResponse>>(
        '/auth/forgot-password/whatsapp',
        data
    );
    return response.data;
}

/**
 * Reset password using a 6-digit code sent via WhatsApp
 */
export async function resetPasswordWithCode(data: {
    code: string;
    email: string;
    password: string;
    password_confirmation: string;
}): Promise<void> {
    await apiPost('/auth/reset-password/code', data);
}
