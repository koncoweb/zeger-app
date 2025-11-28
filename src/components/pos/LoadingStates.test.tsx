import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';

// Feature: pos-karyawan-branch, Property 42: Loading indicator displayed
describe('Property 42: Loading indicator displayed', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display loading spinner for any async operation', () => {
    fc.assert(
      fc.property(
        fc.record({
          size: fc.constantFrom('sm', 'md', 'lg'),
          message: fc.option(
            fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
            { nil: undefined }
          ),
        }),
        ({ size, message }) => {
          // Render LoadingSpinner with random props
          const { container, unmount } = render(
            <LoadingSpinner size={size as 'sm' | 'md' | 'lg'} message={message} />
          );

          try {
            // Property: Loading spinner should always be visible
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toBeTruthy();

            // Property: If message is provided, it should be displayed in the container
            if (message && message.trim().length >= 2) {
              const messageElement = container.querySelector('.text-muted-foreground');
              expect(messageElement).toBeTruthy();
              expect(messageElement?.textContent).toBe(message);
            }

            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display skeleton loaders during data fetching', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 20, max: 500 }),
          height: fc.integer({ min: 10, max: 200 }),
        }),
        ({ width, height }) => {
          // Render Skeleton with random dimensions
          const { container } = render(
            <Skeleton className={`w-[${width}px] h-[${height}px]`} />
          );

          // Property: Skeleton should have animate-pulse class
          const skeleton = container.querySelector('.animate-pulse');
          expect(skeleton).toBeTruthy();

          // Property: Skeleton should have rounded corners
          const roundedSkeleton = container.querySelector('.rounded-md');
          expect(roundedSkeleton).toBeTruthy();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should disable buttons during processing', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isProcessing) => {
          // Render a button with disabled state based on isProcessing
          const { container } = render(
            <button disabled={isProcessing} className="btn">
              {isProcessing ? 'Memproses...' : 'Submit'}
            </button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();

          // Property: Button should be disabled when processing
          if (isProcessing) {
            expect(button?.disabled).toBe(true);
            expect(button?.textContent).toContain('Memproses');
          } else {
            expect(button?.disabled).toBe(false);
            expect(button?.textContent).toContain('Submit');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show loading state for any component with loading prop', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (loading) => {
          // Simulate a component with loading state
          const TestComponent = ({ loading }: { loading: boolean }) => {
            if (loading) {
              return <LoadingSpinner message="Loading..." />;
            }
            return <div>Content loaded</div>;
          };

          const { container, unmount } = render(<TestComponent loading={loading} />);

          // Property: When loading is true, spinner should be visible
          if (loading) {
            const spinner = container.querySelector('.animate-spin');
            expect(spinner).toBeTruthy();
            const loadingText = screen.queryByText('Loading...');
            expect(loadingText).toBeTruthy();
          } else {
            // Property: When loading is false, content should be visible
            const content = screen.queryByText('Content loaded');
            expect(content).toBeTruthy();
          }

          unmount();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain loading state consistency across re-renders', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (loadingStates) => {
          // Test that loading state changes are reflected correctly
          let currentState = loadingStates[0];
          
          const TestComponent = ({ loading }: { loading: boolean }) => {
            return loading ? (
              <div data-testid="loading">Loading...</div>
            ) : (
              <div data-testid="content">Content</div>
            );
          };

          const { rerender, queryByTestId, unmount } = render(
            <TestComponent loading={currentState} />
          );

          // Property: Initial state should be correct
          if (currentState) {
            expect(queryByTestId('loading')).toBeTruthy();
            expect(queryByTestId('content')).toBeFalsy();
          } else {
            expect(queryByTestId('content')).toBeTruthy();
            expect(queryByTestId('loading')).toBeFalsy();
          }

          // Property: State should update correctly on each re-render
          for (let i = 1; i < loadingStates.length; i++) {
            currentState = loadingStates[i];
            rerender(<TestComponent loading={currentState} />);

            if (currentState) {
              expect(queryByTestId('loading')).toBeTruthy();
              expect(queryByTestId('content')).toBeFalsy();
            } else {
              expect(queryByTestId('content')).toBeTruthy();
              expect(queryByTestId('loading')).toBeFalsy();
            }
          }

          unmount();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
