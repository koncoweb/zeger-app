import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAttendance } from './useAttendance';
import { usePOSAuth } from './usePOSAuth';
import { supabase } from '@/integrations/supabase/client';
import * as fc from 'fast-check';

// Mock dependencies
vi.mock('./usePOSAuth');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockProfile = {
  id: 'test-user-id',
  user_id: 'test-auth-id',
  full_name: 'Test Kasir',
  phone: '081234567890',
  role: 'bh_kasir',
  branch_id: 'test-branch-id',
  is_active: true,
  app_access_type: 'pos_app' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('useAttendance Hook - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePOSAuth as any).mockReturnValue({
      profile: mockProfile,
    });
    
    // Default mock for initial fetch (returns null)
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    });
    (supabase.from as any) = mockFrom;
  });

  // Feature: pos-karyawan-branch, Property 33: Attendance status displayed
  it('Property 33: displays attendance status for any valid attendance record', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          rider_id: fc.constant(mockProfile.id),
          branch_id: fc.constant(mockProfile.branch_id),
          check_in_time: fc.date().map(d => d.toISOString()),
          check_in_location: fc.tuple(
            fc.double({ min: -90, max: 90 }),
            fc.double({ min: -180, max: 180 })
          ).map(([lat, lng]) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`),
          check_out_time: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
          check_out_location: fc.option(
            fc.tuple(
              fc.double({ min: -90, max: 90 }),
              fc.double({ min: -180, max: 180 })
            ).map(([lat, lng]) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`),
            { nil: null }
          ),
          work_date: fc.constant(new Date().toISOString().split('T')[0]),
          status: fc.constantFrom('checked_in', 'checked_out'),
        }),
        async (attendanceRecord) => {
          // Mock Supabase response
          const mockFrom = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: attendanceRecord,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          });
          (supabase.from as any) = mockFrom;

          const { result } = renderHook(() => useAttendance());

          await waitFor(() => {
            expect(result.current.todayAttendance).not.toBeNull();
          });

          // Property: For any valid attendance record, it should be displayed
          expect(result.current.todayAttendance).toEqual(attendanceRecord);
          expect(result.current.todayAttendance?.id).toBe(attendanceRecord.id);
          expect(result.current.todayAttendance?.status).toBe(attendanceRecord.status);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 34: Check-in creates attendance record
  it('Property 34: check-in creates attendance record for any valid location', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
          accuracy: fc.double({ min: 0, max: 100 }),
        }),
        async (coords) => {
          const mockLocation: GeolocationPosition = {
            coords: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          };

          const expectedAttendance = {
            id: 'new-attendance-id',
            rider_id: mockProfile.id,
            branch_id: mockProfile.branch_id,
            check_in_time: expect.any(String),
            check_in_location: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
            check_out_time: null,
            check_out_location: null,
            work_date: new Date().toISOString().split('T')[0],
            status: 'checked_in',
          };

          const mockFrom = vi.fn().mockReturnValue({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: expectedAttendance,
                  error: null,
                }),
              }),
            }),
          });
          (supabase.from as any) = mockFrom;

          const { result } = renderHook(() => useAttendance());

          await result.current.checkIn(mockLocation);

          // Property: For any valid location, check-in should create an attendance record
          expect(mockFrom).toHaveBeenCalledWith('attendance');
          expect(result.current.todayAttendance).not.toBeNull();
          expect(result.current.todayAttendance?.status).toBe('checked_in');
          expect(result.current.todayAttendance?.check_in_time).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 35: Check-in captures location
  it('Property 35: check-in captures location for any valid coordinates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.double({ min: -90, max: 90 }),
          longitude: fc.double({ min: -180, max: 180 }),
        }),
        async (coords) => {
          const mockLocation: GeolocationPosition = {
            coords: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          };

          const expectedLocationString = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

          let capturedInsertData: any = null;
          const mockFrom = vi.fn().mockReturnValue({
            insert: vi.fn().mockImplementation((data) => {
              capturedInsertData = data[0];
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      ...data[0],
                      id: 'new-id',
                    },
                    error: null,
                  }),
                }),
              };
            }),
          });
          (supabase.from as any) = mockFrom;

          const { result } = renderHook(() => useAttendance());

          await result.current.checkIn(mockLocation);

          // Property: For any valid coordinates, check-in should capture the location
          expect(capturedInsertData).not.toBeNull();
          expect(capturedInsertData.check_in_location).toBe(expectedLocationString);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 36: Check-out updates attendance record
  it('Property 36: check-out updates existing attendance record for any valid location', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          attendanceId: fc.uuid(),
          checkInTime: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
          checkOutCoords: fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
          }),
        }),
        async ({ attendanceId, checkInTime, checkOutCoords }) => {
          const existingAttendance = {
            id: attendanceId,
            rider_id: mockProfile.id,
            branch_id: mockProfile.branch_id,
            check_in_time: checkInTime.toISOString(),
            check_in_location: '0.000000, 0.000000',
            check_out_time: null,
            check_out_location: null,
            work_date: new Date().toISOString().split('T')[0],
            status: 'checked_in',
          };

          // Mock initial fetch
          const mockFromFetch = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: existingAttendance,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          });

          (supabase.from as any) = mockFromFetch;

          const { result } = renderHook(() => useAttendance());

          await waitFor(() => {
            expect(result.current.todayAttendance).not.toBeNull();
          });

          // Now mock the update
          const mockFromUpdate = vi.fn().mockReturnValue({
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      ...existingAttendance,
                      check_out_time: new Date().toISOString(),
                      check_out_location: `${checkOutCoords.latitude.toFixed(6)}, ${checkOutCoords.longitude.toFixed(6)}`,
                      status: 'checked_out',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          });
          (supabase.from as any) = mockFromUpdate;

          const mockLocation: GeolocationPosition = {
            coords: {
              latitude: checkOutCoords.latitude,
              longitude: checkOutCoords.longitude,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          };

          await result.current.checkOut(mockLocation);

          // Property: For any valid location, check-out should update the attendance record
          expect(mockFromUpdate).toHaveBeenCalledWith('attendance');
          expect(result.current.todayAttendance?.check_out_time).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 37: Check-out updates location and status
  it('Property 37: check-out updates location and status for any valid coordinates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          attendanceId: fc.uuid(),
          checkOutCoords: fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
          }),
        }),
        async ({ attendanceId, checkOutCoords }) => {
          const existingAttendance = {
            id: attendanceId,
            rider_id: mockProfile.id,
            branch_id: mockProfile.branch_id,
            check_in_time: new Date().toISOString(),
            check_in_location: '0.000000, 0.000000',
            check_out_time: null,
            check_out_location: null,
            work_date: new Date().toISOString().split('T')[0],
            status: 'checked_in',
          };

          // Mock initial fetch
          const mockFromFetch = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: existingAttendance,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          });

          (supabase.from as any) = mockFromFetch;

          const { result } = renderHook(() => useAttendance());

          await waitFor(() => {
            expect(result.current.todayAttendance).not.toBeNull();
          });

          const expectedLocationString = `${checkOutCoords.latitude.toFixed(6)}, ${checkOutCoords.longitude.toFixed(6)}`;

          let capturedUpdateData: any = null;
          const mockFromUpdate = vi.fn().mockReturnValue({
            update: vi.fn().mockImplementation((data) => {
              capturedUpdateData = data;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        ...existingAttendance,
                        ...data,
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          });
          (supabase.from as any) = mockFromUpdate;

          const mockLocation: GeolocationPosition = {
            coords: {
              latitude: checkOutCoords.latitude,
              longitude: checkOutCoords.longitude,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          };

          await result.current.checkOut(mockLocation);

          // Property: For any valid coordinates, check-out should update location and status
          expect(capturedUpdateData).not.toBeNull();
          expect(capturedUpdateData.check_out_location).toBe(expectedLocationString);
          expect(capturedUpdateData.status).toBe('checked_out');
          expect(capturedUpdateData.check_out_time).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
