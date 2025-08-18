// ===== TESTE DO SISTEMA DE CACHE =====
// Execute este script para testar o sistema de cache de contatos

require('dotenv').config();
const evolutionApiService = require('./src/services/evolutionApi');
const whatsappService = require('./src/services/whatsappService');

async function testCacheSystem() {
  try {
    console.log('🧪 Testando sistema de cache de contatos...\n');
    
    // Verificar instâncias disponíveis
    console.log('0️⃣ Verificando instâncias disponíveis...');
    const instances = evolutionApiService.getInstances();
    console.log(`📱 Instâncias ativas: ${instances.length}`);
    
    if (instances.length === 0) {
      console.log('❌ Nenhuma instância ativa encontrada');
      console.log('💡 Certifique-se de que o servidor está rodando e há instâncias conectadas');
      return;
    }
    
    // Usar a primeira instância disponível
    const instanceName = instances[0].instance.instanceName;
    console.log(`🔍 Usando instância: ${instanceName}\n`);
    
    // 1. Verificar status inicial do cache
    console.log('1️⃣ Verificando status inicial do cache...');
    const initialCacheStatus = evolutionApiService.getCacheStatus(instanceName);
    console.log('Status inicial:', initialCacheStatus);
    console.log('');
    
    // 2. Tentar obter contatos (deve falhar se cliente não estiver pronto)
    console.log('2️⃣ Tentando obter contatos...');
    try {
      const contacts = await evolutionApiService.getContacts(instanceName);
      console.log(`✅ Contatos obtidos: ${contacts.length}`);
      console.log(`📊 Status do cache após obtenção:`, evolutionApiService.getCacheStatus(instanceName));
    } catch (error) {
      console.log(`❌ Erro ao obter contatos: ${error.message}`);
      console.log(`📊 Status do cache após erro:`, evolutionApiService.getCacheStatus(instanceName));
    }
    console.log('');
    
    // 3. Verificar se há cache disponível
    console.log('3️⃣ Verificando se há cache disponível...');
    const cacheStatus = evolutionApiService.getCacheStatus(instanceName);
    if (cacheStatus.hasCache) {
      console.log(`✅ Cache disponível com ${cacheStatus.contactsCount} contatos`);
      console.log(`📅 Última atualização: ${cacheStatus.lastUpdate}`);
      console.log(`⏰ Expira em: ${cacheStatus.expiresAt}`);
    } else {
      console.log('❌ Nenhum cache disponível');
    }
    console.log('');
    
    // 4. Testar sincronização com cache
    console.log('4️⃣ Testando sincronização com cache...');
    try {
      const syncedContacts = await whatsappService.syncContacts(instanceName, false);
      console.log(`✅ Sincronização concluída: ${syncedContacts.length} contatos`);
    } catch (error) {
      console.log(`❌ Erro na sincronização: ${error.message}`);
    }
    console.log('');
    
    // 5. Forçar atualização do cache
    console.log('5️⃣ Testando forçar atualização do cache...');
    try {
      const refreshedContacts = await evolutionApiService.forceRefreshContacts(instanceName);
      console.log(`✅ Cache atualizado: ${refreshedContacts.length} contatos`);
      console.log(`📊 Status do cache após atualização:`, evolutionApiService.getCacheStatus(instanceName));
    } catch (error) {
      console.log(`❌ Erro ao forçar atualização: ${error.message}`);
    }
    console.log('');
    
    // 6. Testar sincronização com force refresh
    console.log('6️⃣ Testando sincronização com force refresh...');
    try {
      const syncedContacts = await whatsappService.syncContacts(instanceName, true);
      console.log(`✅ Sincronização com force refresh: ${syncedContacts.length} contatos`);
    } catch (error) {
      console.log(`❌ Erro na sincronização com force refresh: ${error.message}`);
    }
    console.log('');
    
    // 7. Verificar status final do cache
    console.log('7️⃣ Status final do cache...');
    const finalCacheStatus = evolutionApiService.getCacheStatus(instanceName);
    console.log('Status final:', finalCacheStatus);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar o teste
testCacheSystem(); 