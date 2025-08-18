// ===== TESTE DE ENVIO DE MENSAGENS =====
// Execute este script para testar se o envio de mensagens está funcionando

require('dotenv').config();
const whatsappService = require('./src/services/whatsappService');
const evolutionApiService = require('./src/services/evolutionApi');

async function testSendMessage() {
  try {
    console.log('🧪 Testando envio de mensagens...\n');
    
    const instanceName = 'test11';
    const testNumber = '554497460856';
    const testMessage = 'Teste de mensagem - ' + new Date().toISOString();
    
    // 1. Verificar instâncias disponíveis
    console.log('1️⃣ Verificando instâncias disponíveis...');
    const instances = evolutionApiService.getInstances();
    console.log(`📊 ${instances.length} instâncias encontradas`);
    
    instances.forEach((inst, index) => {
      console.log(`   ${index + 1}. ${inst.instanceName}: ${inst.status}`);
    });
    
    // 2. Verificar se a instância específica está conectada
    console.log('\n2️⃣ Verificando instância específica...');
    const targetInstance = instances.find(inst => inst.instanceName === instanceName);
    
    if (!targetInstance) {
      console.log(`❌ Instância ${instanceName} não encontrada`);
      return;
    }
    
    console.log(`📱 Instância: ${targetInstance.instanceName}`);
    console.log(`📊 Status: ${targetInstance.status}`);
    console.log(`📞 Telefone: ${targetInstance.phone_number || 'N/A'}`);
    
    if (targetInstance.status !== 'connected') {
      console.log(`❌ Instância ${instanceName} não está conectada (status: ${targetInstance.status})`);
      console.log('💡 Conecte a instância primeiro antes de testar o envio');
      return;
    }
    
    // 3. Testar envio de mensagem
    console.log('\n3️⃣ Testando envio de mensagem...');
    console.log(`📤 Enviando para: ${testNumber}`);
    console.log(`💬 Mensagem: ${testMessage}`);
    
    try {
      const result = await whatsappService.sendMessage(instanceName, testNumber, testMessage);
      
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📊 Resultado:', result);
      
    } catch (sendError) {
      console.log('❌ Erro ao enviar mensagem:');
      console.log('   Tipo:', sendError.constructor.name);
      console.log('   Mensagem:', sendError.message);
      console.log('   Stack:', sendError.stack);
      
      // Verificar se é erro de instância não conectada
      if (sendError.message.includes('not connected')) {
        console.log('\n💡 Solução: Conecte a instância primeiro');
        console.log('   - Vá para a página de gerenciamento de instâncias');
        console.log('   - Clique em "Conectar" na instância desejada');
        console.log('   - Aguarde a conexão ser estabelecida');
      }
    }
    
    // 4. Testar via Evolution API diretamente
    console.log('\n4️⃣ Testando via Evolution API diretamente...');
    try {
      const directResult = await evolutionApiService.sendMessage(instanceName, testNumber, testMessage + ' (via API)');
      
      console.log('✅ Mensagem enviada via API com sucesso!');
      console.log('📊 Resultado:', directResult);
      
    } catch (apiError) {
      console.log('❌ Erro ao enviar via API:');
      console.log('   Mensagem:', apiError.message);
    }
    
    console.log('\n✅ Teste de envio concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testSendMessage(); 