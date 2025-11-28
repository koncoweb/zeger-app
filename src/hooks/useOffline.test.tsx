import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOffline } from './useOffline';
import * as fc from 'fast-check';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('useOffline', () => {
  let onlineGetter: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Save original navigator
    originalNavigator = global.navigator;
    
    // Create a mock navigator with configurable onLine property
    onlineGetter = vi.fn(() => true);
    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        get onLine() {
          return onlineGetter();
        },
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    vi.clearAllMocks();
  });

  // Feature: pos-karyawan-branch, Property 46: Offline status notification
  it('should display offline status notification when network is disconnected', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // initial online state
        (initialOnline) => {
          // Set initial online state
          onlineGetter.mockReturnValue(initialOnline);

          const { result } = renderHook(() => useOffline());

          // Verify initial state matches navigator.onLine
          expect(result.current.isOnline).toBe(initialOnline);
          expect(result.current.isOffline).toBe(!initialOnline);

          // Simulate going offline
          onlineGetter.mockReturnValue(false);
          act(() => {
            window.dispatchEvent(new Event('offline'));
          });

          // Verify offline state
          expect(result.current.isOnline).toBe(false);
          expect(result.current.isOffline).toBe(true);

          // Simulate going back online
          onlineGetter.mockReturnValue(true);
          act(() => {
            window.dispatchEvent(new Event('online'));
          });

          // Verify online state
          expect(result.current.isOnline).toBe(true);
          expect(result.current.isOffline).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly reflect navigator.onLine state', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (onlineState) => {
          onlineGetter.mockReturnValue(onlineState);
          
          const { result } = renderHook(() => useOffline());
          
          expect(result.current.isOnline).toBe(onlineState);
          expect(result.current.isOffline).toBe(!onlineState);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple online/offline transitions', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (transitions) => {
          onlineGetter.mockReturnValue(true);
          const { result } = renderHook(() => useOffline());

          for (const shouldBeOnline of transitions) {
            onlineGetter.mockReturnValue(shouldBeOnline);
            act(() => {
              window.dispatchEvent(new Event(shouldBeOnline ? 'online' : 'offline'));
            });

            expect(result.current.isOnline).toBe(shouldBeOnline);
            expect(result.current.isOffline).toBe(!shouldBeOnline);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
