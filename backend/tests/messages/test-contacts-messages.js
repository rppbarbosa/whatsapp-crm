require('dotenv').config();
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'whatsapp-crm-evolution-key-2024-secure',
  },
});

async function testContactsAndMessages() {
  console.log('🧪 Testando leitura de contatos e mensagens...\n');

  try {
    // 1. Verificar instâncias
    console.log('1️⃣ Verificando instâncias...');
    const instances = await api.get('/api/whatsapp/instances');
    console.log('📊 Instâncias:', instances.data.length);
    
    const connectedInstances = instances.data.filter(inst => inst.instance.status === 'connected');
    console.log('🔗 Instâncias conectadas:', connectedInstances.length);
    
    if (connectedInstances.length === 0) {
      console.log('❌ Nenhuma instância conectada encontrada');
      console.log('   Conecte uma instância primeiro para testar');
      return;
    }

    // 2. Testar leitura de contatos
    for (const instance of connectedInstances) {
      const instanceName = instance.instance.instanceName;
      console.log(`\n2️⃣ Testando contatos da instância: ${instanceName}`);
      
      try {
        const contacts = await api.get(`/api/whatsapp/instances/${instanceName}/contacts`);
        console.log(`✅ ${contacts.data.length} contatos encontrados`);
        
        // Mostrar alguns contatos de exemplo
        contacts.data.slice(0, 5).forEach((contact, index) => {
          console.log(`   ${index + 1}. ${contact.name} (${contact.phone})`);
        });
        
        if (contacts.data.length > 5) {
          console.log(`   ... e mais ${contacts.data.length - 5} contatos`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao obter contatos de ${instanceName}:`, error.response?.data || error.message);
      }
    }

    // 3. Testar leitura de mensagens
    for (const instance of connectedInstances) {
      const instanceName = instance.instance.instanceName;
      console.log(`\n3️⃣ Testando mensagens da instância: ${instanceName}`);
      
      try {
        const messages = await api.get(`/api/whatsapp/instances/${instanceName}/messages?limit=10`);
        console.log(`✅ ${messages.data.length} mensagens encontradas`);
        
        // Mostrar algumas mensagens de exemplo
        messages.data.slice(0, 3).forEach((message, index) => {
          const timestamp = new Date(message.timestamp * 1000).toLocaleString('pt-BR');
          const sender = message.isFromMe ? 'Você' : message.chatName;
          console.log(`   ${index + 1}. [${timestamp}] ${sender}: "${message.body.substring(0, 50)}..."`);
        });
        
        if (messages.data.length > 3) {
          console.log(`   ... e mais ${messages.data.length - 3} mensagens`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao obter mensagens de ${instanceName}:`, error.response?.data || error.message);
      }
    }

    // 4. Mostrar informações da instância
    console.log('\n4️⃣ Informações das instâncias:');
    connectedInstances.forEach(instance => {
      console.log(`   📱 ${instance.instance.instanceName}:`);
      console.log(`      Status: ${instance.instance.status}`);
      console.log(`      Número: ${instance.instance.phone_number || 'Não disponível'}`);
      console.log(`      Última atividade: ${instance.instance.lastActivity || 'Não disponível'}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

testContactsAndMessages(); 