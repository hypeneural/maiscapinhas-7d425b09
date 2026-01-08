/**
 * Secure Token Management
 * 
 * Uses memory as primary storage with sessionStorage as persistence layer.
 * Tokens are cleared when the browser tab is closed (more secure than localStorage).
 */

// In-memory token store (primary)
let memoryToken: string | null = null;

const TOKEN_KEY = 'mc_auth_token';

/**
 * Get the current authentication token
 */
export function getToken(): string | null {
  // Try memory first (fastest)
  if (memoryToken) {
    return memoryToken;
  }

  // Fallback to sessionStorage
  try {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  } catch {
    // sessionStorage not available (e.g., private browsing)
  }

  return null;
}

/**
 * Store the authentication token securely
 */
export function setToken(token: string): void {
  memoryToken = token;

  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // sessionStorage not available, token will only persist in memory
    console.warn('sessionStorage not available. Token will not persist on page reload.');
  }
}

/**
 * Clear the authentication token
 */
export function clearToken(): void {
  memoryToken = null;

  try {
    sessionStorage.removeItem(TOKEN_KEY);
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
