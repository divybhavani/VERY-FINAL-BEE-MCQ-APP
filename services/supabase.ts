
import { createClient } from '@supabase/supabase-js';

// Support both Vite (VITE_) and Next.js (NEXT_PUBLIC_) prefixes for production flexibility
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error(
      'CRITICAL: Supabase credentials missing. \n' +
      'Check your .env file or Vercel Environment Variables. \n' +
      'Expected: VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL'
    );
  }
}

// Singleton client instance
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

/**
 * Production-ready error logger
 */
export const logError = (context: string, error: any) => {
  console.error(`[Supabase Error][${context}]:`, error.message || error);
  // In a real production app, you would send this to Sentry or Logtail
};
