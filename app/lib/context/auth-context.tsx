'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<{ 
  session: Session | null;
  user: User | null;
  signOut: () => void;
  loading: boolean;
  isEmailVerified: boolean;
}>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
  isEmailVerified: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let refreshInterval: NodeJS.Timeout;

    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setUser(data.user ?? null);
          setSession(null);
          setLoading(false);
          console.log('AuthContext: Initial user loaded', data.user);
        }
      } catch (error) {
        console.error('Unexpected error in getUser:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    };

    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        if (mounted && data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Check if session is expired
          if (data.session.expires_at && new Date(data.session.expires_at * 1000) < new Date()) {
            console.log('Session expired, signing out');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            router.push('/login');
            return;
          }
        }
      } catch (error) {
        console.error('Unexpected error in getSession:', error);
      }
    };

    const setupAuth = async () => {
      await getUser();
      await getSession();
    };

    setupAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed', event, session, session?.user);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Check if email is verified
          if (!session.user.email_confirmed_at) {
            router.push('/auth/verify-email');
          } else {
            router.push('/polls');
          }
        }
      }
    });

    // Set up automatic token refresh
    const setupTokenRefresh = () => {
      refreshInterval = setInterval(async () => {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession && currentSession.expires_at) {
            const expiresAt = new Date(currentSession.expires_at * 1000);
            const now = new Date();
            const timeUntilExpiry = expiresAt.getTime() - now.getTime();
            
            // Refresh token if it expires in less than 5 minutes
            if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
              console.log('Refreshing token...');
              const { error } = await supabase.auth.refreshSession();
              if (error) {
                console.error('Error refreshing token:', error);
                await supabase.auth.signOut();
                router.push('/login');
              }
            }
          }
        } catch (error) {
          console.error('Error in token refresh:', error);
        }
      }, 60000); // Check every minute
    };

    setupTokenRefresh();

    return () => {
      mounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isEmailVerified = user?.email_confirmed_at ? true : false;

  console.log('AuthContext: user', user, 'isEmailVerified:', isEmailVerified);
  
  return (
    <AuthContext.Provider value={{ session, user, signOut, loading, isEmailVerified }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
