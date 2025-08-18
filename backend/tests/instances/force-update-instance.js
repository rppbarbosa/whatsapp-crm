require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceUpdateInstance() {
  console.log('🔧 Forçando atualização da instância test3...\n');

  try {
    // 1. Verificar instância atual
    console.log('1️⃣ Verificando instância atual...');
    const { data: currentInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', 'test3')
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar instância:', fetchError);
      return;
    }

    console.log('📊 Instância atual:', {
      id: currentInstance.id,
      instance_name: currentInstance.instance_name,
      status: currentInstance.status,
      phone_number: currentInstance.phone_number,
      created_at: currentInstance.created_at,
      updated_at: currentInstance.updated_at
    });

    // 2. Forçar atualização para connected
    console.log('\n2️⃣ Forçando atualização para connected...');
    const { data: updatedInstance, error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({ 
        status: 'connected',
        phone_number: '5511999999999', // Número de exemplo
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', 'test3')
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar instância:', updateError);
      return;
    }

    console.log('✅ Instância atualizada:', {
      id: updatedInstance.id,
      instance_name: updatedInstance.instance_name,
      status: updatedInstance.status,
      phone_number: updatedInstance.phone_number,
      updated_at: updatedInstance.updated_at
    });

    // 3. Verificar todas as instâncias
    console.log('\n3️⃣ Verificando todas as instâncias...');
    const { data: allInstances, error: allError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar todas as instâncias:', allError);
      return;
    }

    console.log('📊 Todas as instâncias:');
    allInstances.forEach(instance => {
      console.log(`  - ${instance.instance_name}: ${instance.status} (${instance.phone_number || 'sem número'})`);
    });

    console.log('\n🎉 Atualização forçada concluída!');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  }
}

// Executar atualização
forceUpdateInstance(); 