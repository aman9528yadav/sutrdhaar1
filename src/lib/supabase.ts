import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const finalUrl = typeof url === 'string' && url.trim() !== '' && url !== 'undefined' ? url : 'https://placeholder.supabase.co';
const finalKey = typeof key === 'string' && key.trim() !== '' && key !== 'undefined' ? key : 'placeholder';

console.log("[Supabase Init] Attempting to create client with URL length:", finalUrl.length);

let sb: any;
try {
  sb = createClient(finalUrl, finalKey);
} catch (error) {
  console.error("FAILED TO CREATE SUPABASE CLIENT:", error, "URL IS:", JSON.stringify(finalUrl));
  // Provide a dummy mock to prevent app crashes while debugging
  sb = {
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getSession: async () => ({ data: { session: null } }) },
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null }) }) }) })
  };
}

export const supabase = sb;
