import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  override?: (val: T) => T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    let result: T;
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        result = initialValue;
      } else {
        const parsed = JSON.parse(item);
        if (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue)) {
          result = { ...initialValue, ...parsed };
        } else {
          result = parsed;
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      result = initialValue;
    }
    return override ? override(result) : result;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
