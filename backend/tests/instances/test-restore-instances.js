// ===== TESTAR RESTAURAÇÃO DE INSTÂNCIAS =====

require('dotenv').config();
const evolutionApiService = require('./src/services/evolutionApi');

async function testRestoreInstances() {
  try {
    console.log('🧪 Testando restauração de instâncias...\n');
    
    // 1. Verificar instâncias antes da restauração
    console.log('1️⃣ Instâncias antes da restauração:');
    const instancesBefore = evolutionApiService.getInstances();
    console.log(`📊 ${instancesBefore.length} instâncias na memória`);
    
    instancesBefore.forEach((inst, index) => {
      console.log(`   ${index + 1}. ${inst.instanceName}: ${inst.status}`);
    });
    
    // 2. Executar restauração
    console.log('\n2️⃣ Executando restauração...');
    try {
      await evolutionApiService.restoreActiveInstances();
      console.log('✅ Restauração concluída');
    } catch (restoreError) {
      console.error('❌ Erro na restauração:', restoreError.message);
      console.error('Stack:', restoreError.stack);
    }
    
    // 3. Verificar instâncias após a restauração
    console.log('\n3️⃣ Instâncias após a restauração:');
    const instancesAfter = evolutionApiService.getInstances();
    console.log(`📊 ${instancesAfter.length} instâncias na memória`);
    
    instancesAfter.forEach((inst, index) => {
      console.log(`   ${index + 1}. ${inst.instanceName}: ${inst.status}`);
    });
    
    // 4. Comparar resultados
    console.log('\n4️⃣ Comparação:');
    const beforeNames = instancesBefore.map(inst => inst.instanceName);
    const afterNames = instancesAfter.map(inst => inst.instanceName);
    
    console.log('Antes:', beforeNames);
    console.log('Depois:', afterNames);
    
    const newInstances = afterNames.filter(name => !beforeNames.includes(name));
    const removedInstances = beforeNames.filter(name => !afterNames.includes(name));
    
    if (newInstances.length > 0) {
      console.log('✅ Novas instâncias restauradas:', newInstances);
    }
    
    if (removedInstances.length > 0) {
      console.log('⚠️ Instâncias removidas:', removedInstances);
    }
    
    if (newInstances.length === 0 && removedInstances.length === 0) {
      console.log('ℹ️ Nenhuma mudança nas instâncias');
    }
    
    // 5. Verificar status das instâncias restauradas
    console.log('\n5️⃣ Status das instâncias restauradas:');
    instancesAfter.forEach(inst => {
      console.log(`   📱 ${inst.instanceName}:`);
      console.log(`      Status: ${inst.status}`);
      console.log(`      Telefone: ${inst.phone_number || 'N/A'}`);
      console.log(`      QR Code: ${inst.qrcode ? 'Disponível' : 'Não disponível'}`);
    });
    
    // 6. Sugestões
    console.log('\n6️⃣ Sugestões:');
    if (instancesAfter.length === 0) {
      console.log('   📝 Nenhuma instância restaurada');
      console.log('   💡 Verifique se há instâncias ativas no banco de dados');
      console.log('   🔧 Verifique os logs de erro da restauração');
    } else {
      console.log('   ✅ Instâncias restauradas com sucesso');
      console.log('   📱 Pronto para uso no frontend');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testRestoreInstances(); 