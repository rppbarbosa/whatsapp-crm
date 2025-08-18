const axios = require('axios');
const { supabaseAdmin } = require('./src/services/supabase');
const evolutionApiService = require('./src/services/evolutionApi');

const API_BASE = 'http://localhost:3001/api';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

async function debugInstances() {
  try {
    console.log('🔍 Debugando instâncias...\n');
    
    // 1. Verificar instâncias no banco de dados
    console.log('1️⃣ Instâncias no banco de dados:');
    const { data: dbInstances, error: dbError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ Erro ao carregar do banco:', dbError);
    } else {
      console.log(`📊 Total no banco: ${dbInstances.length}`);
      dbInstances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instance_name}:`);
        console.log(`      Status: ${inst.status}`);
        console.log(`      Phone: ${inst.phone_number || 'N/A'}`);
        console.log(`      Created: ${inst.created_at}`);
        console.log(`      Updated: ${inst.updated_at}`);
        console.log('');
      });
    }
    
    // 2. Verificar instâncias ativas no serviço
    console.log('2️⃣ Instâncias ativas no serviço:');
    const activeInstances = evolutionApiService.getInstances();
    console.log(`📊 Total ativas: ${activeInstances.length}`);
    
    activeInstances.forEach((inst, index) => {
      const instance = inst.instance;
      console.log(`   ${index + 1}. ${instance.instanceName}:`);
      console.log(`      Status: ${instance.status}`);
      console.log(`      Phone: ${instance.phone_number || 'N/A'}`);
      console.log(`      Logs: ${instance.logs ? instance.logs.length : 0}`);
      console.log('');
    });
    
    // 3. Verificar instâncias no Map interno
    console.log('3️⃣ Instâncias no Map interno:');
    const internalInstances = Array.from(evolutionApiService.instances.keys());
    console.log(`📊 Total no Map: ${internalInstances.length}`);
    internalInstances.forEach((name, index) => {
      const client = evolutionApiService.instances.get(name);
      console.log(`   ${index + 1}. ${name}:`);
      console.log(`      IsReady: ${client.isReady}`);
      console.log(`      Info: ${client.info ? 'Present' : 'Missing'}`);
      console.log('');
    });
    
    // 4. Testar endpoint de API
    console.log('4️⃣ Testando endpoint de API:');
    try {
      const apiResponse = await axios.get(`${API_BASE}/whatsapp/instances`, {
        headers: { apikey: API_KEY }
      });
      
      const apiInstances = apiResponse.data;
      console.log(`📊 Total via API: ${apiInstances.length}`);
      
      apiInstances.forEach((inst, index) => {
        const instance = inst.instance;
        console.log(`   ${index + 1}. ${instance.instanceName}:`);
        console.log(`      Status: ${instance.status}`);
        console.log(`      Phone: ${instance.phone_number || 'N/A'}`);
        console.log(`      Persisted: ${inst.persisted || false}`);
        console.log('');
      });
      
      // 5. Testar contatos para cada instância conectada
      const connectedInstances = apiInstances.filter(inst => 
        inst.instance.status === 'connected'
      );
      
      console.log(`5️⃣ Testando contatos para ${connectedInstances.length} instância(s) conectada(s):`);
      
      for (const instance of connectedInstances) {
        const instanceName = instance.instance.instanceName;
        console.log(`📱 Testando: ${instanceName}`);
        
        try {
          const contactsResponse = await axios.get(`${API_BASE}/whatsapp/instances/${instanceName}/contacts`, {
            headers: { apikey: API_KEY }
          });
          
          const contacts = contactsResponse.data;
          console.log(`   ✅ Contatos: ${contacts.length}`);
          
        } catch (error) {
          console.log(`   ❌ Erro: ${error.response?.data?.message || error.message}`);
          
          // Debug adicional
          console.log(`   🔍 Verificando se instância existe no serviço...`);
          const serviceInstances = evolutionApiService.getInstances();
          const foundInService = serviceInstances.find(inst => 
            inst.instance.instanceName === instanceName
          );
          console.log(`   📊 Encontrada no serviço: ${!!foundInService}`);
          
          if (foundInService) {
            console.log(`   📊 Status no serviço: ${foundInService.instance.status}`);
            console.log(`   📊 IsReady: ${evolutionApiService.instances.get(instanceName)?.isReady}`);
          }
        }
        
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Erro na API:', error.response?.data || error.message);
    }
    
    console.log('✅ Debug concluído!');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugInstances(); 