import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { getRedirectPath, getCurrentUserRole } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUpWithMagicLink: (email: string, metadata?: { [key: string]: any }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper function to redirect based on user role
  const redirectBasedOnRole = (user: User) => {
    const userRole = getCurrentUserRole(user);
    
    console.log('Redirecting based on role:', userRole);
    
    if (!userRole) {
      // If no valid role is set, redirect to role selection
      console.log('No valid role found, redirecting to role selection');
      navigate('/role-selection', {
        state: {
          message: "Please select your role to complete setup"
        }
      });
      return;
    }
    
    const redirectPath = getRedirectPath(user);
    navigate(redirectPath);
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If user is logged in and on auth page, redirect based on role
      if (session?.user && (window.location.pathname === '/auth' || window.location.pathname === '/login' || window.location.pathname === '/signup')) {
        redirectBasedOnRole(session.user);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.user_metadata?.role);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle different auth events
      if (event === 'SIGNED_IN' && session?.user) {
        // Only redirect if user is on auth pages
        if (window.location.pathname === '/auth' || window.location.pathname === '/login' || window.location.pathname === '/signup') {
          redirectBasedOnRole(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear role selection when user signs out
        localStorage.removeItem('roomzi_selected_role');
        navigate('/auth');
      }
      // Don't redirect on other auth state changes (like token refresh)
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signInWithMagicLink = async (email: string) => {
    console.log('Signing in with magic link for:', email);
    
    // Get the current role from localStorage to include in the magic link
    const currentRole = localStorage.getItem('roomzi_selected_role');
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: currentRole ? {
          role: currentRole,
          signup_source: 'web_app'
        } : undefined,
      },
    });

    if (error) throw error;
  };

  const signUpWithMagicLink = async (email: string, metadata?: { [key: string]: any }) => {
    console.log('Signing up with magic link and metadata:', metadata);
    
    // Get the current role from localStorage to include in the magic link
    const currentRole = localStorage.getItem('roomzi_selected_role');
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          ...metadata,
          role: currentRole || metadata?.role,
          signup_source: 'web_app'
        },
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Navigation will be handled by the auth state change listener
  };

  const value = {
    user,
    loading,
    signInWithMagicLink,
    signUpWithMagicLink,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 