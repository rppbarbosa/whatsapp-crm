// ===== CORRIGIR PROBLEMAS DE SESSÃO =====

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function fixSessionIssues() {
  try {
    console.log('🔧 Corrigindo problemas de sessão...\n');
    
    const authPath = path.join(__dirname, '.wwebjs_auth');
    
    if (!fs.existsSync(authPath)) {
      console.log('✅ Nenhuma pasta de autenticação encontrada');
      return;
    }
    
    console.log('📁 Verificando pasta de autenticação...');
    const sessions = fs.readdirSync(authPath);
    console.log(`📊 ${sessions.length} sessões encontradas`);
    
    for (const session of sessions) {
      const sessionPath = path.join(authPath, session);
      console.log(`\n🔍 Verificando sessão: ${session}`);
      
      try {
        // Verificar se é um diretório
        const stats = fs.statSync(sessionPath);
        if (!stats.isDirectory()) {
          console.log(`   ⚠️ ${session} não é um diretório, pulando...`);
          continue;
        }
        
        // Verificar arquivos problemáticos
        const debugLogPath = path.join(sessionPath, 'Default', 'chrome_debug.log');
        const lockPath = path.join(sessionPath, 'Default', 'lockfile');
        
        let hasIssues = false;
        
        // Verificar arquivo de debug
        if (fs.existsSync(debugLogPath)) {
          try {
            // Tentar ler o arquivo para verificar se está bloqueado
            fs.accessSync(debugLogPath, fs.constants.R_OK);
            console.log(`   ✅ chrome_debug.log acessível`);
          } catch (accessError) {
            console.log(`   ❌ chrome_debug.log bloqueado: ${accessError.message}`);
            hasIssues = true;
          }
        }
        
        // Verificar lockfile
        if (fs.existsSync(lockPath)) {
          try {
            fs.accessSync(lockPath, fs.constants.R_OK);
            console.log(`   ✅ lockfile acessível`);
          } catch (accessError) {
            console.log(`   ❌ lockfile bloqueado: ${accessError.message}`);
            hasIssues = true;
          }
        }
        
        if (hasIssues) {
          console.log(`   🔧 Tentando corrigir sessão ${session}...`);
          
          // Tentar remover arquivos problemáticos individualmente
          const filesToRemove = [
            debugLogPath,
            lockPath,
            path.join(sessionPath, 'Default', 'SingletonLock'),
            path.join(sessionPath, 'Default', 'SingletonSocket')
          ];
          
          for (const file of filesToRemove) {
            if (fs.existsSync(file)) {
              try {
                fs.unlinkSync(file);
                console.log(`      ✅ Removido: ${path.basename(file)}`);
              } catch (removeError) {
                console.log(`      ⚠️ Não foi possível remover ${path.basename(file)}: ${removeError.message}`);
              }
            }
          }
          
          // Tentar remover diretório Default se estiver vazio
          const defaultPath = path.join(sessionPath, 'Default');
          if (fs.existsSync(defaultPath)) {
            try {
              const defaultFiles = fs.readdirSync(defaultPath);
              if (defaultFiles.length === 0) {
                fs.rmdirSync(defaultPath);
                console.log(`      ✅ Diretório Default removido (vazio)`);
              } else {
                console.log(`      ⚠️ Diretório Default ainda tem ${defaultFiles.length} arquivos`);
              }
            } catch (defaultError) {
              console.log(`      ⚠️ Erro ao verificar Default: ${defaultError.message}`);
            }
          }
          
          // Tentar remover sessão se estiver vazia
          try {
            const sessionFiles = fs.readdirSync(sessionPath);
            if (sessionFiles.length === 0) {
              fs.rmdirSync(sessionPath);
              console.log(`      ✅ Sessão ${session} removida (vazia)`);
            } else {
              console.log(`      ⚠️ Sessão ${session} ainda tem ${sessionFiles.length} arquivos/diretórios`);
            }
          } catch (sessionError) {
            console.log(`      ⚠️ Erro ao verificar sessão: ${sessionError.message}`);
          }
          
        } else {
          console.log(`   ✅ Sessão ${session} sem problemas`);
        }
        
      } catch (sessionError) {
        console.log(`   ❌ Erro ao verificar sessão ${session}: ${sessionError.message}`);
      }
    }
    
    console.log('\n✅ Verificação de sessões concluída');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Reinicie o servidor backend');
    console.log('   2. Tente conectar a instância novamente');
    console.log('   3. Se ainda houver problemas, delete manualmente a pasta .wwebjs_auth');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir sessões:', error);
  }
}

// Executar correção
fixSessionIssues(); 