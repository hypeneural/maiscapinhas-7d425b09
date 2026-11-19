/**
 * Secure Token Management
 * 
 * Uses memory as primary storage with localStorage as persistence layer.
 * Tokens persist across tabs and page reloads within the same browser.
 */

// In-memory token store (primary)
let memoryToken: string | null = null;

// Initialization state
let isInitialized = false;

// Callback for unauthorized events
let onUnauthorizedCallback: (() => void) | null = null;

const TOKEN_KEY = 'mc_auth_token';

/**
 * Initialize token from localStorage.
 * Should be called once on app mount.
 */
export function initializeToken(): string | null {
  if (isInitialized) {
    return memoryToken;
  }

  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      memoryToken = stored;
    }
  } catch {
    // localStorage not available (e.g., private browsing)
  }

  isInitialized = true;
  return memoryToken;
}

/**
 * Check if token has been initialized
 */
export function isTokenInitialized(): boolean {
  return isInitialized;
}

/**
 * Get the current authentication token.
 * Returns null if not initialized yet.
 */
export function getToken(): string | null {
  // Ensure we've initialized first
  if (!isInitialized) {
    initializeToken();
  }
  return memoryToken;
}

/**
 * Store the authentication token securely
 */
export function setToken(token: string): void {
  memoryToken = token;

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage not available, token will only persist in memory
    console.warn('localStorage not available. Token will not persist on page reload.');
  }
}

/**
 * Clear the authentication token
 */
export function clearToken(): void {
  memoryToken = null;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Check if user is authenticated (has a token)
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Get the Authorization header value
 */
export function getAuthHeader(): string | null {
  const token = getToken();
  return token ? `Bearer ${token}` : null;
}

/**
 * Set callback for unauthorized events (401).
 * Called when token is cleared due to 401 response.
 */
export function setOnUnauthorized(callback: () => void): void {
  onUnauthorizedCallback = callback;
}

/**
 * Handle unauthorized event.
 * Clears token and triggers callback.
 */
export function handleUnauthorized(): void {
  clearToken();
  onUnauthorizedCallback?.();
}
