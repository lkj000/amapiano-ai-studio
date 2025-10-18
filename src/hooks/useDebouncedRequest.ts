import { useCallback, useRef } from 'react';

/**
 * Hook for debouncing API requests to prevent excessive calls
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 */
export function useDebouncedRequest<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}
