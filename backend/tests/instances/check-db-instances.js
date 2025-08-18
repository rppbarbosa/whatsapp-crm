// ===== VERIFICAR INSTÂNCIAS NO BANCO DE DADOS =====

require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');

async function checkDatabaseInstances() {
  try {
    console.log('🔍 Verificando instâncias no banco de dados...\n');
    
    // 1. Verificar instâncias na tabela whatsapp_instances
    console.log('1️⃣ Instâncias na tabela whatsapp_instances:');
    const { data: instances, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar instâncias:', error);
      return;
    }
    
    console.log(`📊 ${instances.length} instâncias encontradas no banco`);
    
    if (instances.length === 0) {
      console.log('   ⚠️ Nenhuma instância no banco de dados');
    } else {
      instances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instance_name}:`);
        console.log(`      Status: ${inst.status}`);
        console.log(`      Telefone: ${inst.phone_number || 'N/A'}`);
        console.log(`      Criado em: ${inst.created_at}`);
        console.log(`      Atualizado em: ${inst.updated_at}`);
        console.log(`      QR Code: ${inst.qr_code ? 'Disponível' : 'Não disponível'}`);
        console.log('');
      });
    }
    
    // 2. Verificar se há instâncias órfãs (no banco mas não ativas)
    console.log('2️⃣ Verificando instâncias órfãs...');
    const { data: orphanedInstances } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('instance_name, status')
      .neq('status', 'connected');
    
    if (orphanedInstances && orphanedInstances.length > 0) {
      console.log(`📊 ${orphanedInstances.length} instâncias não conectadas:`);
      orphanedInstances.forEach(inst => {
        console.log(`   - ${inst.instance_name}: ${inst.status}`);
      });
    } else {
      console.log('   ✅ Todas as instâncias estão conectadas ou não há instâncias');
    }
    
    // 3. Verificar contatos relacionados
    console.log('\n3️⃣ Verificando contatos relacionados...');
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('instance_name, count')
      .group('instance_name');
    
    if (contactsError) {
      console.error('❌ Erro ao buscar contatos:', contactsError);
    } else {
      console.log(`📊 Contatos por instância:`);
      contacts.forEach(contact => {
        console.log(`   - ${contact.instance_name}: ${contact.count} contatos`);
      });
    }
    
    // 4. Verificar mensagens relacionadas
    console.log('\n4️⃣ Verificando mensagens relacionadas...');
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('instance_name, count')
      .group('instance_name');
    
    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens:', messagesError);
    } else {
      console.log(`📊 Mensagens por instância:`);
      messages.forEach(msg => {
        console.log(`   - ${msg.instance_name}: ${msg.count} mensagens`);
      });
    }
    
    // 5. Sugestões baseadas nos dados
    console.log('\n5️⃣ Sugestões:');
    if (instances.length === 0) {
      console.log('   📝 Crie uma nova instância via frontend');
    } else if (instances.every(inst => inst.status !== 'connected')) {
      console.log('   🔄 Conecte uma instância existente via frontend');
      console.log('   📱 Instâncias disponíveis para conexão:');
      instances.forEach(inst => {
        console.log(`      - ${inst.instance_name} (${inst.status})`);
      });
    } else {
      console.log('   ✅ Instâncias conectadas disponíveis');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
  }
}

// Executar verificação
checkDatabaseInstances(); 