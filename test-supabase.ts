import { createClient } from '@supabase/supabase-js';
const url = 'https://ilhjgmtcthsgecwpnvgt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaGpnbXRjdGhzZ2Vjd3Budmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODE1MjIsImV4cCI6MjA5OTM1NzUyMn0.EYSlEAc934Hqp-I2GfC9FqLC83JpTJJ3hqF4GLLMFjc';
const supabase = createClient(url, key);
supabase.from('users').select('*').then(console.log).catch(console.error);
