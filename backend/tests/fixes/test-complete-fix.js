require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');
const evolutionApiService = require('./src/services/evolutionApi');

async function testCompleteFix() {
  console.log('🧪 TESTE COMPLETO DO SISTEMA WHATSAPP');
  console.log('='.repeat(50));
  
  try {
    // 1. Testar função SQL corrigida
    console.log('\n1️⃣ Testando função get_instance_conversations...');
    const { data: conversations, error: convError } = await supabaseAdmin
      .rpc('get_instance_conversations', { instance_name_param: 'test11' });

    if (convError) {
      console.error('❌ Erro na função SQL:', convError);
    } else {
      console.log(`✅ Função SQL funcionando: ${conversations.length} conversas encontradas`);
    }

    // 2. Testar função get_active_instances
    console.log('\n2️⃣ Testando função get_active_instances...');
    const { data: activeInstances, error: activeError } = await supabaseAdmin
      .rpc('get_active_instances');

    if (activeError) {
      console.error('❌ Erro na função get_active_instances:', activeError);
    } else {
      console.log(`✅ Função get_active_instances funcionando: ${activeInstances.length} instâncias ativas`);
    }

    // 3. Testar estrutura da tabela whatsapp_instances
    console.log('\n3️⃣ Verificando estrutura da tabela whatsapp_instances...');
    const { data: instances, error: instancesError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .limit(5);

    if (instancesError) {
      console.error('❌ Erro ao buscar instâncias:', instancesError);
    } else {
      console.log(`✅ Tabela whatsapp_instances funcionando: ${instances.length} instâncias encontradas`);
      if (instances.length > 0) {
        const instance = instances[0];
        console.log(`   📱 Exemplo: ${instance.instance_name} - ${instance.status}`);
        console.log(`   🔑 QR Code salvo: ${instance.qr_code ? 'Sim' : 'Não'}`);
      }
    }

    // 4. Testar estrutura da tabela whatsapp_contacts
    console.log('\n4️⃣ Verificando estrutura da tabela whatsapp_contacts...');
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('*')
      .limit(5);

    if (contactsError) {
      console.error('❌ Erro ao buscar contatos:', contactsError);
    } else {
      console.log(`✅ Tabela whatsapp_contacts funcionando: ${contacts.length} contatos encontrados`);
    }

    // 5. Testar estrutura da tabela whatsapp_messages
    console.log('\n5️⃣ Verificando estrutura da tabela whatsapp_messages...');
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .limit(5);

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens:', messagesError);
    } else {
      console.log(`✅ Tabela whatsapp_messages funcionando: ${messages.length} mensagens encontradas`);
    }

    // 6. Testar índices
    console.log('\n6️⃣ Verificando índices...');
    const { data: indexes, error: indexesError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `
          SELECT indexname, tablename 
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname LIKE 'idx_whatsapp%'
        `
      });

    if (indexesError) {
      console.error('❌ Erro ao verificar índices:', indexesError);
    } else {
      console.log(`✅ Índices encontrados: ${indexes?.length || 0}`);
      if (indexes && indexes.length > 0) {
        indexes.forEach(idx => {
          console.log(`   📊 ${idx.indexname} -> ${idx.tablename}`);
        });
      }
    }

    // 7. Testar view active_conversations
    console.log('\n7️⃣ Testando view active_conversations...');
    const { data: activeConversations, error: viewError } = await supabaseAdmin
      .from('active_conversations')
      .select('*')
      .limit(5);

    if (viewError) {
      console.error('❌ Erro na view active_conversations:', viewError);
    } else {
      console.log(`✅ View active_conversations funcionando: ${activeConversations.length} conversas ativas`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ TESTE COMPLETO FINALIZADO');
    console.log('='.repeat(50));
    
    // Resumo
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`   🗄️ Função SQL: ${convError ? '❌' : '✅'}`);
    console.log(`   📱 Instâncias ativas: ${activeError ? '❌' : '✅'}`);
    console.log(`   📋 Tabela instâncias: ${instancesError ? '❌' : '✅'}`);
    console.log(`   👥 Tabela contatos: ${contactsError ? '❌' : '✅'}`);
    console.log(`   💬 Tabela mensagens: ${messagesError ? '❌' : '✅'}`);
    console.log(`   📊 Índices: ${indexesError ? '❌' : '✅'}`);
    console.log(`   👁️ View conversas: ${viewError ? '❌' : '✅'}`);
    
  } catch (error) {
    console.error('❌ Erro no teste completo:', error);
  }
}

async function main() {
  await testCompleteFix();
}

main().catch(console.error); 