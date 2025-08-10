import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment detection with enhanced local development support
const getEnvironmentMode = (): 'local' | 'cloud' => {
  // Check for environment variable first
  const mode = import.meta.env.VITE_SUPABASE_MODE;
  if (mode === 'local' || mode === 'cloud') {
    return mode;
  }
  
  // Fallback: detect based on URL patterns
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  return url.includes('localhost') || 
         url.includes('127.0.0.1') || 
         url.includes('api.localhost') ? 'local' : 'cloud';
};

// Enhanced configuration with automatic service discovery
const getSupabaseConfig = () => {
  const mode = getEnvironmentMode();
  
  if (mode === 'local') {
    // Enhanced local configuration with host-based routing
    const baseUrl = import.meta.env.VITE_SUPABASE_LOCAL_URL || 'http://api.localhost';
    const anonKey = import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY || 
                   import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    return {
      url: baseUrl,
      anonKey: anonKey,
      // Enhanced local configuration
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Local auth URL for proper redirects
          url: 'http://auth.localhost'
        },
        global: {
          headers: {
            'X-Client-Info': 'church-mgmt-local'
          }
        },
        // Custom fetch for local development
        fetch: (url: string, options?: RequestInit) => {
          // Rewrite URLs for host-based routing
          let rewrittenUrl = url;
          if (url.includes('/auth/v1/')) {
            rewrittenUrl = url.replace(baseUrl, 'http://auth.localhost');
          } else if (url.includes('/storage/v1/')) {
            rewrittenUrl = url.replace(baseUrl, 'http://storage.localhost');
          } else if (url.includes('/functions/v1/')) {
            rewrittenUrl = url.replace(baseUrl, 'http://functions.localhost');
          }
          
          return fetch(rewrittenUrl, {
            ...options,
            headers: {
              ...options?.headers,
              'X-Client-Info': 'church-mgmt-local'
            }
          });
        }
      }
    };
  }
  
  // Cloud configuration (production)
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "https://yptbntyathrtnmgfotjs.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwdGJudHlhdGhydG5tZ2ZvdGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODc3MzksImV4cCI6MjA2Mzg2MzczOX0.zVwMo3fyirppLjgblyGWWbdjS5KKXJJmgy0sBY__w3s",
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  };
};

const config = getSupabaseConfig();

// Export environment mode for debugging
export const supabaseMode = getEnvironmentMode();
export const supabaseConfig = config;

// Create and export the enhanced client
export const supabase = createClient<Database>(
  config.url, 
  config.anonKey, 
  config.options || {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Enhanced debug logging
console.log(`Supabase client initialized in ${supabaseMode} mode:`, {
  url: config.url,
  mode: supabaseMode,
  hasCustomOptions: !!config.options,
  authUrl: supabaseMode === 'local' ? 'http://auth.localhost' : 'default'
});