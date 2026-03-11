import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
}

// Only create client if URL is valid to avoid "supabaseUrl is required" error
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any); // Cast to any to avoid type errors in components, but they should check for null
