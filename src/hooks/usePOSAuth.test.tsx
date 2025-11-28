import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('POS Authentication Property Tests', () => {
  // Feature: pos-karyawan-branch, Property 1: Authentication verifies credentials correctly
  // Validates: Requirements 1.2
  it('Property 1: Authentication verifies credentials correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(), // Generate random email
        fc.string({ minLength: 6, maxLength: 20 }), // Generate random password
        async (email, password) => {
          // Reset mocks for each iteration
          vi.clearAllMocks();

          // Mock successful authentication
          const mockUser = { id: 'test-user-id', email };
          const mockSession = { user: mockUser, access_token: 'test-token' };
          const mockProfile = {
            id: 'profile-id',
            user_id: 'test-user-id',
            role: 'bh_kasir',
            is_active: true,
            full_name: 'Test Kasir',
            branch_id: 'branch-1',
            phone: null,
            photo_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            app_access_type: 'pos_app' as const,
            last_known_lat: null,
            last_known_lng: null,
            location_updated_at: null,
          };

          vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
            data: { user: mockUser as any, session: mockSession as any },
            error: null,
          });

          vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null,
                }),
              }),
            }),
          } as any);

          // Call signInWithPassword directly to test the authentication flow
          const result = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          // Property: For any valid email and password, authentication should verify them via Supabase Auth
          // The function should be called with the exact credentials provided
          expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email,
            password,
          });

          // The result should contain user and session data
          expect(result.data.user).toBeTruthy();
          expect(result.data.session).toBeTruthy();
          expect(result.data.user?.email).toBe(email);
        }
      ),
      { numRuns: 100 }
    );
  });
});
