const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando schema nativo do WhatsApp...');

// Ler o arquivo SQL
const sqlFilePath = path.join(__dirname, 'sql', 'whatsapp_native_schema.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ Arquivo SQL não encontrado:', sqlFilePath);
  console.log('📝 Por favor, execute o seguinte SQL no Supabase:');
  console.log('');
  
  // Mostrar instruções
  console.log('1. Acesse o Supabase Dashboard');
  console.log('2. Vá para SQL Editor');
  console.log('3. Execute o conteúdo do arquivo: backend/sql/whatsapp_native_schema.sql');
  console.log('');
  console.log('Ou copie e cole o conteúdo do arquivo SQL diretamente no editor.');
  
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('✅ Schema SQL carregado com sucesso!');
console.log('');
console.log('📋 Para aplicar o schema nativo do WhatsApp:');
console.log('');
console.log('1. Acesse o Supabase Dashboard');
console.log('2. Vá para SQL Editor');
console.log('3. Cole o seguinte SQL e execute:');
console.log('');
console.log('='.repeat(80));
console.log(sqlContent);
console.log('='.repeat(80));
console.log('');
console.log('🎯 Benefícios do novo schema:');
console.log('✅ IDs nativos do WhatsApp (sem conversões)');
console.log('✅ Performance otimizada com índices');
console.log('✅ Views para consultas complexas');
console.log('✅ Funções para operações comuns');
console.log('✅ Cache inteligente');
console.log('✅ Escalabilidade garantida');
console.log('');
console.log('🔄 Após executar o SQL, você pode:');
console.log('1. Testar os novos endpoints: /api/whatsapp-native/*');
console.log('2. Sincronizar dados: POST /api/whatsapp-native/instances/{instance}/sync-contacts');
console.log('3. Obter conversas: GET /api/whatsapp-native/instances/{instance}/conversations');
console.log('4. Ver estatísticas: GET /api/whatsapp-native/instances/{instance}/stats'); 