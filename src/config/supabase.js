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
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Prefer': 'return=representation'
    }
  },
  db: {
    schema: 'public'
  }
});

// Anon client (for frontend-like operations with RLS)
const supabaseAnon = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY || supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    },
    db: {
      schema: 'public'
    }
  }
);

module.exports = {
  supabase,
  supabaseAnon
};
