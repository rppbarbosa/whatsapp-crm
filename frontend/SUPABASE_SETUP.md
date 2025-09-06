# Configuração do Supabase para WhatsApp CRM

Este guia explica como configurar o Supabase para autenticação completa no WhatsApp CRM.

## 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha:
   - **Name**: `whatsapp-crm`
   - **Database Password**: (escolha uma senha forte)
   - **Region**: escolha a mais próxima do Brasil
6. Clique em "Create new project"

## 2. Configurar Variáveis de Ambiente

1. No painel do Supabase, vá em **Settings > API**
2. Copie a **URL** e **anon key**
3. Crie um arquivo `.env.local` na raiz do frontend:

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

## 3. Executar Scripts SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Copie todo o conteúdo do arquivo `supabase-setup.sql`
3. Cole no editor e clique em **Run**

Este script irá:
- Criar as tabelas necessárias
- Configurar RLS (Row Level Security)
- Criar políticas de segurança
- Configurar triggers automáticos

## 4. Configurar Autenticação

1. No painel do Supabase, vá em **Authentication > Settings**
2. Configure as seguintes opções:

### **Site URL**
```
http://localhost:3000
```

### **Redirect URLs**
```
http://localhost:3000/confirm-email
http://localhost:3000/reset-password
```

### **Email Templates**
1. Vá em **Authentication > Email Templates**
2. Personalize os templates conforme necessário

## 5. Configurar Email (Opcional)

Para envio de emails de confirmação:

1. Vá em **Authentication > Settings > SMTP Settings**
2. Configure seu provedor de email (Gmail, SendGrid, etc.)
3. Ou use o provedor padrão do Supabase (limitado)

## 6. Testar Configuração

1. Inicie o servidor: `npm start`
2. Acesse `http://localhost:3000/register`
3. Crie uma conta de teste
4. Verifique se recebeu o email de confirmação
5. Confirme o email e teste o login

## 7. Estrutura das Tabelas

### **users**
- `id` (UUID, PK) - Referência ao auth.users
- `email` (TEXT) - Email do usuário
- `name` (TEXT) - Nome do usuário
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### **whatsapp_instances**
- `id` (UUID, PK) - ID da instância
- `user_id` (UUID, FK) - Referência ao usuário
- `instance_name` (TEXT) - Nome da instância
- `phone_number` (TEXT) - Número do telefone
- `status` (TEXT) - Status da conexão
- `qr_code` (TEXT) - Código QR para conexão
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### **whatsapp_chats**
- `id` (UUID, PK) - ID do chat
- `instance_id` (UUID, FK) - Referência à instância
- `chat_id` (TEXT) - ID do chat no WhatsApp
- `contact_name` (TEXT) - Nome do contato
- `contact_phone` (TEXT) - Telefone do contato
- `last_message` (TEXT) - Última mensagem
- `last_message_time` (TIMESTAMP) - Hora da última mensagem
- `unread_count` (INTEGER) - Contador de mensagens não lidas
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### **whatsapp_messages**
- `id` (UUID, PK) - ID da mensagem
- `chat_id` (UUID, FK) - Referência ao chat
- `message_id` (TEXT) - ID da mensagem no WhatsApp
- `content` (TEXT) - Conteúdo da mensagem
- `sender` (TEXT) - Remetente
- `is_from_me` (BOOLEAN) - Se é do usuário
- `message_type` (TEXT) - Tipo da mensagem
- `timestamp` (TIMESTAMP) - Hora da mensagem
- `created_at` (TIMESTAMP) - Data de criação

## 8. Segurança

- **RLS (Row Level Security)** está habilitado em todas as tabelas
- **Políticas de segurança** garantem que usuários só vejam seus próprios dados
- **Triggers automáticos** criam perfis de usuário automaticamente
- **Validação de dados** no nível do banco de dados

## 9. Troubleshooting

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Reinicie o servidor após alterar o .env.local

### Erro: "Email not confirmed"
- Verifique se o email de confirmação foi enviado
- Verifique a pasta de spam
- Configure o SMTP se necessário

### Erro: "User not found"
- Verifique se o trigger `handle_new_user` foi criado
- Verifique se a tabela `users` existe

### Erro: "Permission denied"
- Verifique se as políticas RLS estão configuradas
- Verifique se o usuário está autenticado

## 10. Próximos Passos

1. **Configurar backup automático** no Supabase
2. **Implementar rate limiting** para APIs
3. **Configurar monitoramento** de performance
4. **Implementar logs de auditoria**
5. **Configurar backup de dados** críticos
