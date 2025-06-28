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

// Enhanced auth error handling utility
export const handleAuthError = async (error: any): Promise<boolean> => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  
  // Handle refresh token errors
  if (errorMessage.includes('refresh_token_not_found') ||
      errorMessage.includes('Invalid Refresh Token') ||
      errorMessage.includes('refresh_token_expired') ||
      errorMessage.includes('JWT expired')) {
    
    console.log('Handling expired/invalid refresh token, clearing session...');
    
    try {
      // Import the utility function dynamically to avoid circular imports
      const { clearAuthSession } = await import('../utils/authUtils');
      await clearAuthSession();
      return true; // Handled
    } catch (clearError) {
      console.error('Error during session clearing:', clearError);
      
      // Fallback: manual cleanup
      try {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      } catch (fallbackError) {
        console.error('Fallback cleanup failed:', fallbackError);
      }
    }
  }
  
  return false; // Not handled
};

// Auth event listener for debugging and error handling
if (import.meta.env.DEV) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session?.user?.email);
  });
}

// Global error handler for Supabase requests
const originalRequest = supabase.auth.getUser;
supabase.auth.getUser = async function(...args) {
  try {
    return await originalRequest.apply(this, args);
  } catch (error) {
    const handled = await handleAuthError(error);
    if (!handled) {
      throw error;
    }
    // Return null user if error was handled
    return { data: { user: null }, error: null };
  }
};