import { toast } from 'sonner';
import { AxiosError } from 'axios';

/**
 * API Error Response structure
 */
export interface ApiErrorResponse {
    message: string;
    errors?: Record<string, string[]>;
    error?: {
        code: number;
        message: string;
    };
}

/**
 * Custom API Error class with typed response
 */
export class ApiError extends Error {
    public readonly status: number;
    public readonly code?: number;
    public readonly validationErrors?: Record<string, string[]>;
    public readonly requestId?: string;

    constructor(
        message: string,
        status: number,
        validationErrors?: Record<string, string[]>,
        code?: number,
        requestId?: string
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.validationErrors = validationErrors;
        this.requestId = requestId;
    }

    /**
     * Get all validation error messages as a flat array
     */
    getValidationMessages(): string[] {
        if (!this.validationErrors) return [];
        return Object.values(this.validationErrors).flat();
    }

    /**
     * Get validation errors for a specific field
     */
    getFieldErrors(field: string): string[] {
        return this.validationErrors?.[field] ?? [];
    }
}

/**
 * Parse Axios error into ApiError
 */
export function parseApiError(error: unknown): ApiError {
    if (error instanceof ApiError) {
        return error;
    }

    if (error instanceof AxiosError && error.response) {
        const { status, data, headers } = error.response;
        const responseData = data as ApiErrorResponse;

        return new ApiError(
            responseData?.message || getDefaultMessage(status),
            status,
            responseData?.errors,
            responseData?.error?.code,
            headers?.['x-request-id']
        );
    }

    if (error instanceof AxiosError && error.request) {
        // Request made but no response received (network error)
        return new ApiError(
            'Não foi possível conectar ao servidor. Verifique sua conexão.',
            0
        );
    }

    // Unknown error
    return new ApiError(
        error instanceof Error ? error.message : 'Erro desconhecido',
        500
    );
}

/**
 * Get default error message for HTTP status code
 */
function getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
        400: 'Requisição inválida',
        401: 'Sessão expirada. Faça login novamente.',
        403: 'Você não tem permissão para esta ação',
        404: 'Recurso não encontrado',
        422: 'Dados inválidos. Verifique os campos.',
        429: 'Muitas requisições. Aguarde alguns segundos.',
        500: 'Erro interno do servidor',
        502: 'Servidor temporariamente indisponível',
        503: 'Serviço temporariamente indisponível',
    };

    return messages[status] || `Erro ${status}`;
}

/**
 * Handle API error with toast notifications
 */
export function handleApiError(error: unknown, options?: {
    showToast?: boolean;
    showValidationErrors?: boolean;
}): ApiError {
    const { showToast = true, showValidationErrors = true } = options ?? {};
    const apiError = parseApiError(error);

    if (!showToast) {
        return apiError;
    }

    // Show validation errors individually
    if (showValidationErrors && apiError.validationErrors) {
        const messages = apiError.getValidationMessages();
        messages.slice(0, 3).forEach((msg) => {
            toast.error(msg);
        });

        if (messages.length > 3) {
            toast.error(`E mais ${messages.length - 3} erro(s)...`);
        }
        return apiError;
    }

    // Show generic error message
    toast.error(apiError.message);
    return apiError;
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

/**
 * Type guard to check if error is a validation error (422)
 */
export function isValidationError(error: unknown): error is ApiError {
    return isApiError(error) && error.status === 422;
}

/**
 * Type guard to check if error is an auth error (401)
 */
export function isAuthError(error: unknown): error is ApiError {
    return isApiError(error) && error.status === 401;
}

/**
 * Type guard to check if error is a permission error (403)
 */
export function isPermissionError(error: unknown): error is ApiError {
    return isApiError(error) && error.status === 403;
}
