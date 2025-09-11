# 🧪 Testes do Backend - Sistema de Usuários e Projetos

## 📋 Visão Geral

Este diretório contém arquivos de teste para validar o funcionamento do backend do sistema de usuários, projetos e auditoria.

## 🚀 Como Executar os Testes

### **1. Teste Completo (Recomendado)**
```bash
# No diretório backend
node run-tests.js
```

### **2. Testes Individuais**

#### **Teste de Conexão com Supabase**
```bash
node test-supabase-connection.js
```
- Verifica se a conexão com Supabase está funcionando
- Valida se as tabelas e funções foram criadas
- Verifica se RLS está ativo

#### **Teste Básico do Servidor**
```bash
node test-server-basic.js
```
- Verifica se o servidor está rodando
- Testa endpoints básicos
- Valida se as rotas estão registradas

#### **Teste Completo das APIs**
```bash
node test-user-project-apis.js
```
- Testa todas as funcionalidades das APIs
- Simula operações de usuários, projetos e convites
- Valida logs de auditoria

## 📊 O que os Testes Verificam

### **🗄️ Supabase**
- ✅ Conexão com o banco de dados
- ✅ Existência das tabelas: `profiles`, `projects`, `project_invites`, `audit_logs`
- ✅ Existência das views: `project_stats`, `audit_logs_detailed`
- ✅ Existência das funções: `can_user_join_project`, `approve_project_invite`
- ✅ Configuração do RLS (Row Level Security)

### **🌐 Servidor**
- ✅ Servidor rodando na porta 3001
- ✅ Endpoint `/health` funcionando
- ✅ Endpoint `/` com informações da API
- ✅ Rotas de usuários registradas (`/api/users/*`)

### **🔗 APIs**
- ✅ **Usuários**: Perfil, estatísticas, atualização
- ✅ **Projetos**: Criação, listagem, atualização, membros
- ✅ **Convites**: Envio, aprovação, rejeição, listagem
- ✅ **Auditoria**: Logs de ações com filtros

## ⚙️ Configuração Necessária

### **Variáveis de Ambiente**
Certifique-se de que as seguintes variáveis estão configuradas no `.env`:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Backend
PORT=3001
BACKEND_URL=http://localhost:3001
```

### **Schema do Banco**
Execute o schema no Supabase antes de rodar os testes:
```sql
-- Execute o conteúdo do arquivo:
docs/schema-integracao-usuarios-projetos-safe.sql
```

## 🔧 Solução de Problemas

### **❌ Erro: "Servidor não está rodando"**
```bash
# Solução: Inicie o servidor
npm start
```

### **❌ Erro: "Tabela não existe"**
```bash
# Solução: Execute o schema no Supabase
# 1. Abra o SQL Editor no Supabase
# 2. Cole o conteúdo de: docs/schema-integracao-usuarios-projetos-safe.sql
# 3. Execute o script
```

### **❌ Erro: "Conexão recusada"**
```bash
# Solução: Verifique as variáveis de ambiente
# 1. Verifique se SUPABASE_URL está correto
# 2. Verifique se SUPABASE_ANON_KEY está correto
# 3. Verifique se o projeto Supabase está ativo
```

### **❌ Erro: "Porta 3001 em uso"**
```bash
# Solução: Libere a porta ou use outra
# 1. Pare outros processos na porta 3001
# 2. Ou altere a variável PORT no .env
```

## 📈 Interpretando os Resultados

### **✅ Todos os Testes Passaram**
- Backend está funcionando perfeitamente
- Pronto para integração com frontend
- Todas as funcionalidades estão operacionais

### **⚠️ Testes Básicos Passaram, APIs Falharam**
- Servidor está funcionando
- Problema pode ser com autenticação ou dados
- Verifique logs do servidor para detalhes

### **❌ Apenas Supabase Funcionando**
- Banco de dados está OK
- Servidor não está rodando
- Execute `npm start` para iniciar

### **❌ Nenhum Teste Passou**
- Problema crítico de configuração
- Verifique variáveis de ambiente
- Verifique se o schema foi executado

## 🎯 Próximos Passos Após os Testes

1. **Se todos os testes passaram**:
   - Integre o frontend com as APIs
   - Teste o sistema completo
   - Implemente funcionalidades adicionais

2. **Se alguns testes falharam**:
   - Corrija os problemas identificados
   - Execute os testes novamente
   - Verifique logs para detalhes

3. **Se todos os testes falharam**:
   - Verifique a configuração básica
   - Execute o schema no Supabase
   - Reinicie o servidor

## 📝 Logs e Debugging

### **Habilitar Logs Detalhados**
```bash
# Para logs mais detalhados, execute:
DEBUG=* node run-tests.js
```

### **Testar APIs Individualmente**
```bash
# Teste apenas uma funcionalidade:
node -e "
const { testUserProfile } = require('./test-user-project-apis');
testUserProfile().catch(console.error);
"
```

## 🔄 Execução Automática

### **Script NPM**
Adicione ao `package.json`:
```json
{
  "scripts": {
    "test": "node run-tests.js",
    "test:supabase": "node test-supabase-connection.js",
    "test:server": "node test-server-basic.js",
    "test:apis": "node test-user-project-apis.js"
  }
}
```

### **Executar com NPM**
```bash
npm run test
npm run test:supabase
npm run test:server
npm run test:apis
```

---

**Versão:** 1.0.0  
**Última atualização:** 2024-12-19  
**Compatibilidade:** Node.js 16+, Supabase PostgreSQL 15+
