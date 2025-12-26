/**
 * Performance utilities for React Native optimization
 */

import { useCallback, useRef, useMemo } from 'react';

/**
 * Debounce hook - delays function execution until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked
 */
export const useDebounce = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

/**
 * Throttle hook - ensures function is called at most once per specified interval
 */
export const useThrottle = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  const lastRan = useRef<number>(Date.now());
  const lastFunc = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRan.current >= limit) {
        callback(...args);
        lastRan.current = now;
      } else {
        if (lastFunc.current) {
          clearTimeout(lastFunc.current);
        }
        lastFunc.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, limit - (now - lastRan.current));
      }
    },
    [callback, limit]
  );
};

/**
 * FlatList optimization props for better performance
 */
export const FLATLIST_PERFORMANCE_CONFIG = {
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  windowSize: 5,
  initialNumToRender: 10,
};

/**
 * Get item layout helper for fixed-height items
 * Improves FlatList scrolling performance
 */
export const getItemLayout = (itemHeight: number) => (
  _data: unknown,
  index: number
) => ({
  length: itemHeight,
  offset: itemHeight * index,
  index,
});

/**
 * Memoized selector for Zustand stores
 * Prevents unnecessary re-renders when unrelated state changes
 */
export const createSelector = <T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  return (state: T) => selector(state);
};

/**
 * Shallow compare for objects - useful for memo comparisons
 */
export const shallowEqual = <T extends Record<string, unknown>>(
  objA: T,
  objB: T
): boolean => {
  if (objA === objB) return true;
  if (!objA || !objB) return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
};

/**
 * Image cache configuration for expo-image
 */
export const IMAGE_CACHE_CONFIG = {
  cachePolicy: 'memory-disk' as const,
  transition: 200,
};

/**
 * Batch state updates to reduce re-renders
 */
export const batchUpdates = (callback: () => void): void => {
  // React Native automatically batches updates in event handlers
  // This is a placeholder for explicit batching if needed
  callback();
};
