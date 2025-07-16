
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, isFirstAdmin?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enhanced validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true };
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Log security events for auth changes
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Input validation and sanitization
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    if (!validateEmail(sanitizedEmail)) {
      return { error: { message: 'Please enter a valid email address' } };
    }

    if (!password || password.length === 0) {
      return { error: { message: 'Password is required' } };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      if (error) {
        // Log failed sign-in attempts (without sensitive data)
        console.warn('Sign-in attempt failed for email:', sanitizedEmail);
      }
      
      return { error };
    } catch (err) {
      console.error('Sign-in error:', err);
      return { error: { message: 'An unexpected error occurred during sign-in' } };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, isFirstAdmin = false) => {
    // Input validation and sanitization
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);
    
    if (!validateEmail(sanitizedEmail)) {
      return { error: { message: 'Please enter a valid email address' } };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { error: { message: passwordValidation.message } };
    }

    if (!sanitizedFirstName || !sanitizedLastName) {
      return { error: { message: 'First name and last name are required' } };
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
          },
        },
      });
      
      if (error) {
        console.warn('Sign-up attempt failed for email:', sanitizedEmail);
        return { error };
      }

      // If this is the first admin and sign up was successful, initialize the system
      if (isFirstAdmin && data.user) {
        const { error: initError } = await supabase.rpc('initialize_system_with_admin', {
          _user_id: data.user.id
        });
        
        if (initError) {
          console.error('Error initializing system:', initError);
          return { error: initError };
        }
      }
      
      return { error };
    } catch (err) {
      console.error('Sign-up error:', err);
      return { error: { message: 'An unexpected error occurred during sign-up' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
