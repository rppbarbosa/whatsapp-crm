#!/usr/bin/env node

const { testSupabaseConnection } = require('./test-supabase-connection');
const { testServerBasic } = require('./test-server-basic');
const { runAllTests } = require('./test-user-project-apis');

async function runAllBackendTests() {
  console.log('🧪 EXECUTANDO TODOS OS TESTES DO BACKEND');
  console.log('='.repeat(60));
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('='.repeat(60));

  const results = {
    supabase: false,
    server: false,
    apis: false
  };

  try {
    // Teste 1: Conexão com Supabase
    console.log('\n🗄️ TESTE 1: CONEXÃO COM SUPABASE');
    console.log('-'.repeat(40));
    try {
      await testSupabaseConnection();
      results.supabase = true;
      console.log('✅ Teste de Supabase concluído');
    } catch (error) {
      console.error('❌ Falha no teste de Supabase:', error.message);
    }

    // Teste 2: Servidor básico
    console.log('\n🌐 TESTE 2: SERVIDOR BÁSICO');
    console.log('-'.repeat(40));
    try {
      await testServerBasic();
      results.server = true;
      console.log('✅ Teste de servidor concluído');
    } catch (error) {
      console.error('❌ Falha no teste de servidor:', error.message);
    }

    // Teste 3: APIs completas (apenas se servidor estiver funcionando)
    if (results.server) {
      console.log('\n🔗 TESTE 3: APIs COMPLETAS');
      console.log('-'.repeat(40));
      try {
        await runAllTests();
        results.apis = true;
        console.log('✅ Teste de APIs concluído');
      } catch (error) {
        console.error('❌ Falha no teste de APIs:', error.message);
      }
    } else {
      console.log('\n⏭️  PULANDO TESTE DE APIs (servidor não está funcionando)');
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('='.repeat(60));
    
    const testNames = {
      supabase: 'Conexão Supabase',
      server: 'Servidor Básico',
      apis: 'APIs Completas'
    };

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSOU' : '❌ FALHOU';
      console.log(`${testNames[test].padEnd(20)}: ${status}`);
    });

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('='.repeat(60));
    console.log(`📈 Taxa de Sucesso: ${passedTests}/${totalTests} (${successRate}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 TODOS OS TESTES PASSARAM!');
      console.log('✅ Backend está pronto para uso');
    } else if (results.supabase && results.server) {
      console.log('⚠️  TESTES BÁSICOS PASSARAM');
      console.log('✅ Backend está funcionando, mas APIs podem ter problemas');
    } else if (results.supabase) {
      console.log('⚠️  APENAS SUPABASE ESTÁ FUNCIONANDO');
      console.log('❌ Servidor não está rodando - execute: npm start');
    } else {
      console.log('❌ PROBLEMAS CRÍTICOS DETECTADOS');
      console.log('🔧 Verifique a configuração do Supabase e servidor');
    }

    console.log('\n💡 PRÓXIMOS PASSOS:');
    if (!results.supabase) {
      console.log('1. Configure as variáveis de ambiente do Supabase');
      console.log('2. Execute o schema no Supabase');
    }
    if (!results.server) {
      console.log('1. Execute: npm start no diretório backend');
      console.log('2. Verifique se a porta 3001 está livre');
    }
    if (results.supabase && results.server && !results.apis) {
      console.log('1. Verifique os logs do servidor para erros');
      console.log('2. Teste as APIs individualmente');
    }
    if (results.supabase && results.server && results.apis) {
      console.log('1. Integre o frontend com as APIs');
      console.log('2. Teste o sistema completo');
    }

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO DURANTE OS TESTES:');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllBackendTests().catch(console.error);
}

module.exports = { runAllBackendTests };
