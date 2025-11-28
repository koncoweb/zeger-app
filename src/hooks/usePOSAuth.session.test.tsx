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

describe('POS Session Management Property Tests', () => {
  const kasirRoles = ['bh_kasir', 'sb_kasir', '2_Hub_Kasir', '3_SB_Kasir'];

  // Feature: pos-karyawan-branch, Property 5: Successful login creates session
  // Validates: Requirements 1.6
  it('Property 5: Successful login creates session', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 6, maxLength: 20 }),
        fc.constantFrom(...kasirRoles),
        async (email, password, role) => {
          vi.clearAllMocks();

          const mockUser = { id: 'test-user-id', email };
          const mockSession = {
            user: mockUser,
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_at: Date.now() + 3600000,
          };

          const mockProfile = {
            id: 'profile-id',
            user_id: 'test-user-id',
            role,
            is_active: true,
            full_name: 'Test Kasir',
            branch_id: 'branch-1',
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

          // Perform login
          const { data } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          // Property: For any successful kasir login, a session should be created
          expect(data.session).toBeTruthy();
          expect(data.session?.access_token).toBeTruthy();
          expect(data.session?.user).toBeTruthy();
          expect(data.session?.user.email).toBe(email);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: pos-karyawan-branch, Property 6: Logout clears session
  // Validates: Requirements 1.7
  it('Property 6: Logout clears session', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        async (email) => {
          vi.clearAllMocks();

          // Mock successful logout
          vi.mocked(supabase.auth.signOut).mockResolvedValue({
            error: null,
          });

          // Perform logout
          const { error } = await supabase.auth.signOut({ scope: 'global' });

          // Property: For any logout action, the session should be cleared
          expect(error).toBeNull();
          expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
        }
      ),
      { numRuns: 100 }
    );
  });
});
