import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for debouncing callbacks
 * @param callback - The callback to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            const newTimer = setTimeout(() => {
                callback(...args);
            }, delay);

            setDebounceTimer(newTimer);
        },
        [callback, delay, debounceTimer]
    ) as T;

    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [debounceTimer]);

    return debouncedCallback;
}
