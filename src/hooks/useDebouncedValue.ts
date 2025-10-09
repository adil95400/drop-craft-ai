import { useState, useEffect } from 'react';

/**
 * Hook pour debouncer une valeur et éviter les re-renders excessifs
 * Optimise la recherche et les filtres en temps réel
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
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
