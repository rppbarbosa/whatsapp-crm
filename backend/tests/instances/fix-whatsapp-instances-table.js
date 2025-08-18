require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixWhatsAppInstancesTable() {
  console.log('🔧 Corrigindo estrutura da tabela whatsapp_instances...\n');

  try {
    // 1. Verificar estrutura atual
    console.log('1️⃣ Verificando estrutura atual da tabela...');
    const { data: currentStructure, error: structureError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError);
      return;
    }

    console.log('✅ Estrutura atual:', Object.keys(currentStructure[0] || {}));

    // 2. Adicionar colunas faltantes se necessário
    console.log('\n2️⃣ Verificando e adicionando colunas faltantes...');
    
    // Verificar se a coluna status existe
    const { data: statusCheck, error: statusError } = await supabase
      .rpc('column_exists', { 
        table_name: 'whatsapp_instances', 
        column_name: 'status' 
      });

    if (statusError || !statusCheck) {
      console.log('➕ Adicionando coluna status...');
      const { error: addStatusError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'whatsapp_instances',
        column_name: 'status',
        column_type: 'text DEFAULT \'connecting\''
      });

      if (addStatusError) {
        console.error('❌ Erro ao adicionar coluna status:', addStatusError);
      } else {
        console.log('✅ Coluna status adicionada');
      }
    } else {
      console.log('✅ Coluna status já existe');
    }

    // Verificar se a coluna instance_name existe
    const { data: nameCheck, error: nameError } = await supabase
      .rpc('column_exists', { 
        table_name: 'whatsapp_instances', 
        column_name: 'instance_name' 
      });

    if (nameError || !nameCheck) {
      console.log('➕ Adicionando coluna instance_name...');
      const { error: addNameError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'whatsapp_instances',
        column_name: 'instance_name',
        column_type: 'text'
      });

      if (addNameError) {
        console.error('❌ Erro ao adicionar coluna instance_name:', addNameError);
      } else {
        console.log('✅ Coluna instance_name adicionada');
      }
    } else {
      console.log('✅ Coluna instance_name já existe');
    }

    // 3. Atualizar registros existentes
    console.log('\n3️⃣ Atualizando registros existentes...');
    const { data: existingRecords, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*');

    if (fetchError) {
      console.error('❌ Erro ao buscar registros:', fetchError);
      return;
    }

    console.log(`📊 Encontrados ${existingRecords.length} registros`);

    for (const record of existingRecords) {
      console.log(`🔄 Atualizando registro ${record.id}...`);
      
      const updates = {};
      
      // Se não tem instance_name, usar id como nome temporário
      if (!record.instance_name) {
        updates.instance_name = `instance-${record.id.slice(0, 8)}`;
      }
      
      // Se não tem status, definir como 'connecting'
      if (!record.status) {
        updates.status = 'connecting';
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update(updates)
          .eq('id', record.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar registro ${record.id}:`, updateError);
        } else {
          console.log(`✅ Registro ${record.id} atualizado`);
        }
      }
    }

    // 4. Verificar estrutura final
    console.log('\n4️⃣ Verificando estrutura final...');
    const { data: finalStructure, error: finalError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);

    if (finalError) {
      console.error('❌ Erro ao verificar estrutura final:', finalError);
      return;
    }

    console.log('✅ Estrutura final:', Object.keys(finalStructure[0] || {}));
    console.log('\n🎉 Correção da tabela whatsapp_instances concluída!');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Executar correção
fixWhatsAppInstancesTable(); 