// ===== DEBUG DOS DADOS DE CONTATOS DA EVOLUTION API =====
// Execute este script para entender a estrutura dos dados

require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');
const evolutionApiService = require('./src/services/evolutionApi');

async function debugContactData() {
  try {
    console.log('🔍 Debugando dados de contatos da Evolution API...\n');
    
    // Verificar instâncias ativas
    const instances = evolutionApiService.getInstances();
    console.log(`📱 Instâncias ativas: ${instances.length}`);
    
    if (instances.length === 0) {
      console.log('❌ Nenhuma instância ativa encontrada');
      return;
    }
    
    // Usar instância específica que sabemos que existe
    const instanceName = 'test11';
    console.log(`🔍 Usando instância: ${instanceName}\n`);
    
    // Obter contatos da Evolution API
    const contacts = await evolutionApiService.getContacts(instanceName);
    console.log(`📋 Total de contatos obtidos: ${contacts.length}\n`);
    
    // Analisar os primeiros 5 contatos em detalhes
    console.log('🔍 ANÁLISE DETALHADA DOS PRIMEIROS 5 CONTATOS:');
    console.log('=' .repeat(80));
    
    contacts.slice(0, 5).forEach((contact, index) => {
      console.log(`\n📞 CONTATO ${index + 1}:`);
      console.log(`   ID: ${contact.id}`);
      console.log(`   Phone: ${contact.phone}`);
      console.log(`   Name: ${contact.name}`);
      console.log(`   PushName: ${contact.pushName}`);
      console.log(`   IsGroup: ${contact.isGroup}`);
      console.log(`   IsWAContact: ${contact.isWAContact}`);
      console.log(`   ProfilePicUrl: ${contact.profilePicUrl ? 'Sim' : 'Não'}`);
      console.log(`   Status: ${contact.status}`);
      console.log(`   LastSeen: ${contact.lastSeen}`);
      
      // Verificar se é um ID serializado
      if (contact.id && contact.id.includes('@')) {
        console.log(`   ⚠️  ID parece ser serializado (contém @)`);
      }
      
      if (contact.phone && contact.phone.includes('@')) {
        console.log(`   ⚠️  Phone parece ser serializado (contém @)`);
      }
      
      // Verificar tamanho
      if (contact.phone && contact.phone.length > 20) {
        console.log(`   ⚠️  Phone muito longo: ${contact.phone.length} caracteres`);
      }
    });
    
    // Verificar contatos com números longos
    console.log('\n🔍 CONTATOS COM NÚMEROS LONGOS (>20 caracteres):');
    console.log('=' .repeat(80));
    
    const longPhones = contacts.filter(c => c.phone && c.phone.length > 20);
    console.log(`📊 Encontrados ${longPhones.length} contatos com números longos\n`);
    
    longPhones.slice(0, 3).forEach((contact, index) => {
      console.log(`📞 CONTATO LONGO ${index + 1}:`);
      console.log(`   ID: ${contact.id}`);
      console.log(`   Phone: ${contact.phone}`);
      console.log(`   Phone Length: ${contact.phone.length}`);
      console.log(`   Name: ${contact.name}`);
      console.log(`   IsGroup: ${contact.isGroup}`);
      console.log(`   IsWAContact: ${contact.isWAContact}`);
      console.log('');
    });
    
    // Verificar grupos
    console.log('🔍 GRUPOS:');
    console.log('=' .repeat(80));
    
    const groups = contacts.filter(c => c.isGroup);
    console.log(`📊 Encontrados ${groups.length} grupos\n`);
    
    groups.slice(0, 3).forEach((group, index) => {
      console.log(`👥 GRUPO ${index + 1}:`);
      console.log(`   ID: ${group.id}`);
      console.log(`   Phone: ${group.phone}`);
      console.log(`   Name: ${group.name}`);
      console.log(`   Phone Length: ${group.phone.length}`);
      console.log('');
    });
    
    // Verificar contatos com fotos
    console.log('🔍 CONTATOS COM FOTOS:');
    console.log('=' .repeat(80));
    
    const withPhotos = contacts.filter(c => c.profilePicUrl);
    console.log(`📊 Encontrados ${withPhotos.length} contatos com fotos\n`);
    
    withPhotos.slice(0, 3).forEach((contact, index) => {
      console.log(`📸 CONTATO COM FOTO ${index + 1}:`);
      console.log(`   ID: ${contact.id}`);
      console.log(`   Phone: ${contact.phone}`);
      console.log(`   Name: ${contact.name}`);
      console.log(`   Photo URL: ${contact.profilePicUrl.substring(0, 100)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar o debug
debugContactData(); 