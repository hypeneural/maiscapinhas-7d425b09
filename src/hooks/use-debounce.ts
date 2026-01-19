import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Delays updating the value until after the specified delay has passed
 * since the last time the input value changed.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
