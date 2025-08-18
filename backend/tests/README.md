# 🧪 ESTRUTURA DE TESTES - BACKEND

## 📁 Organização dos Testes

Esta pasta contém todos os testes, scripts de correção e análise do backend, organizados por categoria para facilitar a manutenção e identificação.

### 🗂️ Estrutura de Pastas

```
tests/
├── 📁 instances/          # Testes relacionados a instâncias WhatsApp
├── 📁 contacts/           # Testes relacionados a contatos
├── 📁 messages/           # Testes relacionados a mensagens
├── 📁 database/           # Testes de banco de dados e seeders
├── 📁 fixes/              # Scripts de correção e debugging
├── 📁 analysis/           # Análises e pesquisas
└── 📁 sql/                # Scripts SQL de correção
```

## 🔧 Categorias de Testes

### 📱 **Instâncias** (`instances/`)
Testes relacionados ao gerenciamento de instâncias WhatsApp:
- ✅ Criação de instâncias
- ✅ Conexão e desconexão
- ✅ Status e persistência
- ✅ Deleção de instâncias
- ✅ Restauração de sessões

**Arquivos principais:**
- `test-restore-instances.js`
- `test-active-instances-function.js`
- `check-db-instances.js`
- `fix-instance-management.js`

### 👥 **Contatos** (`contacts/`)
Testes relacionados ao gerenciamento de contatos:
- ✅ Sincronização de contatos
- ✅ Classificação (contatos vs grupos)
- ✅ Validação de dados
- ✅ Limpeza de duplicatas

**Arquivos principais:**
- `test-contacts-messages.js`
- `debug-contact-data.js`
- `analyze-database-contacts.sql`

### 💬 **Mensagens** (`messages/`)
Testes relacionados ao envio e recebimento de mensagens:
- ✅ Envio de mensagens
- ✅ Sincronização de histórico
- ✅ Correção de timestamps
- ✅ Validação de dados

**Arquivos principais:**
- `test-send-message.js`
- `test-message-save.js`
- `fix-timestamps-in-db.js`

### 🗄️ **Database** (`database/`)
Testes de banco de dados e seeders:
- ✅ Conexão com Supabase
- ✅ Seeders de dados
- ✅ Testes de APIs
- ✅ Criação de views

**Arquivos principais:**
- `test-supabase.js`
- `seed-dashboard-data.js`
- `test-kanban-apis.js`
- `test-leads-api.js`

### 🔧 **Fixes** (`fixes/`)
Scripts de correção e debugging:
- ✅ Correções de bugs
- ✅ Debugging de problemas
- ✅ Melhorias de código
- ✅ Atualizações de dados

**Arquivos principais:**
- `fix-session-issues.js`
- `debug-instances.js`
- `test-fixes.js`
- `check-backend-logs.js`

### 📊 **Analysis** (`analysis/`)
Análises e pesquisas:
- ✅ Análise de dados
- ✅ Pesquisa de documentação
- ✅ Relatórios de uso
- ✅ Investigação de problemas

**Arquivos principais:**
- `analyze-evolution-api-data.js`
- `research-evolution-api-docs.md`
- `table-usage-summary.md`
- `table-usage-report.json`

### 🗃️ **SQL** (`sql/`)
Scripts SQL de correção:
- ✅ Correções de schema
- ✅ Atualizações de dados
- ✅ Limpeza de tabelas
- ✅ Criação de índices

**Arquivos principais:**
- `fix-existing-timestamps.sql`
- `clean-duplicates-and-classify.sql`
- `fix-contacts-constraint.sql`
- `improve-contacts-schema.sql`

## 🚀 Como Usar

### 1. **Executar Testes Específicos**
```bash
# Testar instâncias
node tests/instances/test-restore-instances.js

# Testar contatos
node tests/contacts/test-contacts-messages.js

# Testar mensagens
node tests/messages/test-send-message.js
```

### 2. **Executar Correções**
```bash
# Corrigir problemas de sessão
node tests/fixes/fix-session-issues.js

# Corrigir gerenciamento de instâncias
node tests/fixes/fix-instance-management.js

# Corrigir timestamps
node tests/fixes/fix-timestamps-in-db.js
```

### 3. **Executar Análises**
```bash
# Analisar dados da Evolution API
node tests/analysis/analyze-evolution-api-data.js

# Verificar uso de tabelas
node tests/analysis/table-usage-summary.md
```

### 4. **Executar Scripts SQL**
```bash
# Aplicar correções no banco
psql -d your_database -f tests/sql/fix-existing-timestamps.sql

# Limpar duplicatas
psql -d your_database -f tests/sql/clean-duplicates-and-classify.sql
```

## 📋 Convenções de Nomenclatura

### 🔍 **Arquivos de Teste**
- `test-*.js` - Testes funcionais
- `check-*.js` - Verificações de status
- `debug-*.js` - Scripts de debugging

### 🔧 **Arquivos de Correção**
- `fix-*.js` - Correções de bugs
- `improve-*.js` - Melhorias de código
- `update-*.js` - Atualizações de dados

### 📊 **Arquivos de Análise**
- `analyze-*.js` - Análises de dados
- `research-*.md` - Pesquisas e documentação
- `table-usage-*.md` - Relatórios de uso

### 🗃️ **Arquivos SQL**
- `fix-*.sql` - Correções de schema
- `clean-*.sql` - Limpeza de dados
- `improve-*.sql` - Melhorias de estrutura

## 🎯 Benefícios da Organização

### ✅ **Facilita Manutenção**
- Testes organizados por funcionalidade
- Fácil localização de scripts específicos
- Separação clara entre tipos de teste

### ✅ **Melhora Identificação**
- Nomenclatura consistente
- Categorização lógica
- Documentação clara

### ✅ **Aumenta Produtividade**
- Execução rápida de testes específicos
- Debugging mais eficiente
- Correções organizadas

### ✅ **Facilita Colaboração**
- Estrutura clara para novos desenvolvedores
- Documentação centralizada
- Padrões consistentes

## 🔄 Próximos Passos

1. **Criar testes automatizados** usando Jest ou Mocha
2. **Implementar CI/CD** para execução automática
3. **Adicionar cobertura de testes** para métricas
4. **Criar testes de integração** end-to-end

---

**📝 Nota:** Esta estrutura foi criada para organizar os testes existentes e facilitar a manutenção do projeto. Todos os scripts foram movidos de forma organizada para suas respectivas categorias. 