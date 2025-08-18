const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, '.wwebjs_auth');

console.log('🧹 Iniciando limpeza de sessões do WhatsApp Web.js...');

async function cleanupSessions() {
  try {
    if (!fs.existsSync(authPath)) {
      console.log('✅ Nenhuma sessão encontrada para limpar');
      return;
    }

    const sessions = fs.readdirSync(authPath);
    console.log(`📁 Encontradas ${sessions.length} sessões:`);
    
    for (const session of sessions) {
      const sessionPath = path.join(authPath, session);
      const debugLogPath = path.join(sessionPath, 'Default', 'chrome_debug.log');
      
      console.log(`\n🔍 Verificando sessão: ${session}`);
      
      if (fs.existsSync(debugLogPath)) {
        try {
          // Tentar renomear o arquivo para verificar se está bloqueado
          const tempPath = debugLogPath + '.tmp';
          fs.renameSync(debugLogPath, tempPath);
          fs.renameSync(tempPath, debugLogPath);
          console.log(`  ✅ Arquivo ${path.basename(debugLogPath)} está livre`);
        } catch (error) {
          if (error.code === 'EBUSY' || error.code === 'EACCES') {
            console.log(`  ⚠️ Arquivo ${path.basename(debugLogPath)} está bloqueado`);
            try {
              console.log(`  🗑️ Removendo sessão ${session}...`);
              fs.rmSync(sessionPath, { recursive: true, force: true });
              console.log(`  ✅ Sessão ${session} removida com sucesso`);
            } catch (removeError) {
              console.error(`  ❌ Erro ao remover sessão ${session}:`, removeError.message);
            }
          } else {
            console.error(`  ❌ Erro inesperado:`, error.message);
          }
        }
      } else {
        console.log(`  ℹ️ Nenhum arquivo de debug encontrado`);
      }
    }
    
    console.log('\n✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  }
}

// Executar limpeza
cleanupSessions(); 