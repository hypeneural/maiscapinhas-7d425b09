/**
 * Modules Service
 *
 * API calls for the modular system management.
 */

import { api } from '@/lib/api';
import type {
    Module,
    ModuleFull,
    ModuleTransitionsResponse,
    UpdateTransitionsRequest,
    ModuleActivationResponse,
    ModuleSchema,
    UpdateStatusRequest,
    CreateStatusRequest,
    PreviewImpactRequest,
    PreviewImpactResponse,
    AuditLogResponse,
    ModuleTexts,
    ModuleStatusExtended,
    ModuleConfigResponse,
    UpdateConfigResponse,
    ResetConfigResponse,
    StoreConfigResponse,
    ModuleTextsResponse,
    UpdateTextsRequest,
    UpdateTextsResponse,
} from '@/types/modules.types';
import type { ApiResponse } from '@/types/api';

const BASE_URL = '/admin/modules';

/**
 * List all modules
 */
export async function getModules(): Promise<Module[]> {
    const response = await api.get<{ data: Module[] }>(BASE_URL);
    return response.data.data;
}

/**
 * Get module basic details
 */
export async function getModule(moduleId: string): Promise<Module> {
    const response = await api.get<ApiResponse<Module>>(`${BASE_URL}/${moduleId}`);
    return response.data.data;
}

/**
 * Get full module configuration for rendering
 */
export async function getModuleFull(moduleId: string): Promise<ModuleFull> {
    const response = await api.get<ApiResponse<ModuleFull>>(`${BASE_URL}/${moduleId}/full`);
    return response.data.data;
}

/**
 * Install a module
 */
export async function installModule(moduleId: string): Promise<ModuleActivationResponse> {
    const response = await api.post<ModuleActivationResponse>(`${BASE_URL}/${moduleId}/install`);
    return response.data;
}

/**
 * Activate a module globally
 */
export async function activateModule(moduleId: string): Promise<ModuleActivationResponse> {
    const response = await api.post<ModuleActivationResponse>(`${BASE_URL}/${moduleId}/activate`);
    return response.data;
}

/**
 * Deactivate a module globally
 */
export async function deactivateModule(moduleId: string): Promise<ModuleActivationResponse> {
    const response = await api.post<ModuleActivationResponse>(`${BASE_URL}/${moduleId}/deactivate`);
    return response.data;
}

/**
 * Activate module for a specific store
 */
export async function activateModuleForStore(
    moduleId: string,
    storeId: number
): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
        `${BASE_URL}/${moduleId}/stores/${storeId}/activate`
    );
    return response.data;
}

/**
 * Deactivate module for a specific store
 */
export async function deactivateModuleForStore(
    moduleId: string,
    storeId: number
): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
        `${BASE_URL}/${moduleId}/stores/${storeId}/deactivate`
    );
    return response.data;
}

/**
 * Get module transitions matrix
 */
export async function getModuleTransitions(
    moduleId: string
): Promise<ModuleTransitionsResponse> {
    const response = await api.get<ApiResponse<ModuleTransitionsResponse>>(
        `${BASE_URL}/${moduleId}/transitions`
    );
    return response.data.data;
}

/**
 * Update module transitions matrix
 */
export async function updateModuleTransitions(
    moduleId: string,
    data: UpdateTransitionsRequest
): Promise<ModuleTransitionsResponse> {
    const response = await api.put<ApiResponse<ModuleTransitionsResponse>>(
        `${BASE_URL}/${moduleId}/transitions`,
        data
    );
    return response.data.data;
}

/**
 * Get stores where the module is active
 */
export interface ModuleStoreInfo {
    store_id: number;
    store_name: string;
    is_active: boolean;
    config: Record<string, unknown>;
}

export async function getModuleStores(
    moduleId: string
): Promise<ModuleStoreInfo[]> {
    const response = await api.get<{ stores: ModuleStoreInfo[] }>(
        `${BASE_URL}/${moduleId}/stores`
    );
    return response.data.stores;
}

/**
 * Activate module for a store with optional config
 */
export async function activateModuleForStoreWithConfig(
    moduleId: string,
    storeId: number,
    config?: Record<string, unknown>
): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
        `${BASE_URL}/${moduleId}/stores/${storeId}/activate`,
        { config }
    );
    return response.data;
}

// ============================================================
// Schema & Validation
// ============================================================

/**
 * Get module schema with validation rules
 */
export async function getModuleSchema(moduleId: string): Promise<ModuleSchema> {
    const response = await api.get<ApiResponse<ModuleSchema>>(
        `${BASE_URL}/${moduleId}/schema`
    );
    return response.data.data;
}

// ============================================================
// Status CRUD
// ============================================================

/**
 * Update a module status
 */
export async function updateModuleStatus(
    moduleId: string,
    statusKey: string,
    data: UpdateStatusRequest
): Promise<{ message: string; data: ModuleStatusExtended }> {
    const response = await api.patch<{ message: string; data: ModuleStatusExtended }>(
        `${BASE_URL}/${moduleId}/statuses/${statusKey}`,
        data
    );
    return response.data;
}

/**
 * Create a new module status
 */
export async function createModuleStatus(
    moduleId: string,
    data: CreateStatusRequest
): Promise<{ message: string; data: ModuleStatusExtended }> {
    const response = await api.post<{ message: string; data: ModuleStatusExtended }>(
        `${BASE_URL}/${moduleId}/statuses`,
        data
    );
    return response.data;
}

/**
 * Delete a module status
 */
export async function deleteModuleStatus(
    moduleId: string,
    statusKey: string,
    options?: { force?: boolean }
): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(
        `${BASE_URL}/${moduleId}/statuses/${statusKey}`,
        { params: options }
    );
    return response.data;
}

// ============================================================
// Preview Impact
// ============================================================

/**
 * Preview impact of a destructive action
 */
export async function previewImpact(
    moduleId: string,
    data: PreviewImpactRequest
): Promise<PreviewImpactResponse> {
    const response = await api.post<PreviewImpactResponse>(
        `${BASE_URL}/${moduleId}/preview-impact`,
        data
    );
    return response.data;
}

// ============================================================
// Texts
// ============================================================

/**
 * Get module texts with defaults and schema
 */
export async function getModuleTexts(moduleId: string): Promise<ModuleTextsResponse> {
    try {
        const response = await api.get<ApiResponse<ModuleTextsResponse>>(
            `${BASE_URL}/${moduleId}/texts`
        );
        return response.data.data ?? {
            module_id: moduleId,
            module_name: moduleId,
            texts: {},
            defaults: {},
            schema: {},
            has_custom_texts: false,
        };
    } catch (error: any) {
        // Return empty if endpoint doesn't exist yet
        if (error?.response?.status === 404) {
            return {
                module_id: moduleId,
                module_name: moduleId,
                texts: {},
                defaults: {},
                schema: {},
                has_custom_texts: false,
            };
        }
        throw error;
    }
}

/**
 * Update module texts
 */
export async function updateModuleTexts(
    moduleId: string,
    texts: Record<string, string>
): Promise<UpdateTextsResponse> {
    const response = await api.put<UpdateTextsResponse>(
        `${BASE_URL}/${moduleId}/texts`,
        { texts }
    );
    return response.data;
}

// ============================================================
// Audit Log
// ============================================================

/**
 * Get module audit log
 */
export async function getModuleAuditLog(
    moduleId: string,
    limit = 50
): Promise<AuditLogResponse> {
    const response = await api.get<ApiResponse<AuditLogResponse>>(
        `${BASE_URL}/${moduleId}/audit-log`,
        { params: { limit } }
    );
    return response.data.data;
}

// ============================================================
// Module Configuration
// ============================================================

/**
 * Get module configuration with schema
 * Returns a default empty config if endpoint doesn't exist yet
 */
export async function getModuleConfig(moduleId: string): Promise<ModuleConfigResponse> {
    try {
        const response = await api.get<ApiResponse<ModuleConfigResponse>>(
            `${BASE_URL}/${moduleId}/config`
        );
        return response.data.data ?? {
            module_id: moduleId,
            module_name: moduleId,
            config: {},
            schema: { sections: {}, defaults: {} },
            has_custom_config: false,
        };
    } catch (error: any) {
        // Return empty config if endpoint doesn't exist yet
        if (error?.response?.status === 404) {
            return {
                module_id: moduleId,
                module_name: moduleId,
                config: {},
                schema: { sections: {}, defaults: {} },
                has_custom_config: false,
            };
        }
        throw error;
    }
}

/**
 * Update module configuration
 */
export async function updateModuleConfig(
    moduleId: string,
    config: Record<string, unknown>
): Promise<UpdateConfigResponse> {
    const response = await api.patch<UpdateConfigResponse>(
        `${BASE_URL}/${moduleId}/config`,
        config
    );
    return response.data;
}

/**
 * Reset module configuration to defaults
 */
export async function resetModuleConfig(moduleId: string): Promise<ResetConfigResponse> {
    const response = await api.post<ResetConfigResponse>(
        `${BASE_URL}/${moduleId}/config/reset`
    );
    return response.data;
}

/**
 * Get store-specific module config
 */
export async function getStoreConfig(
    moduleId: string,
    storeId: number
): Promise<StoreConfigResponse> {
    const response = await api.get<ApiResponse<StoreConfigResponse>>(
        `${BASE_URL}/${moduleId}/stores/${storeId}/config`
    );
    return response.data.data;
}

/**
 * Update store-specific module config
 */
export async function updateStoreConfig(
    moduleId: string,
    storeId: number,
    config: Record<string, unknown>
): Promise<UpdateConfigResponse> {
    const response = await api.patch<UpdateConfigResponse>(
        `${BASE_URL}/${moduleId}/stores/${storeId}/config`,
        config
    );
    return response.data;
}

export const modulesService = {
    getModules,
    getModule,
    getModuleFull,
    installModule,
    activateModule,
    deactivateModule,
    activateModuleForStore,
    deactivateModuleForStore,
    getModuleTransitions,
    updateModuleTransitions,
    getModuleStores,
    activateModuleForStoreWithConfig,
    // New CRUD services
    getModuleSchema,
    updateModuleStatus,
    createModuleStatus,
    deleteModuleStatus,
    previewImpact,
    getModuleAuditLog,
    // Config services
    getModuleConfig,
    updateModuleConfig,
    resetModuleConfig,
    getStoreConfig,
    updateStoreConfig,
    // Texts services
    getModuleTexts,
    updateModuleTexts,
};

export default modulesService;
