/**
 * Login Rate Limiter
 * 
 * Client-side rate limiting to prevent brute force attempts.
 * This is a defense-in-depth measure; the server should also implement rate limiting.
 */

interface LoginAttempt {
    count: number;
    lastAttempt: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if a login attempt is allowed for the given email.
 * Returns true if allowed, false if rate limited.
 */
export function checkLoginRateLimit(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const record = loginAttempts.get(normalizedEmail);

    // No previous attempts
    if (!record) {
        return true;
    }

    // Reset if window has expired
    if (now - record.lastAttempt > WINDOW_MS) {
        loginAttempts.delete(normalizedEmail);
        return true;
    }

    // Check if under limit
    return record.count < MAX_ATTEMPTS;
}

/**
 * Record a login attempt for the given email.
 * Call this before making the actual login API request.
 */
export function recordLoginAttempt(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const record = loginAttempts.get(normalizedEmail);

    if (!record || now - record.lastAttempt > WINDOW_MS) {
        loginAttempts.set(normalizedEmail, { count: 1, lastAttempt: now });
    } else {
        loginAttempts.set(normalizedEmail, {
            count: record.count + 1,
            lastAttempt: now,
        });
    }
}

/**
 * Clear login attempts for an email (call on successful login).
 */
export function clearLoginAttempts(email: string): void {
    loginAttempts.delete(email.toLowerCase().trim());
}

/**
 * Get time remaining until rate limit resets (in seconds).
 * Returns 0 if not rate limited.
 */
export function getRateLimitRemainingTime(email: string): number {
    const normalizedEmail = email.toLowerCase().trim();
    const record = loginAttempts.get(normalizedEmail);

    if (!record || record.count < MAX_ATTEMPTS) {
        return 0;
    }

    const elapsed = Date.now() - record.lastAttempt;
    const remaining = WINDOW_MS - elapsed;

    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Get number of remaining attempts for an email.
 */
export function getRemainingAttempts(email: string): number {
    const normalizedEmail = email.toLowerCase().trim();
    const record = loginAttempts.get(normalizedEmail);
    const now = Date.now();

    if (!record || now - record.lastAttempt > WINDOW_MS) {
        return MAX_ATTEMPTS;
    }

    return Math.max(0, MAX_ATTEMPTS - record.count);
}
