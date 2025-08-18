// ===== MELHORAR IDENTIFICAÇÃO DE CONTATOS VS GRUPOS =====
// Baseado nos padrões @c.us (contatos) e @g.us (grupos)

require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');

// Função melhorada para identificar tipo de contato
function getContactType(phone) {
  if (!phone) return 'unknown';
  
  if (phone.includes('@g.us')) return 'group';
  if (phone.includes('@c.us')) return 'contact';
  if (phone.includes('@broadcast')) return 'broadcast';
  if (phone.includes('@s.whatsapp.net')) return 'contact';
  
  // Se não tem @, verificar pelo tamanho (números longos são grupos)
  if (phone.length > 15) return 'group';
  
  return 'contact';
}

// Função para extrair número limpo
function extractCleanPhone(phone) {
  if (!phone) return null;
  
  // Grupos não têm número limpo
  if (phone.includes('@g.us') || phone.includes('@broadcast')) return null;
  
  // Contatos: remover @c.us ou @s.whatsapp.net
  return phone.replace('@c.us', '').replace('@s.whatsapp.net', '');
}

async function improveContactGroupIdentification() {
  try {
    console.log('🔍 Melhorando identificação de contatos vs grupos...\n');
    
    const instanceName = 'test11';
    
    // 1. Analisar padrões atuais
    console.log('1️⃣ Analisando padrões atuais...');
    const { data: contacts, error } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('*')
      .eq('instance_name', instanceName)
      .limit(20);

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log(`📊 Analisando ${contacts.length} contatos...\n`);
    
    contacts.forEach((contact, index) => {
      const currentType = contact.is_group ? 'group' : 'contact';
      const newType = getContactType(contact.phone);
      const cleanPhone = extractCleanPhone(contact.phone);
      
      console.log(`   Contato ${index + 1}:`);
      console.log(`      Phone: ${contact.phone}`);
      console.log(`      Current Type: ${currentType}`);
      console.log(`      New Type: ${newType}`);
      console.log(`      Clean Phone: ${cleanPhone}`);
      console.log(`      Name: ${contact.name}`);
      console.log(`      Match: ${currentType === newType ? '✅' : '❌'}`);
      console.log('');
    });

    // 2. Identificar contatos que precisam ser corrigidos
    console.log('2️⃣ Identificando contatos para correção...');
    const { data: allContacts, error: allError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('*')
      .eq('instance_name', instanceName);

    if (allError) {
      console.error('❌ Erro:', allError);
      return;
    }

    const needsCorrection = allContacts.filter(contact => {
      const currentType = contact.is_group ? 'group' : 'contact';
      const newType = getContactType(contact.phone);
      return currentType !== newType;
    });

    console.log(`📊 Contatos que precisam correção: ${needsCorrection.length}`);
    
    if (needsCorrection.length > 0) {
      console.log('\nExemplos de correções necessárias:');
      needsCorrection.slice(0, 5).forEach((contact, index) => {
        const currentType = contact.is_group ? 'group' : 'contact';
        const newType = getContactType(contact.phone);
        
        console.log(`   ${index + 1}. ${contact.phone}`);
        console.log(`      Atual: ${currentType} → Novo: ${newType}`);
        console.log(`      Nome: ${contact.name}`);
      });
    }

    // 3. Gerar SQL para correção
    console.log('\n3️⃣ SQL para correção automática:');
    console.log('-- ===== CORREÇÃO AUTOMÁTICA DE TIPOS =====');
    console.log('-- Execute este SQL para corrigir automaticamente');
    console.log('');
    
    needsCorrection.forEach(contact => {
      const newType = getContactType(contact.phone);
      const isGroup = newType === 'group';
      const cleanPhone = extractCleanPhone(contact.phone);
      
      console.log(`-- Corrigindo: ${contact.phone} (${contact.is_group ? 'group' : 'contact'} → ${newType})`);
      console.log(`UPDATE whatsapp_contacts SET`);
      console.log(`  is_group = ${isGroup},`);
      console.log(`  id_type = '${newType}',`);
      if (cleanPhone && newType === 'contact') {
        console.log(`  id = '${cleanPhone}',`);
      }
      console.log(`  updated_at = NOW()`);
      console.log(`WHERE id = '${contact.id}' AND instance_name = '${instanceName}';`);
      console.log('');
    });

    // 4. Estatísticas finais
    console.log('4️⃣ Estatísticas finais:');
    const stats = {
      total: allContacts.length,
      contacts: allContacts.filter(c => getContactType(c.phone) === 'contact').length,
      groups: allContacts.filter(c => getContactType(c.phone) === 'group').length,
      broadcast: allContacts.filter(c => getContactType(c.phone) === 'broadcast').length,
      unknown: allContacts.filter(c => getContactType(c.phone) === 'unknown').length
    };
    
    console.log(`   Total: ${stats.total}`);
    console.log(`   Contatos: ${stats.contacts}`);
    console.log(`   Grupos: ${stats.groups}`);
    console.log(`   Broadcast: ${stats.broadcast}`);
    console.log(`   Unknown: ${stats.unknown}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar a análise
improveContactGroupIdentification(); 