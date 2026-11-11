process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[Supabase] Variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY son requeridas.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-app-name': 'FireTrace-NASA-2026' }
  }
});

module.exports = supabase;
