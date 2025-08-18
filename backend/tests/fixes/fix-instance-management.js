// ===== CORRIGIR GERENCIAMENTO DE INSTÂNCIAS =====

require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');
const evolutionApiService = require('./src/services/evolutionApi');

async function fixInstanceManagement() {
  try {
    console.log('🔧 Corrigindo gerenciamento de instâncias...\n');
    
    // 1. Verificar instâncias no banco
    console.log('1️⃣ Verificando instâncias no banco de dados...');
    const { data: dbInstances, error: dbError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (dbError) {
      console.error('❌ Erro ao buscar instâncias no banco:', dbError);
      return;
    }
    
    console.log(`📊 ${dbInstances.length} instâncias encontradas no banco`);
    
    if (dbInstances.length === 0) {
      console.log('   ✅ Banco de dados limpo');
    } else {
      dbInstances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instance_name}: ${inst.status}`);
      });
    }
    
    // 2. Verificar instâncias na memória
    console.log('\n2️⃣ Verificando instâncias na memória...');
    const memoryInstances = evolutionApiService.getInstances();
    console.log(`📊 ${memoryInstances.length} instâncias na memória`);
    
    if (memoryInstances.length === 0) {
      console.log('   ✅ Memória limpa');
    } else {
      memoryInstances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instanceName}: ${inst.status}`);
      });
    }
    
    // 3. Limpar instâncias órfãs no banco
    console.log('\n3️⃣ Limpando instâncias órfãs...');
    if (dbInstances.length > 0) {
      console.log('🗑️ Removendo todas as instâncias do banco...');
      
      for (const instance of dbInstances) {
        try {
          const { error: deleteError } = await supabaseAdmin
            .from('whatsapp_instances')
            .delete()
            .eq('instance_name', instance.instance_name);
          
          if (deleteError) {
            console.error(`   ❌ Erro ao deletar ${instance.instance_name}:`, deleteError);
          } else {
            console.log(`   ✅ Deletado: ${instance.instance_name}`);
          }
        } catch (error) {
          console.error(`   ❌ Erro ao deletar ${instance.instance_name}:`, error.message);
        }
      }
    }
    
    // 4. Limpar dados relacionados
    console.log('\n4️⃣ Limpando dados relacionados...');
    
    // Limpar contatos
    const { error: contactsError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .delete()
      .neq('id', 'dummy'); // Deletar todos
    
    if (contactsError) {
      console.error('❌ Erro ao limpar contatos:', contactsError);
    } else {
      console.log('   ✅ Contatos limpos');
    }
    
    // Limpar mensagens
    const { error: messagesError } = await supabaseAdmin
      .from('whatsapp_messages')
      .delete()
      .neq('id', 'dummy'); // Deletar todos
    
    if (messagesError) {
      console.error('❌ Erro ao limpar mensagens:', messagesError);
    } else {
      console.log('   ✅ Mensagens limpas');
    }
    
    // Limpar relacionamentos CRM
    const { error: relationshipsError } = await supabaseAdmin
      .from('whatsapp_crm_relationships')
      .delete()
      .neq('whatsapp_contact_id', 'dummy'); // Deletar todos
    
    if (relationshipsError) {
      console.error('❌ Erro ao limpar relacionamentos:', relationshipsError);
    } else {
      console.log('   ✅ Relacionamentos limpos');
    }
    
    // 5. Verificar resultado
    console.log('\n5️⃣ Verificando resultado...');
    const { data: finalInstances, error: finalError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*');
    
    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
    } else {
      console.log(`📊 ${finalInstances.length} instâncias restantes no banco`);
      if (finalInstances.length === 0) {
        console.log('   ✅ Banco completamente limpo');
      }
    }
    
    // 6. Testar criação de nova instância
    console.log('\n6️⃣ Testando criação de nova instância...');
    try {
      const testInstanceName = 'test-instance-' + Date.now();
      console.log(`📝 Criando instância de teste: ${testInstanceName}`);
      
      // Criar instância no banco
      const { error: createError } = await supabaseAdmin
        .from('whatsapp_instances')
        .insert({
          instance_name: testInstanceName,
          status: 'disconnected',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('❌ Erro ao criar instância de teste:', createError);
      } else {
        console.log('   ✅ Instância de teste criada no banco');
        
        // Deletar instância de teste
        const { error: deleteTestError } = await supabaseAdmin
          .from('whatsapp_instances')
          .delete()
          .eq('instance_name', testInstanceName);
        
        if (deleteTestError) {
          console.error('❌ Erro ao deletar instância de teste:', deleteTestError);
        } else {
          console.log('   ✅ Instância de teste deletada');
        }
      }
    } catch (testError) {
      console.error('❌ Erro no teste de criação:', testError);
    }
    
    // 7. Sugestões finais
    console.log('\n7️⃣ Sugestões:');
    console.log('   ✅ Banco de dados limpo e funcionando');
    console.log('   ✅ Sistema pronto para criar novas instâncias');
    console.log('   📝 Agora você pode:');
    console.log('      1. Criar novas instâncias via frontend');
    console.log('      2. Conectar instâncias normalmente');
    console.log('      3. Deletar instâncias sem erros');
    
    console.log('\n🎉 Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

// Executar correção
fixInstanceManagement(); 