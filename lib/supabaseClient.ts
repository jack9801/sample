// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Server-side admin client (uses service_role key for full privileges)
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[Supabase Admin Client] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not Set');
  console.log('[Supabase Admin Client] Service Role Key:', supabaseServiceRoleKey ? supabaseServiceRoleKey.substring(0, 5) + '...' : 'Not Set');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase URL or Service Role Key are not set in environment variables.');
    throw new Error('Supabase environment variables are missing.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

// Client-side public client (uses anon key) - typically not used directly in this tRPC server context,
// but good to have if you need client-side Supabase interactions
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Supabase Client] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not Set');
  console.log('[Supabase Client] Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + '...' : 'Not Set');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key are not set in environment variables.');
    throw new Error('Supabase environment variables are missing.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
