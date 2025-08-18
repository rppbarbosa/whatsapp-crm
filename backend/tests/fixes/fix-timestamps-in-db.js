// ===== CORRIGIR TIMESTAMPS NO BANCO DE DADOS =====
// Execute este script para corrigir os timestamps das mensagens existentes

require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');

async function fixTimestampsInDatabase() {
  try {
    console.log('🔧 Corrigindo timestamps no banco de dados...\n');
    
    const instanceName = 'test11';
    
    // 1. Verificar timestamps atuais
    console.log('1️⃣ Verificando timestamps atuais...');
    const { data: currentMessages, error: currentError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('id, timestamp, body, from_id, to_id')
      .eq('instance_name', instanceName)
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (currentError) {
      console.error('❌ Erro ao buscar mensagens:', currentError);
      return;
    }
    
    console.log(`📊 ${currentMessages.length} mensagens encontradas`);
    
    if (currentMessages.length > 0) {
      console.log('\nTimestamps atuais:');
      currentMessages.forEach((msg, index) => {
        const date = new Date(msg.timestamp);
        console.log(`   ${index + 1}. ID: ${msg.id}`);
        console.log(`      Timestamp: ${msg.timestamp}`);
        console.log(`      Data: ${date.toISOString()}`);
        console.log(`      Body: ${msg.body?.substring(0, 50)}...`);
        console.log('');
      });
    }
    
    // 2. Identificar mensagens com timestamps incorretos
    console.log('2️⃣ Identificando mensagens com timestamps incorretos...');
    const { data: incorrectMessages, error: incorrectError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('id, timestamp')
      .eq('instance_name', instanceName)
      .lt('timestamp', 1000000000000); // Menor que 1 bilhão (está em segundos)
    
    if (incorrectError) {
      console.error('❌ Erro ao buscar mensagens incorretas:', incorrectError);
      return;
    }
    
    console.log(`📊 ${incorrectMessages.length} mensagens com timestamps incorretos encontradas`);
    
    if (incorrectMessages.length === 0) {
      console.log('✅ Todos os timestamps já estão corretos!');
      return;
    }
    
    // 3. Corrigir timestamps (multiplicar por 1000)
    console.log('3️⃣ Corrigindo timestamps...');
    
    for (const msg of incorrectMessages) {
      const correctedTimestamp = msg.timestamp * 1000;
      
      const { error: updateError } = await supabaseAdmin
        .from('whatsapp_messages')
        .update({ 
          timestamp: correctedTimestamp,
          updated_at: new Date().toISOString()
        })
        .eq('id', msg.id);
      
      if (updateError) {
        console.error(`❌ Erro ao corrigir mensagem ${msg.id}:`, updateError);
      } else {
        console.log(`✅ Corrigido: ${msg.id} (${msg.timestamp} → ${correctedTimestamp})`);
      }
    }
    
    // 4. Verificar resultado
    console.log('\n4️⃣ Verificando resultado...');
    const { data: correctedMessages, error: correctedError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('id, timestamp, body, from_id, to_id')
      .eq('instance_name', instanceName)
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (correctedError) {
      console.error('❌ Erro ao verificar mensagens corrigidas:', correctedError);
      return;
    }
    
    console.log('\nTimestamps após correção:');
    correctedMessages.forEach((msg, index) => {
      const date = new Date(msg.timestamp);
      const now = new Date();
      const diffMinutes = Math.abs(now - date) / 1000 / 60;
      
      console.log(`   ${index + 1}. ID: ${msg.id}`);
      console.log(`      Timestamp: ${msg.timestamp}`);
      console.log(`      Data: ${date.toISOString()}`);
      console.log(`      Diferença do agora: ${diffMinutes.toFixed(1)} minutos`);
      console.log(`      Body: ${msg.body?.substring(0, 50)}...`);
      console.log('');
    });
    
    // 5. Estatísticas finais
    console.log('5️⃣ Estatísticas finais...');
    const { count: totalMessages } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('instance_name', instanceName);
    
    const { count: correctTimestamps } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('instance_name', instanceName)
      .gte('timestamp', 1000000000000);
    
    console.log(`📊 Total de mensagens: ${totalMessages}`);
    console.log(`📊 Timestamps corretos: ${correctTimestamps}`);
    console.log(`📊 Timestamps incorretos: ${totalMessages - correctTimestamps}`);
    
    console.log('\n✅ Correção de timestamps concluída!');
    
  } catch (error) {
    console.error('❌ Erro na correção de timestamps:', error);
  }
}

// Executar a correção
fixTimestampsInDatabase(); 