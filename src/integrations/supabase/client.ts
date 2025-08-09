import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment detection
const getEnvironmentMode = (): 'local' | 'cloud' => {
  // Check for environment variable first
  const mode = import.meta.env.VITE_SUPABASE_MODE;
  if (mode === 'local' || mode === 'cloud') {
    return mode;
  }
  
  // Fallback: detect based on URL
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return url.includes('localhost') || url.includes('127.0.0.1') ? 'local' : 'cloud';
};

// Configuration based on environment
const getSupabaseConfig = () => {
  const mode = getEnvironmentMode();
  
  if (mode === 'local') {
    return {
      url: import.meta.env.VITE_SUPABASE_LOCAL_URL || 'http://localhost/rest',
      anonKey: import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }
  
  // Cloud configuration (fallback to current values)
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "https://yptbntyathrtnmgfotjs.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwdGJudHlhdGhydG5tZ2ZvdGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODc3MzksImV4cCI6MjA2Mzg2MzczOX0.zVwMo3fyirppLjgblyGWWbdjS5KKXJJmgy0sBY__w3s",
  };
};

const config = getSupabaseConfig();

// Export environment mode for debugging
export const supabaseMode = getEnvironmentMode();
export const supabaseConfig = config;

// Create and export the client
export const supabase = createClient<Database>(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Debug logging
console.log(`Supabase client initialized in ${supabaseMode} mode:`, {
  url: config.url,
  mode: supabaseMode
});