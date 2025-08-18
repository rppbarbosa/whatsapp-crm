// ===== ANÁLISE DOS DADOS BRUTOS DA EVOLUTION API =====
// Execute este script para entender como a Evolution API estrutura os dados

require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');
const evolutionApiService = require('./src/services/evolutionApi');

async function analyzeEvolutionApiData() {
  try {
    console.log('🔍 Analisando dados brutos da Evolution API...\n');
    
    // Verificar instâncias ativas
    const instances = evolutionApiService.getInstances();
    console.log(`📱 Instâncias ativas: ${instances.length}`);
    
    if (instances.length === 0) {
      console.log('❌ Nenhuma instância ativa encontrada');
      return;
    }
    
    // Usar a primeira instância disponível ou uma específica
    const instanceName = instances.length > 0 ? instances[0].instance.instanceName : 'test11';
    console.log(`🔍 Usando instância: ${instanceName}\n`);
    
    // Obter contatos da Evolution API
    const contacts = await evolutionApiService.getContacts(instanceName);
    console.log(`📋 Total de contatos obtidos: ${contacts.length}\n`);
    
    // Analisar estrutura dos primeiros 10 contatos
    console.log('🔍 ESTRUTURA DOS DADOS BRUTOS DA EVOLUTION API:');
    console.log('=' .repeat(80));
    
    contacts.slice(0, 10).forEach((contact, index) => {
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
      
      // Analisar estrutura do ID
      if (contact.id) {
        console.log(`   🔍 Análise do ID:`);
        console.log(`      Tipo: ${typeof contact.id}`);
        console.log(`      Contém @: ${contact.id.includes('@')}`);
        console.log(`      Contém .: ${contact.id.includes('.')}`);
        console.log(`      Tamanho: ${contact.id.length}`);
        
        if (contact.id.includes('@')) {
          const parts = contact.id.split('@');
          console.log(`      Parte antes do @: ${parts[0]}`);
          console.log(`      Parte depois do @: ${parts[1]}`);
        }
      }
      
      // Analisar estrutura do Phone
      if (contact.phone) {
        console.log(`   🔍 Análise do Phone:`);
        console.log(`      Tipo: ${typeof contact.phone}`);
        console.log(`      Contém @: ${contact.phone.includes('@')}`);
        console.log(`      Contém .: ${contact.phone.includes('.')}`);
        console.log(`      Tamanho: ${contact.phone.length}`);
        console.log(`      Apenas números: ${/^\d+$/.test(contact.phone)}`);
      }
    });
    
    // Analisar padrões nos IDs
    console.log('\n🔍 ANÁLISE DE PADRÕES NOS IDs:');
    console.log('=' .repeat(80));
    
    const idPatterns = contacts.reduce((acc, contact) => {
      if (contact.id) {
        const pattern = contact.id.includes('@') ? 
          contact.id.split('@')[1] : 'sem_sufixo';
        acc[pattern] = (acc[pattern] || 0) + 1;
      }
      return acc;
    }, {});
    
    console.log('Padrões encontrados nos IDs:');
    Object.entries(idPatterns).forEach(([pattern, count]) => {
      console.log(`   ${pattern}: ${count} contatos`);
    });
    
    // Analisar padrões nos Phones
    console.log('\n🔍 ANÁLISE DE PADRÕES NOS PHONES:');
    console.log('=' .repeat(80));
    
    const phonePatterns = contacts.reduce((acc, contact) => {
      if (contact.phone) {
        const pattern = contact.phone.includes('@') ? 
          contact.phone.split('@')[1] : 'sem_sufixo';
        acc[pattern] = (acc[pattern] || 0) + 1;
      }
      return acc;
    }, {});
    
    console.log('Padrões encontrados nos Phones:');
    Object.entries(phonePatterns).forEach(([pattern, count]) => {
      console.log(`   ${pattern}: ${count} contatos`);
    });
    
    // Verificar grupos
    console.log('\n🔍 ANÁLISE DE GRUPOS:');
    console.log('=' .repeat(80));
    
    const groups = contacts.filter(c => c.isGroup);
    console.log(`Total de grupos: ${groups.length}`);
    
    if (groups.length > 0) {
      console.log('\nExemplos de grupos:');
      groups.slice(0, 5).forEach((group, index) => {
        console.log(`   Grupo ${index + 1}:`);
        console.log(`      ID: ${group.id}`);
        console.log(`      Phone: ${group.phone}`);
        console.log(`      Name: ${group.name}`);
        console.log(`      IsGroup: ${group.isGroup}`);
      });
    }
    
    // Verificar contatos com números longos
    console.log('\n🔍 CONTATOS COM NÚMEROS LONGOS:');
    console.log('=' .repeat(80));
    
    const longNumbers = contacts.filter(c => c.phone && c.phone.length > 15);
    console.log(`Contatos com números > 15 dígitos: ${longNumbers.length}`);
    
    if (longNumbers.length > 0) {
      console.log('\nExemplos de números longos:');
      longNumbers.slice(0, 5).forEach((contact, index) => {
        console.log(`   Contato ${index + 1}:`);
        console.log(`      ID: ${contact.id}`);
        console.log(`      Phone: ${contact.phone}`);
        console.log(`      Name: ${contact.name}`);
        console.log(`      IsGroup: ${contact.isGroup}`);
        console.log(`      Tamanho: ${contact.phone.length}`);
      });
    }
    
    // Verificar contatos com @ no número
    console.log('\n🔍 CONTATOS COM @ NO NÚMERO:');
    console.log('=' .repeat(80));
    
    const withAtSymbol = contacts.filter(c => c.phone && c.phone.includes('@'));
    console.log(`Contatos com @ no número: ${withAtSymbol.length}`);
    
    if (withAtSymbol.length > 0) {
      console.log('\nExemplos de contatos com @:');
      withAtSymbol.slice(0, 5).forEach((contact, index) => {
        console.log(`   Contato ${index + 1}:`);
        console.log(`      ID: ${contact.id}`);
        console.log(`      Phone: ${contact.phone}`);
        console.log(`      Name: ${contact.name}`);
        console.log(`      IsGroup: ${contact.isGroup}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

// Executar a análise
analyzeEvolutionApiData(); 