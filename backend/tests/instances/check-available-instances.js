// ===== VERIFICAR INSTÂNCIAS DISPONÍVEIS =====

require('dotenv').config();
const evolutionApiService = require('./src/services/evolutionApi');
const whatsappService = require('./src/services/whatsappService');

async function checkAvailableInstances() {
  try {
    console.log('🔍 Verificando instâncias disponíveis...\n');
    
    // 1. Verificar instâncias do Evolution API
    console.log('1️⃣ Instâncias do Evolution API:');
    const evolutionInstances = evolutionApiService.getInstances();
    console.log(`📊 ${evolutionInstances.length} instâncias encontradas`);
    
    if (evolutionInstances.length === 0) {
      console.log('   ⚠️ Nenhuma instância ativa no Evolution API');
    } else {
      evolutionInstances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instanceName}: ${inst.status}`);
        console.log(`      Telefone: ${inst.phone_number || 'N/A'}`);
        console.log(`      QR Code: ${inst.qrcode ? 'Disponível' : 'Não disponível'}`);
        console.log('');
      });
    }
    
    // 2. Verificar instâncias do WhatsApp Service
    console.log('2️⃣ Instâncias do WhatsApp Service:');
    const whatsappInstances = await whatsappService.getInstances();
    console.log(`📊 ${whatsappInstances.length} instâncias encontradas`);
    
    if (whatsappInstances.length === 0) {
      console.log('   ⚠️ Nenhuma instância encontrada no WhatsApp Service');
    } else {
      whatsappInstances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instance_name}: ${inst.status}`);
        console.log(`      Telefone: ${inst.phone_number || 'N/A'}`);
        console.log(`      Criado em: ${inst.created_at}`);
        console.log(`      Atualizado em: ${inst.updated_at}`);
        console.log('');
      });
    }
    
    // 3. Verificar instâncias conectadas
    console.log('3️⃣ Instâncias Conectadas:');
    const connectedInstances = evolutionInstances.filter(inst => inst.status === 'connected');
    console.log(`📊 ${connectedInstances.length} instâncias conectadas`);
    
    if (connectedInstances.length === 0) {
      console.log('   ⚠️ Nenhuma instância conectada');
      console.log('   💡 Para testar envio de mensagens, conecte uma instância primeiro');
    } else {
      connectedInstances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instanceName} (${inst.phone_number})`);
      });
    }
    
    // 4. Sugestões
    console.log('\n4️⃣ Sugestões:');
    if (evolutionInstances.length === 0) {
      console.log('   📝 Crie uma nova instância:');
      console.log('      - Vá para a página de gerenciamento de instâncias');
      console.log('      - Clique em "Criar Nova Instância"');
      console.log('      - Escaneie o QR code com o WhatsApp');
    } else if (connectedInstances.length === 0) {
      console.log('   📝 Conecte uma instância:');
      console.log('      - Vá para a página de gerenciamento de instâncias');
      console.log('      - Clique em "Conectar" na instância desejada');
      console.log('      - Aguarde a conexão ser estabelecida');
    } else {
      console.log('   ✅ Instâncias disponíveis para teste!');
      console.log(`   📱 Use a instância: ${connectedInstances[0].instanceName}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar instâncias:', error);
  }
}

// Executar verificação
checkAvailableInstances(); 