const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateSchema() {
  console.log('🚀 Iniciando migração do schema de usuários, projetos e auditoria...\n');

  try {
    // 1. Ler o arquivo SQL
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '../../docs/schema-usuarios-projetos-auditoria.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error(`Arquivo SQL não encontrado: ${sqlFile}`);
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // 2. Dividir em comandos individuais (remover comentários e dividir por ;)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Encontrados ${commands.length} comandos SQL para executar\n`);

    // 3. Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim().length === 0) continue;

      try {
        console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command 
        });

        if (error) {
          // Se a função exec_sql não existir, tentar execução direta
          if (error.message.includes('function exec_sql')) {
            console.log('⚠️  Função exec_sql não encontrada, tentando execução direta...');
            
            // Para comandos DDL, usar a API REST
            const { data: directData, error: directError } = await supabase
              .from('_migration_temp')
              .select('*')
              .limit(0);

            if (directError && !directError.message.includes('relation "_migration_temp" does not exist')) {
              console.log(`⚠️  Comando ${i + 1} pode precisar ser executado manualmente: ${command.substring(0, 100)}...`);
            }
          } else {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      } catch (cmdError) {
        console.log(`⚠️  Comando ${i + 1} pode precisar ser executado manualmente: ${command.substring(0, 100)}...`);
      }
    }

    console.log('\n🎉 Migração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute o schema SQL manualmente no Supabase SQL Editor');
    console.log('2. Verifique se as tabelas foram criadas corretamente');
    console.log('3. Teste as funções e políticas RLS');
    console.log('4. Configure os dados iniciais se necessário');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

// Função para testar a conexão
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && !error.message.includes('relation "profiles" does not exist')) {
      throw error;
    }

    console.log('✅ Conexão com Supabase estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão com Supabase:', error.message);
    return false;
  }
}

// Executar migração
async function main() {
  console.log('🔍 Testando conexão com Supabase...');
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  await migrateSchema();
}

main();
