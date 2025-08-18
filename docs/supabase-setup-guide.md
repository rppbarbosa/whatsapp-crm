# 🚀 Guia de Configuração do Supabase para WhatsApp CRM

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Projeto criado no Supabase
- Acesso ao SQL Editor

## 🔧 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha:
   - **Name**: `whatsapp-crm`
   - **Database Password**: (senha forte)
   - **Region**: (escolha a mais próxima)
5. Clique em "Create new project"

### 2. Obter Credenciais

Após criar o projeto, vá em **Settings > API** e copie:

- **Project URL** (ex: `https://bivfqoyeagngdfkfkauf.supabase.co`)
- **anon public** (chave pública)
- **service_role** (chave privada - mantenha segura!)

### 3. Executar Schema SQL

1. No Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `docs/supabase-schema-complete.sql`
4. Clique em **Run** para executar

### 4. Configurar Variáveis de Ambiente

No arquivo `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-public
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

### 5. Configurar Autenticação (Opcional)

Para usar autenticação do Supabase:

1. Vá em **Authentication > Settings**
2. Configure **Site URL**: `http://localhost:3000`
3. Adicione **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

## 📊 Estrutura das Tabelas

### 🎯 **Leads e Pipeline**
- `leads` - Gerenciamento de leads
- `pipeline_activities` - Atividades do pipeline

### 👥 **Clientes e Contatos**
- `customers` - Base de clientes
- `profiles` - Perfis de usuários

### 💬 **Conversas e Mensagens**
- `conversations` - Conversas do WhatsApp
- `messages` - Mensagens individuais

### 📱 **WhatsApp**
- `whatsapp_instances` - Instâncias do WhatsApp

### 🤖 **IA e Automação**
- `ai_configs` - Configurações de IA
- `auto_responses` - Respostas automáticas

### 📈 **Relatórios e Logs**
- `activity_logs` - Logs de atividades
- `metrics` - Métricas e KPIs

## 🔐 Segurança (RLS)

O schema inclui **Row Level Security** configurado:

- ✅ Usuários autenticados podem gerenciar leads
- ✅ Usuários autenticados podem gerenciar conversas
- ✅ Usuários autenticados podem gerenciar clientes
- ✅ Logs de atividade são protegidos

## 📈 Views Úteis

### Dashboard de Leads
```sql
SELECT * FROM public.leads_dashboard;
```

### Conversas com Lead
```sql
SELECT * FROM public.conversations_with_lead;
```

### Métricas de Conversão
```sql
SELECT * FROM public.conversion_metrics;
```

## 🧪 Testar Conexão

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm start
```

## 🔍 Verificar Instalação

1. **Tabelas criadas**: Vá em **Table Editor** no Supabase
2. **Políticas RLS**: Vá em **Authentication > Policies**
3. **Views**: Vá em **SQL Editor** e execute as views

## 🚨 Troubleshooting

### Erro de Conexão
- Verifique as variáveis de ambiente
- Confirme se o projeto está ativo
- Teste a conexão no SQL Editor

### Erro de Permissão
- Verifique se as políticas RLS estão ativas
- Confirme se o usuário está autenticado
- Teste com a chave service_role

### Tabelas não criadas
- Execute o SQL novamente
- Verifique se há erros no console
- Confirme se a extensão uuid-ossp está ativa

## 📚 Próximos Passos

1. **Integrar Backend**: Conectar APIs com Supabase
2. **Integrar Frontend**: Usar dados reais do banco
3. **Configurar Webhooks**: Para receber mensagens do WhatsApp
4. **Implementar IA**: Conectar com OpenAI/Claude
5. **Relatórios**: Criar dashboards com métricas

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [API Reference](https://supabase.com/docs/reference/javascript)
- [SQL Editor](https://supabase.com/docs/guides/database/sql-editor)

---

**✅ Configuração concluída!** Agora você pode integrar o frontend e backend com o Supabase. 