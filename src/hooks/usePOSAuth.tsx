import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/lib/types';

interface POSAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isKasir: boolean;
}

const POSAuthContext = createContext<POSAuthContextType | undefined>(undefined);

export const usePOSAuth = () => {
  const context = useContext(POSAuthContext);
  if (!context) {
    throw new Error('usePOSAuth must be used within POSAuthProvider');
  }
  return context;
};

export const POSAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingProfileRef = useRef(false);
  const fetchedUserIdRef = useRef<string | null>(null);

  // Kasir roles yang diizinkan
  const kasirRoles = ['bh_kasir', 'sb_kasir', '2_Hub_Kasir', '3_SB_Kasir'];
  const isKasir = profile ? kasirRoles.includes(profile.role) : false;

  const fetchUserProfile = async (userId: string, retries = 3): Promise<void> => {
    // Prevent multiple simultaneous fetches for the same user
    if (isFetchingProfileRef.current || fetchedUserIdRef.current === userId) {
      console.log('Profile fetch already in progress or already fetched, skipping...');
      setLoading(false);
      return;
    }

    try {
      isFetchingProfileRef.current = true;
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        // Jika profile tidak ditemukan dan masih ada retry, coba lagi
        if (profileError.code === 'PGRST116' && retries > 0) {
          console.log(`Profile not found, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          isFetchingProfileRef.current = false;
          return fetchUserProfile(userId, retries - 1);
        }
        throw profileError;
      }

      setProfile(data as Profile);
      setError(null);
      fetchedUserIdRef.current = userId;
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err);
      setProfile(null);
    } finally {
      setLoading(false);
      isFetchingProfileRef.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Sign in dengan Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Login gagal');
      }

      // Fetch profile dengan retry logic
      let profileData = null;
      let retries = 3;
      
      while (retries > 0 && !profileData) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (data) {
          profileData = data;
        } else if (profileError && profileError.code === 'PGRST116' && retries > 1) {
          console.log(`Profile not found, retrying... (${retries - 1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
        } else if (profileError) {
          throw profileError;
        }
      }

      if (!profileData) {
        throw new Error('Profile tidak ditemukan. Silakan hubungi administrator.');
      }

      // Check apakah user adalah kasir
      if (!kasirRoles.includes(profileData.role)) {
        await supabase.auth.signOut();
        throw new Error('Akses ditolak. Hanya kasir yang dapat menggunakan aplikasi POS.');
      }

      if (!profileData.is_active) {
        await supabase.auth.signOut();
        throw new Error('Akun Anda tidak aktif. Hubungi administrator.');
      }

      setUser(authData.user);
      setSession(authData.session);
      setProfile(profileData as Profile);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear local storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      await supabase.auth.signOut({ scope: 'global' });

      setUser(null);
      setSession(null);
      setProfile(null);
      setError(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        
        // Reset fetched user ID on sign out
        if (event === 'SIGNED_OUT') {
          fetchedUserIdRef.current = null;
          setProfile(null);
          setUser(null);
          setSession(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Only fetch profile on SIGNED_IN or INITIAL_SESSION events
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await fetchUserProfile(session.user.id);
          } else {
            // For other events, just ensure loading is false
            setLoading(false);
          }
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <POSAuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        error,
        signIn,
        signOut,
        isKasir,
      }}
    >
      {children}
    </POSAuthContext.Provider>
  );
};
