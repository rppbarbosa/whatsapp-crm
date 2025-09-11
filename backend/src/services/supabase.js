const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

// Cliente Supabase para operações públicas
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase para operações administrativas (service role)
// Fallback seguro: se SERVICE_ROLE não estiver definido, usa anon (apenas para evitar crash)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

console.log('✅ Supabase configurado com sucesso');

module.exports = {
  supabase,
  supabaseAdmin
}; 