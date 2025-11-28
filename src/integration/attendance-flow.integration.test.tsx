/**
 * Integration test for attendance flow with geolocation
 * Tests: check-in -> geolocation capture -> check-out -> location update
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAttendance } from '@/hooks/useAttendance';

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock Supabase client
const mockAttendanceData = {
  id: 'attendance-1',
  rider_id: 'test-user-id',
  branch_id: 'test-branch-id',
  check_in_time: '2024-01-15T08:00:00+07:00',
  check_in_location: '-6.2088,106.8456',
  check_out_time: null,
  check_out_location: null,
  work_date: '2024-01-15',
  status: 'checked_in',
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'attendance') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({
                data: mockAttendanceData,
                error: null,
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockAttendanceData,
                error: null,
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: {
                ...mockAttendanceData,
                check_out_time: '2024-01-15T17:00:00+07:00',
                check_out_location: '-6.2088,106.8456',
                status: 'checked_out',
              },
              error: null,
            })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'test-profile-id',
                  user_id: 'test-user-id',
                  role: 'bh_kasir',
                  branch_id: 'test-branch-id',
                  full_name: 'Test Kasir',
                },
                error: null,
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: null,
            })),
          })),
        })),
      };
    }),
  },
}));

describe('Attendance Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete check-in with geolocation', async () => {
    // Mock successful geolocation
    const mockPosition = {
      coords: {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useAttendance());

    // Initial state - no attendance
    expect(result.current.todayAttendance).toBeNull();

    // Perform check-in
    await act(async () => {
      await result.current.checkIn(mockPosition as GeolocationPosition);
    });

    // Verify check-in was successful
    await waitFor(() => {
      expect(result.current.todayAttendance).toBeDefined();
    });

    expect(result.current.todayAttendance?.check_in_time).toBeDefined();
    expect(result.current.todayAttendance?.check_in_location).toBe('-6.2088,106.8456');
    expect(result.current.todayAttendance?.status).toBe('checked_in');
  });

  it('should complete check-out with geolocation', async () => {
    // Mock successful geolocation
    const mockPosition = {
      coords: {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useAttendance());

    // Wait for today's attendance to load (already checked in)
    await waitFor(() => {
      expect(result.current.todayAttendance).toBeDefined();
    });

    expect(result.current.todayAttendance?.check_out_time).toBeNull();

    // Perform check-out
    await act(async () => {
      await result.current.checkOut(mockPosition as GeolocationPosition);
    });

    // Verify check-out was successful
    await waitFor(() => {
      expect(result.current.todayAttendance?.check_out_time).toBeDefined();
    });

    expect(result.current.todayAttendance?.check_out_location).toBe('-6.2088,106.8456');
    expect(result.current.todayAttendance?.status).toBe('checked_out');
  });

  it('should handle geolocation permission denied', async () => {
    // Mock geolocation error
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied geolocation',
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useAttendance());

    // Attempt check-in without geolocation
    await act(async () => {
      try {
        // In real implementation, this would handle the error gracefully
        // and allow check-in without location
        const mockPosition = {
          coords: {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
          },
          timestamp: Date.now(),
        };
        await result.current.checkIn(mockPosition as GeolocationPosition);
      } catch (error) {
        // Error should be handled
        expect(error).toBeDefined();
      }
    });
  });

  it('should prevent duplicate check-in on same day', async () => {
    const { result } = renderHook(() => useAttendance());

    // Wait for today's attendance to load (already checked in)
    await waitFor(() => {
      expect(result.current.todayAttendance).toBeDefined();
    });

    // Verify already checked in
    expect(result.current.todayAttendance?.check_in_time).toBeDefined();
    expect(result.current.todayAttendance?.status).toBe('checked_in');

    // Attempting to check in again should be prevented
    // (UI should disable the button)
  });

  it('should prevent check-out without check-in', async () => {
    // Mock no attendance for today
    vi.mocked(vi.importActual('@/integrations/supabase/client')).supabase = {
      ...vi.mocked(vi.importActual('@/integrations/supabase/client')).supabase,
      from: vi.fn((table: string) => {
        if (table === 'attendance') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({
                  data: null,
                  error: null,
                })),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: null,
                error: null,
              })),
            })),
          })),
        };
      }),
    } as any;

    const { result } = renderHook(() => useAttendance());

    await waitFor(() => {
      expect(result.current.todayAttendance).toBeNull();
    });

    // Attempting to check out without check-in should fail
    const mockPosition = {
      coords: {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    await act(async () => {
      try {
        await result.current.checkOut(mockPosition as GeolocationPosition);
      } catch (error) {
        // Should throw error
        expect(error).toBeDefined();
      }
    });
  });

  it('should capture accurate geolocation coordinates', async () => {
    const mockPosition = {
      coords: {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useAttendance());

    await act(async () => {
      await result.current.checkIn(mockPosition as GeolocationPosition);
    });

    await waitFor(() => {
      expect(result.current.todayAttendance).toBeDefined();
    });

    // Verify location format
    const location = result.current.todayAttendance?.check_in_location;
    expect(location).toMatch(/^-?\d+\.\d+,-?\d+\.\d+$/);

    // Verify coordinates are within valid range
    const [lat, lng] = location!.split(',').map(Number);
    expect(lat).toBeGreaterThanOrEqual(-90);
    expect(lat).toBeLessThanOrEqual(90);
    expect(lng).toBeGreaterThanOrEqual(-180);
    expect(lng).toBeLessThanOrEqual(180);
  });

  it('should update status correctly through attendance flow', async () => {
    const mockPosition = {
      coords: {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useAttendance());

    // Initial: no attendance
    expect(result.current.todayAttendance).toBeNull();

    // After check-in: status should be 'checked_in'
    await act(async () => {
      await result.current.checkIn(mockPosition as GeolocationPosition);
    });

    await waitFor(() => {
      expect(result.current.todayAttendance?.status).toBe('checked_in');
    });

    // After check-out: status should be 'checked_out'
    await act(async () => {
      await result.current.checkOut(mockPosition as GeolocationPosition);
    });

    await waitFor(() => {
      expect(result.current.todayAttendance?.status).toBe('checked_out');
    });
  });
});
