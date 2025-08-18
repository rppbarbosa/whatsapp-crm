require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
  },
});

async function debugInstanceIssue() {
  console.log('🔍 Diagnosticando problema das instâncias...\n');

  try {
    // 1. Verificar se o backend está rodando
    console.log('1️⃣ Verificando se o backend está rodando...');
    try {
      const healthResponse = await api.get('/api/whatsapp/health');
      console.log('✅ Backend está rodando:', healthResponse.data);
    } catch (error) {
      console.error('❌ Backend não está rodando:', error.message);
      return;
    }

    // 2. Listar instâncias
    console.log('\n2️⃣ Listando instâncias...');
    const instancesResponse = await api.get('/api/whatsapp/instances');
    console.log('📊 Instâncias encontradas:', instancesResponse.data?.length || 0);
    
    instancesResponse.data.forEach((instance, index) => {
      console.log(`  ${index + 1}. ${instance.instance.instanceName}: ${instance.instance.status}`);
      console.log(`     Persistida: ${instance.persisted || false}`);
      console.log(`     QR Code: ${instance.instance.qrcode ? 'Sim' : 'Não'}`);
      console.log(`     Logs: ${instance.instance.logs?.length || 0}`);
    });

    // 3. Testar conexão da instância 'teste'
    console.log('\n3️⃣ Testando conexão da instância "teste"...');
    try {
      console.log('   Enviando requisição GET /api/whatsapp/instances/teste/connect...');
      const connectResponse = await api.get('/api/whatsapp/instances/teste/connect');
      console.log('✅ Resposta da conexão:', connectResponse.data);
      
      if (connectResponse.data.qrcode) {
        console.log('📱 QR Code gerado com sucesso!');
      } else if (connectResponse.data.message) {
        console.log('📱 Mensagem:', connectResponse.data.message);
      }
    } catch (error) {
      console.error('❌ Erro ao conectar instância "teste":');
      console.error('   Status:', error.response?.status);
      console.error('   Mensagem:', error.response?.data?.message || error.message);
      console.error('   Erro:', error.response?.data?.error || 'Desconhecido');
    }

    // 4. Verificar logs do backend (se possível)
    console.log('\n4️⃣ Verificando logs do backend...');
    console.log('   (Verifique o terminal onde o backend está rodando para ver os logs)');

    // 5. Sugestões de correção
    console.log('\n5️⃣ Sugestões de correção:');
    console.log('   - Verifique se o backend está rodando na porta 3001');
    console.log('   - Verifique os logs do backend para erros');
    console.log('   - Verifique se as variáveis de ambiente estão corretas');
    console.log('   - Tente reiniciar o backend');

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
  }
}

// Executar diagnóstico
debugInstanceIssue(); 