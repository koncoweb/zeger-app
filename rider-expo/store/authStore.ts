import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { isRiderRole } from '@/lib/utils';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Skip initialization during SSR
      if (typeof window === 'undefined') {
        set({ isLoading: false });
        return;
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({
          session,
          user: session.user,
          isAuthenticated: true,
        });

        // Fetch profile
        await get().fetchProfile();

        // Validate rider role after fetching profile
        const { profile } = get();
        if (profile && !isRiderRole(profile.role)) {
          console.log('Non-rider user detected, signing out...');
          await supabase.auth.signOut();
          set({
            session: null,
            user: null,
            profile: null,
            isAuthenticated: false,
            error: 'Akun ini bukan akun rider',
          });
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);

        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });

        if (session) {
          await get().fetchProfile();
          
          // Validate rider role on auth state change
          const { profile } = get();
          if (profile && !isRiderRole(profile.role)) {
            console.log('Non-rider user detected on auth change, signing out...');
            await supabase.auth.signOut();
            set({
              session: null,
              user: null,
              profile: null,
              isAuthenticated: false,
              error: 'Akun ini bukan akun rider',
            });
          }
        } else {
          set({ profile: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ error: 'Gagal menginisialisasi autentikasi' });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMessage = error.message === 'Invalid login credentials'
          ? 'Email atau password salah'
          : error.message;
        set({ error: errorMessage });
        return { error: errorMessage };
      }

      set({
        session: data.session,
        user: data.user,
        isAuthenticated: true,
      });

      // Fetch profile and validate role
      await get().fetchProfile();

      const { profile } = get();
      if (!profile) {
        await supabase.auth.signOut();
        set({
          session: null,
          user: null,
          profile: null,
          isAuthenticated: false,
          error: 'Profil tidak ditemukan',
        });
        return { error: 'Profil tidak ditemukan' };
      }

      // Validate rider role
      if (!isRiderRole(profile.role)) {
        await supabase.auth.signOut();
        set({
          session: null,
          user: null,
          profile: null,
          isAuthenticated: false,
          error: 'Akun ini bukan akun rider',
        });
        return { error: 'Akun ini bukan akun rider' };
      }

      return { error: null };
    } catch (error) {
      const errorMessage = 'Terjadi kesalahan saat login';
      set({ error: errorMessage });
      return { error: errorMessage };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await supabase.auth.signOut();
      set({
        session: null,
        user: null,
        profile: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, branch:branches(*)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      set({ profile: data });
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  },
}));
