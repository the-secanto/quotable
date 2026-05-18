import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (import.meta.env.SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta.env.SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured =
  !!supabaseUrl &&
  supabaseUrl !== 'https://your-project-url.supabase.co' &&
  !!supabaseAnonKey &&
  supabaseAnonKey !== 'your-anon-key';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function signInWithMagicLink(email: string) {
  if (!supabase) return { data: null, error: new Error('Cloud sync not configured') };
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) return { data: null, error: new Error('Cloud sync not configured') };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword(email: string, password: string, username?: string) {
  if (!supabase) return { data: null, error: new Error('Cloud sync not configured') };
  return supabase.auth.signUp({
    email,
    password,
    options: { 
      emailRedirectTo: window.location.origin,
      data: { username }
    },
  });
}

// legacy alias
export const signIn = signInWithMagicLink;

export async function signOut() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}
