import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Create Supabase client with enhanced security configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable session persistence in localStorage
    persistSession: true,
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Detect session in URL (for email confirmations, password resets)
    detectSessionInUrl: true,
    // Set custom storage for better security
    storage: window.localStorage,
  },
  // Global headers for API requests
  global: {
    headers: {
      'x-application-name': 'db-coach',
    },
  },
});

// Auth event listener for debugging (remove in production)
if (import.meta.env.DEV) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session?.user?.email);
  });
}