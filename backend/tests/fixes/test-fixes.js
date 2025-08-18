// ===== TESTE DAS CORREÇÕES IMPLEMENTADAS =====
// Execute este script para testar as correções de timestamps e identificação

require('dotenv').config();
const evolutionApiService = require('./src/services/evolutionApi');
const whatsappService = require('./src/services/whatsappService');

async function testFixes() {
  try {
    console.log('🧪 Testando correções implementadas...\n');
    
    const instanceName = 'test11';
    
    // 1. Testar correção de timestamps
    console.log('1️⃣ Testando correção de timestamps...');
    try {
      const messages = await evolutionApiService.getMessages(instanceName, 5);
      
      if (messages.length > 0) {
        console.log(`📊 ${messages.length} mensagens obtidas`);
        
        messages.forEach((msg, index) => {
          const originalTimestamp = msg.timestamp;
          const date = new Date(originalTimestamp);
          const now = new Date();
          
          console.log(`   Mensagem ${index + 1}:`);
          console.log(`      ID: ${msg.id}`);
          console.log(`      Timestamp: ${originalTimestamp}`);
          console.log(`      Data: ${date.toISOString()}`);
          console.log(`      Agora: ${now.toISOString()}`);
          console.log(`      Diferença: ${Math.abs(now - date) / 1000 / 60} minutos`);
          console.log(`      Conversação ID: ${msg.conversationId}`);
          console.log(`      Clean From: ${msg.cleanFrom}`);
          console.log(`      Clean To: ${msg.cleanTo}`);
          console.log('');
        });
      } else {
        console.log('⚠️ Nenhuma mensagem encontrada');
      }
    } catch (error) {
      console.log(`❌ Erro ao testar timestamps: ${error.message}`);
    }
    
    // 2. Testar sincronização de mensagens
    console.log('2️⃣ Testando sincronização de mensagens...');
    try {
      const syncedMessages = await whatsappService.syncMessages(instanceName, 10);
      console.log(`✅ ${syncedMessages.length} mensagens sincronizadas`);
      
      if (syncedMessages.length > 0) {
        console.log('\nExemplos de mensagens sincronizadas:');
        syncedMessages.slice(0, 3).forEach((msg, index) => {
          const date = new Date(msg.timestamp);
          console.log(`   Mensagem ${index + 1}:`);
          console.log(`      ID: ${msg.id}`);
          console.log(`      From: ${msg.from_id}`);
          console.log(`      To: ${msg.to_id}`);
          console.log(`      Body: ${msg.body?.substring(0, 50)}...`);
          console.log(`      Timestamp: ${date.toISOString()}`);
          console.log(`      Is From Me: ${msg.is_from_me}`);
          console.log(`      Conversation ID: ${msg.conversation_id}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`❌ Erro ao sincronizar mensagens: ${error.message}`);
    }
    
    // 3. Testar conversas
    console.log('3️⃣ Testando conversas...');
    try {
      const conversations = await whatsappService.getConversations(instanceName);
      console.log(`✅ ${conversations.length} conversas encontradas`);
      
      if (conversations.length > 0) {
        console.log('\nExemplos de conversas:');
        conversations.slice(0, 5).forEach((conv, index) => {
          const date = new Date(conv.last_message_timestamp);
          console.log(`   Conversa ${index + 1}:`);
          console.log(`      ID: ${conv.contact_id}`);
          console.log(`      Nome: ${conv.contact_name}`);
          console.log(`      Telefone: ${conv.contact_phone}`);
          console.log(`      Última mensagem: ${conv.last_message_body?.substring(0, 50)}...`);
          console.log(`      Timestamp: ${date.toISOString()}`);
          console.log(`      Mensagens: ${conv.message_count}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar conversas: ${error.message}`);
    }
    
    // 4. Testar mensagens de conversa específica
    console.log('4️⃣ Testando mensagens de conversa específica...');
    try {
      const conversations = await whatsappService.getConversations(instanceName);
      
      if (conversations.length > 0) {
        const firstConversation = conversations[0];
        console.log(`📱 Testando conversa: ${firstConversation.contact_name} (${firstConversation.contact_id})`);
        
        const messages = await whatsappService.getConversationMessages(
          firstConversation.contact_id, 
          instanceName, 
          5
        );
        
        console.log(`✅ ${messages.length} mensagens encontradas para a conversa`);
        
        if (messages.length > 0) {
          console.log('\nExemplos de mensagens da conversa:');
          messages.slice(0, 3).forEach((msg, index) => {
            const date = new Date(msg.timestamp);
            console.log(`   Mensagem ${index + 1}:`);
            console.log(`      ID: ${msg.id}`);
            console.log(`      From: ${msg.from_id}`);
            console.log(`      To: ${msg.to_id}`);
            console.log(`      Body: ${msg.body?.substring(0, 50)}...`);
            console.log(`      Timestamp: ${date.toISOString()}`);
            console.log(`      Is From Me: ${msg.is_from_me}`);
            console.log('');
          });
        }
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar mensagens da conversa: ${error.message}`);
    }
    
    console.log('✅ Teste das correções concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testFixes(); 