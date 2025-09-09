const axios = require('axios');

// Configuração
const BASE_URL = 'http://localhost:3001';
const API_KEY = process.env.EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';

// Headers padrão
const headers = {
  'apikey': API_KEY,
  'Content-Type': 'application/json'
};

// Teste 1: Verificar se as rotas otimizadas estão funcionando
async function testOptimizedRoutes() {
  console.log('🧪 Testando rotas otimizadas...\n');

  try {
    // Teste: Obter conversas
    console.log('1. Testando GET /api/whatsapp-optimized/conversations');
    const conversationsResponse = await axios.get(`${BASE_URL}/api/whatsapp-optimized/conversations`, { headers });
    
    if (conversationsResponse.data.success) {
      console.log(`✅ Conversas carregadas: ${conversationsResponse.data.data.length}`);
    } else {
      console.log('❌ Erro ao carregar conversas:', conversationsResponse.data.error);
    }

    // Teste: Obter estatísticas
    console.log('\n2. Testando GET /api/whatsapp-optimized/stats');
    const statsResponse = await axios.get(`${BASE_URL}/api/whatsapp-optimized/stats`, { headers });
    
    if (statsResponse.data.success) {
      console.log('✅ Estatísticas obtidas:');
      console.log(`   - WebSocket clients: ${statsResponse.data.data.websocket.totalClients}`);
      console.log(`   - WebSocket rooms: ${statsResponse.data.data.websocket.totalRooms}`);
      console.log(`   - Cache ativo: ${statsResponse.data.data.persistence.activeCacheSize}`);
    } else {
      console.log('❌ Erro ao obter estatísticas:', statsResponse.data.error);
    }

    // Teste: Informações do WebSocket
    console.log('\n3. Testando GET /api/whatsapp-optimized/websocket/info');
    const wsInfoResponse = await axios.get(`${BASE_URL}/api/whatsapp-optimized/websocket/info`, { headers });
    
    if (wsInfoResponse.data.success) {
      console.log('✅ WebSocket info obtido:');
      console.log(`   - URL: ${wsInfoResponse.data.data.websocketUrl}`);
      console.log(`   - Clientes conectados: ${wsInfoResponse.data.data.stats.totalClients}`);
    } else {
      console.log('❌ Erro ao obter info do WebSocket:', wsInfoResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Teste 2: Simular carga de requisições
async function testLoadSimulation() {
  console.log('\n🚀 Simulando carga de requisições...\n');

  const startTime = Date.now();
  const requests = [];
  const numRequests = 50;

  // Simular múltiplas requisições simultâneas
  for (let i = 0; i < numRequests; i++) {
    requests.push(
      axios.get(`${BASE_URL}/api/whatsapp-optimized/conversations`, { headers })
        .catch(err => ({ error: err.message }))
    );
  }

  try {
    const results = await Promise.all(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    console.log(`📊 Resultados da simulação de carga:`);
    console.log(`   - Requisições: ${numRequests}`);
    console.log(`   - Sucessos: ${successful}`);
    console.log(`   - Falhas: ${failed}`);
    console.log(`   - Tempo total: ${duration}ms`);
    console.log(`   - Tempo médio: ${(duration / numRequests).toFixed(2)}ms`);
    console.log(`   - Requisições/segundo: ${(numRequests / (duration / 1000)).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Erro na simulação de carga:', error.message);
  }
}

// Teste 3: Testar WebSocket (simulação básica)
async function testWebSocketConnection() {
  console.log('\n🔌 Testando conexão WebSocket...\n');

  try {
    const WebSocket = require('ws');
    const wsUrl = 'ws://localhost:3001/ws?userId=test-user';
    
    console.log(`Conectando em: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket conectado com sucesso');
      
      // Enviar ping
      ws.send(JSON.stringify({ type: 'ping' }));
      
      // Entrar em uma sala de teste
      ws.send(JSON.stringify({ 
        type: 'join_room', 
        roomId: 'test-room' 
      }));
      
      // Fechar após 3 segundos
      setTimeout(() => {
        ws.close();
        console.log('🔌 WebSocket fechado');
      }, 3000);
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log(`📨 Mensagem recebida: ${message.type}`);
    });
    
    ws.on('error', (error) => {
      console.error('❌ Erro no WebSocket:', error.message);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket desconectado');
    });

  } catch (error) {
    console.error('❌ Erro ao testar WebSocket:', error.message);
  }
}

// Teste 4: Comparar performance com rotas antigas
async function comparePerformance() {
  console.log('\n⚡ Comparando performance: Antiga vs Nova...\n');

  const testRequests = 10;
  
  try {
    // Teste rota antiga
    console.log('Testando rota antiga...');
    const oldStart = Date.now();
    const oldRequests = [];
    
    for (let i = 0; i < testRequests; i++) {
      oldRequests.push(
        axios.get(`${BASE_URL}/api/whatsapp/chats`, { headers })
          .catch(err => ({ error: err.message }))
      );
    }
    
    await Promise.all(oldRequests);
    const oldDuration = Date.now() - oldStart;
    
    // Teste rota nova
    console.log('Testando rota nova...');
    const newStart = Date.now();
    const newRequests = [];
    
    for (let i = 0; i < testRequests; i++) {
      newRequests.push(
        axios.get(`${BASE_URL}/api/whatsapp-optimized/conversations`, { headers })
          .catch(err => ({ error: err.message }))
      );
    }
    
    await Promise.all(newRequests);
    const newDuration = Date.now() - newStart;
    
    console.log(`📊 Comparação de performance:`);
    console.log(`   - Rota antiga: ${oldDuration}ms (${(oldDuration/testRequests).toFixed(2)}ms/req)`);
    console.log(`   - Rota nova: ${newDuration}ms (${(newDuration/testRequests).toFixed(2)}ms/req)`);
    console.log(`   - Melhoria: ${((oldDuration - newDuration) / oldDuration * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Erro na comparação de performance:', error.message);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🧪 Iniciando testes da arquitetura otimizada...\n');
  console.log('=' .repeat(60));
  
  await testOptimizedRoutes();
  await testLoadSimulation();
  await testWebSocketConnection();
  await comparePerformance();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Testes concluídos!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Verificar logs do servidor para detalhes');
  console.log('2. Testar no frontend com o componente WhatsAppOptimized');
  console.log('3. Monitorar métricas em produção');
  console.log('4. Migrar usuários gradualmente');
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testOptimizedRoutes,
  testLoadSimulation,
  testWebSocketConnection,
  comparePerformance,
  runAllTests
};
