/**
 * Security Utilities
 * 
 * Functions for input validation, URL sanitization, and security helpers.
 */

// ============================================================
// URL Validation
// ============================================================

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
const ALLOWED_DOMAINS = [
    'maiscapinhas.com.br',
    'api.maiscapinhas.com.br',
    'localhost',
];

/**
 * Validate and sanitize a URL
 * Returns null if URL is invalid or potentially malicious
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    try {
        const parsed = new URL(url, window.location.origin);

        // Check protocol
        if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
            console.warn('Blocked URL with disallowed protocol:', parsed.protocol);
            return null;
        }

        // For external URLs, check domain
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            const isAllowed = ALLOWED_DOMAINS.some(
                domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
            );

            // Allow relative URLs (same origin)
            const isSameOrigin = parsed.origin === window.location.origin;

            if (!isAllowed && !isSameOrigin) {
                console.warn('Blocked URL from disallowed domain:', parsed.hostname);
                return null;
            }
        }

        return parsed.href;
    } catch {
        // Invalid URL
        return null;
    }
}

/**
 * Check if a URL is safe to use in href/src
 */
export function isUrlSafe(url: string | null | undefined): boolean {
    return sanitizeUrl(url) !== null;
}

// ============================================================
// Input Sanitization
// ============================================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
    const htmlEscapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };

    return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Sanitize string input - trim and limit length
 */
export function sanitizeString(
    input: string | null | undefined,
    maxLength: number = 255
): string {
    if (!input) return '';
    return input.trim().slice(0, maxLength);
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string | null | undefined): string {
    if (!email) return '';
    return email.toLowerCase().trim().slice(0, 320);
}

// ============================================================
// Client Fingerprint (for rate limiting)
// ============================================================

/**
 * Generate a simple client fingerprint for rate limiting
 * Not for authentication - just to add friction to attacks
 */
export function getClientFingerprint(): string {
    const components = [
        navigator.userAgent || '',
        navigator.language || '',
        `${screen.width}x${screen.height}`,
        String(new Date().getTimezoneOffset()),
        navigator.hardwareConcurrency?.toString() || '',
    ];

    // Simple hash
    const str = components.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
}

// ============================================================
// Logout on all tabs (Broadcast Channel)
// ============================================================

const LOGOUT_CHANNEL_NAME = 'maiscapinhas-logout';
let logoutChannel: BroadcastChannel | null = null;

/**
 * Initialize logout broadcast channel
 */
export function initLogoutBroadcast(onLogout: () => void): () => void {
    if (typeof BroadcastChannel !== 'undefined') {
        logoutChannel = new BroadcastChannel(LOGOUT_CHANNEL_NAME);
        logoutChannel.onmessage = (event) => {
            if (event.data === 'logout') {
                onLogout();
            }
        };

        return () => {
            logoutChannel?.close();
            logoutChannel = null;
        };
    }
    return () => { };
}

/**
 * Broadcast logout to all tabs
 */
export function broadcastLogout(): void {
    if (logoutChannel) {
        logoutChannel.postMessage('logout');
    }
}

// ============================================================
// Console Log Removal (for production)
// ============================================================

/**
 * Disable console logs in production
 * Call this in main.tsx for production builds
 */
export function disableConsoleLogs(): void {
    if (import.meta.env.PROD) {
        console.log = () => { };
        console.debug = () => { };
        console.info = () => { };
        // Keep console.warn and console.error for debugging issues
    }
}

// ============================================================
// Exports
// ============================================================

export const security = {
    sanitizeUrl,
    isUrlSafe,
    escapeHtml,
    sanitizeString,
    sanitizeEmail,
    getClientFingerprint,
    initLogoutBroadcast,
    broadcastLogout,
    disableConsoleLogs,
};

export default security;
