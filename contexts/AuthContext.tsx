import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, PLANS } from '../types';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginWithEmail: (email: string) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  incrementUsage: () => Promise<boolean>; 
  hasAccess: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRIVILEGED_EMAILS = ['clauseiq.dev2026@gmail.com'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string, metadata?: any) => {
    try {
      const avatarUrl = metadata?.avatar_url || metadata?.picture;
      const fullName = metadata?.full_name || metadata?.name || email.split('@')[0];

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
          // Attempt self-heal on login
          const { data: newData } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                plan: 'Free',
                analyses_used: 0
            })
            .select()
            .single();
          data = newData;
      }

      if (data) {
        setUser({
          id: userId,
          email: email,
          name: fullName,
          avatarUrl: avatarUrl,
          plan: (data.plan as 'Free' | 'Pro' | 'Business') || 'Free',
          analysesUsed: data.analyses_used || 0
        });
      } else {
         // Fallback in-memory
         setUser({
            id: userId,
            email: email,
            name: fullName, 
            avatarUrl: avatarUrl,
            plan: 'Free',
            analysesUsed: 0
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user.id, session.user.email!, session.user.user_metadata);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured.");
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        console.log("Logged In:", session.user.email);
        await fetchProfile(session.user.id, session.user.email!, session.user.user_metadata);
        
        // Clean URL params
        if (window.location.hash && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!, session.user.user_metadata);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string) => {
    if (!isSupabaseConfigured()) return { error: "Configuration Error." };
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      return { error: error?.message || null };
    } catch (err) {
      return { error: "Authentication failed." };
    }
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured()) return { error: "Configuration Error." };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        }
      });
      return { error: error?.message || null };
    } catch (err) {
      return { error: "Google login failed" };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        // Race condition fix: Force logout locally if server takes too long (1s)
        await Promise.race([
          supabase.auth.signOut(),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);
      }
    } catch (err) {
      console.error("Sign out error", err);
    } finally {
      // 1. Clear React State
      setUser(null);
      
      // 2. Aggressively clear Supabase tokens from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user) return false;
    
    const isPrivileged = user.email && PRIVILEGED_EMAILS.includes(user.email);
    const limit = isPrivileged ? Infinity : PLANS[user.plan.toUpperCase() as keyof typeof PLANS].limit;
    
    if (user.analysesUsed >= limit) return false;

    // Optimistic update
    const newCount = user.analysesUsed + 1;
    setUser({ ...user, analysesUsed: newCount });

    if (isSupabaseConfigured()) {
       // We don't block on this promise
       supabase.from('profiles').update({ analyses_used: newCount }).eq('id', user.id).then();
    }
    return true;
  };

  const hasAccess = user 
    ? ((user.email && PRIVILEGED_EMAILS.includes(user.email)) || user.analysesUsed < PLANS[user.plan.toUpperCase() as keyof typeof PLANS].limit) 
    : false;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      loginWithEmail, 
      loginWithGoogle, 
      logout, 
      incrementUsage, 
      hasAccess, 
      isLoading,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};