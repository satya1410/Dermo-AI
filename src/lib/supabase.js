import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy initialization of Supabase client
let supabaseClient = null;

export const supabase = (() => {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase environment variables not set. Database features will not work.');
      // Return a dummy client that won't crash but won't work
      supabaseClient = createClient('https://dummy.supabase.co', 'dummy-key', {
        auth: { autoRefreshToken: false, persistSession: false }
      });
    } else {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }
  return supabaseClient;
})();

// Client-side Supabase client (with anon key, limited access)
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}
