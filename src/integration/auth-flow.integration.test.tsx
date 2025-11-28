/**
 * Integration test for authentication flow end-to-end
 * Tests: login -> role check -> session management -> logout
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePOSAuth } from '@/hooks/usePOSAuth';

// Mock Supabase client
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
      getUser: mockGetUser,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-profile-id',
              user_id: 'test-user-id',
              role: 'bh_kasir',
              branch_id: 'test-branch-id',
              full_name: 'Test Kasir',
              is_active: true,
            },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full authentication flow for kasir', async () => {
    // Mock successful sign in
    mockSignIn.mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'kasir@test.com' },
        session: { access_token: 'test-token' },
      },
      error: null,
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'kasir@test.com' } },
      error: null,
    });

    const { result } = renderHook(() => usePOSAuth());

    // Initial state
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isKasir).toBe(false);

    // Step 1: Sign in
    await act(async () => {
      await result.current.signIn('kasir@test.com', 'password123');
    });

    // Step 2: Verify user is authenticated
    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });

    // Step 3: Verify profile is loaded with kasir role
    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
      expect(result.current.profile?.role).toBe('bh_kasir');
      expect(result.current.isKasir).toBe(true);
    });

    // Step 4: Sign out
    mockSignOut.mockResolvedValue({ error: null });

    await act(async () => {
      await result.current.signOut();
    });

    // Step 5: Verify session is cleared
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should reject non-kasir roles', async () => {
    // Mock sign in with non-kasir role
    mockSignIn.mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'admin@test.com' },
        session: { access_token: 'test-token' },
      },
      error: null,
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'admin@test.com' } },
      error: null,
    });

    // Mock profile with non-kasir role
    vi.mocked(vi.importActual('@/integrations/supabase/client')).supabase = {
      ...vi.mocked(vi.importActual('@/integrations/supabase/client')).supabase,
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-profile-id',
                user_id: 'test-user-id',
                role: 'admin',
                branch_id: null,
                full_name: 'Test Admin',
                is_active: true,
              },
              error: null,
            })),
          })),
        })),
      })),
    } as any;

    const { result } = renderHook(() => usePOSAuth());

    await act(async () => {
      await result.current.signIn('admin@test.com', 'password123');
    });

    await waitFor(() => {
      expect(result.current.profile).toBeDefined();
    });

    // Verify non-kasir is not granted access
    expect(result.current.isKasir).toBe(false);
  });

  it('should handle authentication errors', async () => {
    // Mock failed sign in
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    const { result } = renderHook(() => usePOSAuth());

    await act(async () => {
      try {
        await result.current.signIn('wrong@test.com', 'wrongpassword');
      } catch (error) {
        // Error should be thrown
        expect(error).toBeDefined();
      }
    });

    // User should remain null
    expect(result.current.user).toBeNull();
  });

  it('should verify session on mount', async () => {
    // Mock existing session
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'kasir@test.com' } },
      error: null,
    });

    const { result } = renderHook(() => usePOSAuth());

    // Wait for session verification
    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });
  });

  it('should handle multiple kasir role types', async () => {
    const kasirRoles = ['bh_kasir', 'sb_kasir', '2_Hub_Kasir', '3_SB_Kasir'];

    for (const role of kasirRoles) {
      mockSignIn.mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'kasir@test.com' },
          session: { access_token: 'test-token' },
        },
        error: null,
      });

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'kasir@test.com' } },
        error: null,
      });

      vi.mocked(vi.importActual('@/integrations/supabase/client')).supabase = {
        ...vi.mocked(vi.importActual('@/integrations/supabase/client')).supabase,
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'test-profile-id',
                  user_id: 'test-user-id',
                  role: role,
                  branch_id: 'test-branch-id',
                  full_name: 'Test Kasir',
                  is_active: true,
                },
                error: null,
              })),
            })),
          })),
        })),
      } as any;

      const { result } = renderHook(() => usePOSAuth());

      await act(async () => {
        await result.current.signIn('kasir@test.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.profile).toBeDefined();
      });

      // All kasir roles should be granted access
      expect(result.current.isKasir).toBe(true);
    }
  });
});
