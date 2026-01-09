/**
 * Session Timeout Hook
 * 
 * Automatically logs out the user after a period of inactivity.
 * Resets timer on user activity (mouse, keyboard, touch, scroll).
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLogout } from '@/hooks/api/use-auth';
import { toast } from 'sonner';

// Configuration
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes before timeout

interface UseSessionTimeoutOptions {
    timeoutMs?: number;
    onTimeout?: () => void;
    enabled?: boolean;
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
    const {
        timeoutMs = DEFAULT_TIMEOUT_MS,
        onTimeout,
        enabled = true,
    } = options;

    const logout = useLogout();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasWarnedRef = useRef(false);

    const handleTimeout = useCallback(() => {
        if (onTimeout) {
            onTimeout();
        } else {
            toast.warning('Sessão expirada por inatividade');
            logout.mutate();
        }
    }, [logout, onTimeout]);

    const showWarning = useCallback(() => {
        if (!hasWarnedRef.current) {
            hasWarnedRef.current = true;
            toast.info('Sua sessão expirará em 2 minutos por inatividade', {
                duration: 10000,
            });
        }
    }, []);

    const resetTimer = useCallback(() => {
        // Clear existing timers
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
        }

        // Reset warning flag
        hasWarnedRef.current = false;

        if (!enabled) return;

        // Set warning timer (2 minutes before timeout)
        const warningDelay = timeoutMs - WARNING_BEFORE_MS;
        if (warningDelay > 0) {
            warningRef.current = setTimeout(showWarning, warningDelay);
        }

        // Set timeout timer
        timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
    }, [enabled, timeoutMs, handleTimeout, showWarning]);

    useEffect(() => {
        if (!enabled) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        // Throttle activity detection
        let lastActivity = Date.now();
        const throttleMs = 1000; // Only reset once per second

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastActivity >= throttleMs) {
                lastActivity = now;
                resetTimer();
            }
        };

        // Add event listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Start initial timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningRef.current) {
                clearTimeout(warningRef.current);
            }
        };
    }, [enabled, resetTimer]);

    return { resetTimer };
}
