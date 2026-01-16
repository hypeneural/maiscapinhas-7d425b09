/**
 * Screens Types
 * 
 * TypeScript interfaces for the /me/screens endpoint.
 */

/**
 * Screen entity from a module
 */
export interface Screen {
    /** Unique screen identifier (e.g. "pedidos.list") */
    name: string;
    /** Display name for UI (e.g. "Lista de Pedidos") */
    display_name: string;
    /** Route path (e.g. "/pedidos") */
    path: string;
    /** Module that owns this screen */
    module_id: string;
    /** Module name for display */
    module_name?: string;
    /** Icon name from Lucide */
    icon?: string;
}

/**
 * Response from GET /me/screens
 */
export interface MeScreensResponse {
    /** List of screens user can access */
    screens: Screen[];
    /** Total count */
    total: number;
}
