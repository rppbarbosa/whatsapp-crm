# 📊 Schema do Banco de Dados - Sistema de Usuários, Projetos e Auditoria

## 🎯 Visão Geral

Este schema foi projetado para suportar o sistema de gerenciamento de usuários, projetos e auditoria do WhatsApp CRM, seguindo os princípios de:

- **Simplicidade**: Estrutura clara e direta
- **Performance**: Índices otimizados para consultas frequentes
- **Segurança**: RLS (Row Level Security) implementado
- **Escalabilidade**: Preparado para crescimento
- **Integridade**: Constraints e validações robustas

## 🗂️ Estrutura das Tabelas

### 1. **profiles** - Perfis de Usuários
```sql
- id (UUID) - Referência ao auth.users do Supabase
- name (TEXT) - Nome do usuário
- email (TEXT) - Email único
- phone (TEXT) - Telefone opcional
- avatar_url (TEXT) - URL do avatar
- role (TEXT) - 'owner' ou 'member'
- project_id (UUID) - Projeto ao qual pertence (NULL se não estiver em nenhum)
- is_active (BOOLEAN) - Status ativo/inativo
- last_login (TIMESTAMP) - Último login
- created_at/updated_at (TIMESTAMP) - Controle de tempo
```

### 2. **projects** - Projetos
```sql
- id (UUID) - ID único do projeto
- name (TEXT) - Nome do projeto
- description (TEXT) - Descrição
- owner_id (UUID) - Proprietário do projeto
- settings (JSONB) - Configurações (allowInvites, maxMembers)
- color (TEXT) - Cor do projeto
- created_at/updated_at (TIMESTAMP) - Controle de tempo
```

### 3. **project_invites** - Convites de Projeto
```sql
- id (UUID) - ID único do convite
- project_id (UUID) - Projeto alvo
- from_user_id (UUID) - Usuário que enviou
- to_user_id (UUID) - Usuário convidado
- status (TEXT) - 'pending', 'approved', 'rejected'
- message (TEXT) - Mensagem opcional
- created_at (TIMESTAMP) - Data de criação
- responded_at (TIMESTAMP) - Data de resposta
```

### 4. **audit_logs** - Logs de Auditoria
```sql
- id (UUID) - ID único do log
- user_id (UUID) - Usuário que executou a ação
- action (TEXT) - Tipo de ação (created, updated, deleted, etc.)
- entity_type (TEXT) - Tipo de entidade (user, project, invite, etc.)
- entity_id (TEXT) - ID da entidade afetada
- entity_name (TEXT) - Nome da entidade
- details (JSONB) - Detalhes adicionais
- ip_address (INET) - IP do usuário
- user_agent (TEXT) - User agent do navegador
- timestamp (TIMESTAMP) - Data/hora da ação
```

## 🔧 Funcionalidades Implementadas

### **Regras de Negócio**

1. **Um Usuário = Um Projeto**
   - Usuário só pode estar em um projeto por vez
   - Ao ser aprovado em novo projeto, sai do anterior automaticamente

2. **Sistema de Convites**
   - Convites únicos por projeto/usuário
   - Aprovação/recusa automática
   - Cancelamento de convites conflitantes

3. **Auditoria Completa**
   - Log de todas as ações
   - Rastreamento de IP e User Agent
   - Detalhes em JSON para flexibilidade

### **Funções Auxiliares**

1. **can_user_join_project()**
   - Verifica se usuário pode participar de projeto
   - Valida limites e permissões

2. **approve_project_invite()**
   - Aprova convite e transfere usuário
   - Cancela outros convites pendentes

### **Views Úteis**

1. **project_stats**
   - Estatísticas de projetos
   - Contagem de membros e convites

2. **audit_logs_detailed**
   - Logs com informações do usuário
   - Facilita consultas e relatórios

## 🚀 Índices de Performance

### **Índices Primários**
- `profiles`: project_id, email, role, is_active
- `projects`: owner_id, created_at
- `project_invites`: project_id, from_user_id, to_user_id, status
- `audit_logs`: user_id, entity_type, action, timestamp

### **Índices Compostos**
- Convites por projeto e status
- Logs por usuário e período
- Perfis por projeto e status

## 🔒 Segurança (RLS)

### **Políticas Implementadas**

1. **Profiles**
   - Usuário vê apenas seu perfil
   - Membros do projeto veem outros membros
   - Proprietário pode atualizar projeto

2. **Projects**
   - Proprietário vê seus projetos
   - Membros veem detalhes do projeto
   - Apenas proprietário pode atualizar

3. **Project Invites**
   - Usuário vê convites enviados/recebidos
   - Pode criar e responder convites

4. **Audit Logs**
   - Usuário vê seus próprios logs
   - Membros do projeto veem logs do projeto

## 📈 Casos de Uso Principais

### **1. Criação de Projeto**
```sql
-- Usuário cria projeto automaticamente ao se registrar
INSERT INTO projects (name, description, owner_id) 
VALUES ('Meu Projeto', 'Descrição', user_id);
```

### **2. Convite para Projeto**
```sql
-- Usuário envia convite
INSERT INTO project_invites (project_id, from_user_id, to_user_id, message)
VALUES (project_id, user_id, target_user_id, 'Mensagem');
```

### **3. Aprovação de Convite**
```sql
-- Aprovar convite (função automática)
SELECT approve_project_invite(invite_id);
```

### **4. Log de Auditoria**
```sql
-- Registrar ação
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
VALUES (user_id, 'created', 'project', project_id, '{"name": "Projeto"}');
```

## 🔄 Migrações e Atualizações

### **Versão 1.0** (Atual)
- Estrutura base implementada
- RLS configurado
- Funções auxiliares criadas

### **Próximas Versões**
- Triggers para auditoria automática
- Views de relatórios avançados
- Otimizações de performance

## 🛠️ Configuração no Supabase

### **1. Executar Schema**
```sql
-- Executar o arquivo schema-usuarios-projetos-auditoria.sql
-- no SQL Editor do Supabase
```

### **2. Configurar RLS**
- As políticas RLS já estão incluídas no schema
- Verificar se estão ativas no dashboard

### **3. Testar Funcionalidades**
```sql
-- Testar criação de usuário
-- Testar sistema de convites
-- Testar auditoria
```

## 📊 Métricas e Monitoramento

### **Consultas Úteis**

1. **Usuários por Projeto**
```sql
SELECT p.name, COUNT(pr.id) as members
FROM projects p
LEFT JOIN profiles pr ON pr.project_id = p.id
GROUP BY p.id, p.name;
```

2. **Convites Pendentes**
```sql
SELECT COUNT(*) as pending_invites
FROM project_invites
WHERE status = 'pending';
```

3. **Atividade Recente**
```sql
SELECT action, entity_type, COUNT(*) as count
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY action, entity_type;
```

## 🎯 Próximos Passos

1. **Implementar Backend**
   - APIs para CRUD de usuários/projetos
   - Endpoints para convites
   - Sistema de auditoria

2. **Integrar Frontend**
   - Conectar com APIs
   - Implementar real-time
   - Adicionar notificações

3. **Otimizações**
   - Cache de consultas frequentes
   - Paginação de logs
   - Compressão de dados

---

**Schema criado em:** 2024-12-19  
**Versão:** 1.0  
**Compatibilidade:** Supabase PostgreSQL 15+
