const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
}

// Cliente Supabase para operações públicas
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase para operações administrativas (service role)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabase,
  supabaseAdmin
}; 