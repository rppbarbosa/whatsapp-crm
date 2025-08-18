const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

async function testInstanceStatus() {
  try {
    console.log('🔍 Testando status das instâncias...\n');
    
    // 1. Listar todas as instâncias
    console.log('1️⃣ Listando instâncias...');
    const instancesResponse = await axios.get(`${API_BASE}/whatsapp/instances`, {
      headers: { apikey: API_KEY }
    });
    
    const instances = instancesResponse.data;
    console.log(`📊 Total de instâncias: ${instances.length}`);
    
    instances.forEach((instance, index) => {
      const inst = instance.instance;
      console.log(`   ${index + 1}. ${inst.instanceName}:`);
      console.log(`      Status: ${inst.status}`);
      console.log(`      Phone: ${inst.phone_number || 'N/A'}`);
      console.log(`      Logs: ${inst.logs ? inst.logs.length : 0}`);
      console.log(`      Persisted: ${instance.persisted || false}`);
      console.log('');
    });
    
    // 2. Testar cada instância conectada
    const connectedInstances = instances.filter(inst => 
      inst.instance.status === 'connected'
    );
    
    console.log(`2️⃣ Testando ${connectedInstances.length} instância(s) conectada(s)...\n`);
    
    for (const instance of connectedInstances) {
      const instanceName = instance.instance.instanceName;
      console.log(`📱 Testando instância: ${instanceName}`);
      
      try {
        // Testar contatos
        console.log(`   🔍 Testando contatos...`);
        const contactsResponse = await axios.get(`${API_BASE}/whatsapp/instances/${instanceName}/contacts`, {
          headers: { apikey: API_KEY }
        });
        
        const contacts = contactsResponse.data;
        console.log(`   ✅ Contatos: ${contacts.length}`);
        
        if (contacts.length > 0) {
          console.log(`   📋 Primeiros 3 contatos:`);
          contacts.slice(0, 3).forEach((contact, i) => {
            console.log(`      ${i + 1}. ${contact.name} (${contact.phone})`);
          });
        }
        
        // Testar mensagens
        console.log(`   💬 Testando mensagens...`);
        const messagesResponse = await axios.get(`${API_BASE}/whatsapp/instances/${instanceName}/messages?limit=5`, {
          headers: { apikey: API_KEY }
        });
        
        const messages = messagesResponse.data;
        console.log(`   ✅ Mensagens: ${messages.length}`);
        
        if (messages.length > 0) {
          console.log(`   📝 Primeiras 3 mensagens:`);
          messages.slice(0, 3).forEach((msg, i) => {
            const from = msg.isFromMe ? 'Eu' : msg.from;
            const preview = msg.body ? msg.body.substring(0, 50) + '...' : '[Sem texto]';
            console.log(`      ${i + 1}. ${from}: ${preview}`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.response?.data?.message || error.message}`);
      }
      
      console.log('');
    }
    
    // 3. Verificar instâncias não conectadas
    const disconnectedInstances = instances.filter(inst => 
      inst.instance.status !== 'connected'
    );
    
    if (disconnectedInstances.length > 0) {
      console.log(`3️⃣ Instâncias não conectadas (${disconnectedInstances.length}):`);
      disconnectedInstances.forEach((instance, index) => {
        const inst = instance.instance;
        console.log(`   ${index + 1}. ${inst.instanceName}: ${inst.status}`);
      });
      console.log('');
    }
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testInstanceStatus(); 