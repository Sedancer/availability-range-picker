import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  override?: (val: T) => T,
  sanitize?: (value: unknown) => T
): [T, (value: T | ((val: T) => T)) => void] {
  const normalize = useCallback(
    (value: unknown): T => sanitize ? sanitize(value) : value as T,
    [sanitize]
  );

  const [storedValue, setStoredValue] = useState<T>(() => {
    let result: unknown = initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        result = initialValue;
      } else {
        const parsed = JSON.parse(item);
        if (
          typeof initialValue === 'object'
          && initialValue !== null
          && !Array.isArray(initialValue)
          && typeof parsed === 'object'
          && parsed !== null
          && !Array.isArray(parsed)
        ) {
          result = { ...initialValue, ...parsed };
        } else {
          result = parsed;
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      result = initialValue;
    }
    const normalized = normalize(result);
    return override ? normalize(override(normalized)) : normalized;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(normalize(storedValue)));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue, normalize]);

  const setSanitizedValue = (value: T | ((current: T) => T)) => {
    setStoredValue((current) => normalize(
      typeof value === 'function'
        ? (value as (current: T) => T)(current)
        : value
    ));
  };

  return [storedValue, setSanitizedValue];
}
