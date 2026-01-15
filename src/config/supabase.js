const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client (full access, for backend use only)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Anon client (for frontend-like operations with RLS)
const supabaseAnon = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY || supabaseServiceKey
);

module.exports = {
  supabase,
  supabaseAnon
};
