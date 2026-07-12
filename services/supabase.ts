import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilhjgmtcthsgecwpnvgt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaGpnbXRjdGhzZ2Vjd3Budmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODE1MjIsImV4cCI6MjA5OTM1NzUyMn0.EYSlEAc934Hqp-I2GfC9FqLC83JpTJJ3hqF4GLLMFjc';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const logError = (context: string, error: any) => {
  const msg = error.message || error;
  if (typeof msg === 'string' && msg.includes('Failed to fetch')) {
    console.warn(`[Supabase Network Issue][${context}]: Failed to fetch. This may be due to an adblocker, VPN, or network issue.`);
  } else {
    console.error(`[Supabase Error][${context}]:`, msg);
  }
};
