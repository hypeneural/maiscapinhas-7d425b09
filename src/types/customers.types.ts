/**
 * Customer Types
 * 
 * TypeScript types for customer management API endpoints.
 */

// ============================================================
// Phone Catalog
// ============================================================

/**
 * Phone brand
 */
export interface PhoneBrand {
    id: number;
    brand_name: string;
    brand_slug: string;
    parent_company: string | null;
    models_count?: number;
}

/**
 * Phone model
 */
export interface PhoneModel {
    id: number;
    marketing_name: string;
    release_year: number | null;
    form_factor: 'smartphone' | 'tablet' | 'watch' | 'feature_phone';
    form_factor_label: string;
    full_name: string;
    brand?: {
        id: number;
        brand_name: string;
        brand_slug: string;
    };
    brand_id: number;
}

/**
 * Form factor options
 */
export const FORM_FACTORS = [
    { value: 'smartphone', label: 'Smartphone' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'watch', label: 'Smartwatch' },
    { value: 'feature_phone', label: 'Feature Phone' },
] as const;

// ============================================================
// Customer Device
// ============================================================

/**
 * Device linked to a customer
 */
export interface CustomerDevice {
    id: number;
    customer_id: number;
    nickname: string | null;
    is_primary: boolean;
    display_name: string;
    phone_model?: {
        id: number;
        marketing_name: string;
        release_year: number | null;
        form_factor: string;
        full_name: string;
        brand?: {
            id: number;
            brand_name: string;
        };
    };
}

/**
 * Request to add device to customer
 */
export interface CreateDeviceRequest {
    phone_model_id: number;
    nickname?: string;
    is_primary?: boolean;
}

/**
 * Request to update customer device
 */
export interface UpdateDeviceRequest {
    nickname?: string;
    is_primary?: boolean;
}

// ============================================================
// Customer
// ============================================================

/**
 * Customer response from API
 */
export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    zip_code: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    birth_date: string | null;
    devices?: CustomerDevice[];
    created_by?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

/**
 * Request to create customer
 */
export interface CreateCustomerRequest {
    name: string;
    email: string;
    phone?: string;
    zip_code?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    birth_date?: string;
}

/**
 * Request to update customer
 */
export interface UpdateCustomerRequest {
    name?: string;
    email?: string;
    phone?: string | null;
    zip_code?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    birth_date?: string | null;
}

// ============================================================
// Filters
// ============================================================

/**
 * Valid sort fields for customers
 */
export type CustomerSortField = 'id' | 'name' | 'email' | 'phone' | 'city' | 'state' | 'created_at' | 'updated_at';

/**
 * Customer list filters
 */
export interface CustomerFilters {
    keyword?: string;           // NOVO: Busca unificada em nome, email, telefone
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    initial_date?: string;      // NOVO: Data inicial cadastro (YYYY-MM-DD)
    final_date?: string;        // NOVO: Data final cadastro (YYYY-MM-DD)
    has_device?: 0 | 1;
    brand_id?: number;
    model_id?: number;
    page?: number;
    per_page?: number;
    sort?: CustomerSortField;
    direction?: 'asc' | 'desc';
}

/**
 * Phone brand list filters
 */
export interface PhoneBrandFilters {
    search?: string;
    slug?: string;
    page?: number;
    per_page?: number;
}

/**
 * Phone model list filters
 */
export interface PhoneModelFilters {
    search?: string;
    brand_id?: number;
    form_factor?: 'smartphone' | 'tablet' | 'watch' | 'feature_phone';
    release_year?: number;
    page?: number;
    per_page?: number;
}

/**
 * Request to create phone brand
 */
export interface CreatePhoneBrandRequest {
    brand_name: string;
    brand_slug?: string;
    parent_company?: string;
}

/**
 * Request to update phone brand
 */
export interface UpdatePhoneBrandRequest {
    brand_name?: string;
    brand_slug?: string;
    parent_company?: string | null;
}

/**
 * Request to create phone model
 */
export interface CreatePhoneModelRequest {
    brand_id: number;
    marketing_name: string;
    release_year?: number;
    form_factor?: 'smartphone' | 'tablet' | 'watch' | 'feature_phone';
}

/**
 * Request to update phone model
 */
export interface UpdatePhoneModelRequest {
    brand_id?: number;
    marketing_name?: string;
    release_year?: number | null;
    form_factor?: 'smartphone' | 'tablet' | 'watch' | 'feature_phone';
}
