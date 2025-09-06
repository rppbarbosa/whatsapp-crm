// Configurações do Supabase
// Para usar, crie um arquivo .env.local com as seguintes variáveis:

export const supabaseConfig = {
  // URL do seu projeto Supabase
  url: process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co',
  
  // Chave anônima do Supabase
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // Configurações de autenticação
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const
  }
};

// Instruções para configurar:
// 1. Acesse https://supabase.com
// 2. Crie um novo projeto
// 3. Vá em Settings > API
// 4. Copie a URL e a anon key
// 5. Crie um arquivo .env.local na raiz do frontend com:
//    REACT_APP_SUPABASE_URL=sua_url_aqui
//    REACT_APP_SUPABASE_ANON_KEY=sua_chave_aqui
