import { createClient } from '@supabase/supabase-js';

// These variables are expected to be available in the environment,
// as per the setup instructions. We provide fallback values for local
// development based on the Supabase CLI output from the instructions,
// in case `import.meta.env` is not populated.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || `${window.location.origin}/api/supabase`;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);