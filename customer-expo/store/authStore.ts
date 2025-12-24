import { create } from 'zustand';
import { supabase, CustomerUser } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  customerUser: CustomerUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  setCustomerUser: (user: CustomerUser | null) => void;
  fetchCustomerProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  completeProfile: (data: { name: string; phone: string; address: string }) => Promise<{ error: Error | null }>;
  updateProfile: (data: Partial<CustomerUser>) => Promise<{ error: Error | null }>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  customerUser: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
    });
  },

  setCustomerUser: (customerUser) => {
    set({ customerUser });
  },

  fetchCustomerProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customer_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching customer profile:', error);
        return;
      }

      set({ customerUser: data });
    } catch (error) {
      console.error('Error in fetchCustomerProfile:', error);
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      set({
        session: data.session,
        user: data.user,
        isAuthenticated: true,
      });

      // Fetch customer profile
      await get().fetchCustomerProfile();

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error, needsEmailConfirmation: false };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { error: null, needsEmailConfirmation: true };
      }

      if (data.session) {
        set({
          session: data.session,
          user: data.user,
          isAuthenticated: true,
        });
      }

      return { error: null, needsEmailConfirmation: false };
    } catch (error) {
      return { error: error as Error, needsEmailConfirmation: false };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({
        session: null,
        user: null,
        customerUser: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  completeProfile: async (data) => {
    const { user } = get();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { data: profile, error } = await supabase
        .from('customer_users')
        .upsert({
          user_id: user.id,
          email: user.email,
          name: data.name,
          phone: data.phone,
          address: data.address,
          role: 'customer',
          points: 0,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        return { error };
      }

      set({ customerUser: profile });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  updateProfile: async (data) => {
    const { customerUser } = get();
    if (!customerUser) {
      return { error: new Error('Customer profile not found') };
    }

    try {
      const { data: updated, error } = await supabase
        .from('customer_users')
        .update(data)
        .eq('id', customerUser.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      set({ customerUser: updated });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true });

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

        // Fetch customer profile
        await get().fetchCustomerProfile();
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
          await get().fetchCustomerProfile();
        } else {
          set({ customerUser: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
