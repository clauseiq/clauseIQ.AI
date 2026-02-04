import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in different environments (Vite vs CRA vs Node)
const getEnvVar = (viteKey: string, reactKey: string): string | undefined => {
  // Try Vite's import.meta.env
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[viteKey]) {
    return (import.meta as any).env[viteKey];
  }
  // Try process.env (Node/CRA fallback)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[viteKey] || process.env[reactKey];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY');

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');

if (!isConfigured) {
  console.warn('⚠️ Supabase credentials missing. Authentication will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Fallback to placeholder to prevent crash during initialization if vars are missing
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(finalUrl, finalKey);

// Export helper to check if valid config exists before attempting auth calls
export const isSupabaseConfigured = () => isConfigured;