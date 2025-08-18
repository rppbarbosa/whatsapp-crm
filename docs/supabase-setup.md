# Configuração do Supabase para WhatsApp CRM

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Digite um nome para o projeto (ex: "whatsapp-crm")
6. Escolha uma senha forte para o banco de dados
7. Escolha a região mais próxima
8. Clique em "Create new project"

## 2. Configurar o Banco de Dados

1. No dashboard do projeto, vá para **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `docs/supabase-schema.sql`
4. Clique em **Run** para executar o script

## 3. Obter as Chaves da API

1. No dashboard, vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://xyz.supabase.co`)
   - **anon public** key
   - **service_role** key (mantenha segura!)

## 4. Configurar Variáveis de Ambiente

1. No arquivo `backend/.env`, atualize as configurações:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-do-supabase
```

## 5. Configurar Autenticação (Opcional)

1. No dashboard, vá para **Authentication** > **Settings**
2. Configure os provedores de autenticação desejados:
   - **Email**: Ative para login com email/senha
   - **Google**: Configure OAuth se necessário
   - **GitHub**: Configure OAuth se necessário

3. Configure as URLs de redirecionamento:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## 6. Configurar Storage (Opcional)

1. No dashboard, vá para **Storage**
2. Crie um bucket chamado `avatars` para imagens de perfil
3. Configure as políticas de acesso conforme necessário

## 7. Testar a Conexão

1. Instale as dependências do Supabase:
```bash
cd backend
npm install
```

2. Teste a conexão:
```bash
npm run dev
```

3. Acesse: `http://localhost:3001/health`

## 8. Configurar Webhooks (Opcional)

Para notificações em tempo real:

1. No dashboard, vá para **Database** > **Hooks**
2. Crie webhooks para as tabelas:
   - `messages` - para novas mensagens
   - `conversations` - para mudanças de status
   - `customers` - para novos clientes

## 9. Configurar Edge Functions (Opcional)

Para funcionalidades avançadas:

1. No dashboard, vá para **Edge Functions**
2. Crie funções para:
   - Processamento de webhooks
   - Integração com APIs externas
   - Lógica de negócio complexa

## 10. Monitoramento e Logs

1. No dashboard, vá para **Logs** para monitorar:
   - Queries do banco de dados
   - Autenticação
   - Edge Functions
   - API requests

## Estrutura das Tabelas

### customers
- Armazena informações dos clientes
- Número do WhatsApp como identificador único
- Tags para categorização
- Status para acompanhamento

### conversations
- Histórico de conversas por cliente
- Status da conversa (aberta/fechada)
- Instância do WhatsApp associada

### messages
- Todas as mensagens trocadas
- Tipo de remetente (cliente/agente/IA)
- Suporte a diferentes tipos de mídia

### whatsapp_instances
- Instâncias do WhatsApp configuradas
- Status de conexão
- QR Code para autenticação

### ai_configs
- Configurações de IA por contexto
- Templates de prompts personalizáveis
- Configurações ativas/inativas

### activity_logs
- Log de todas as atividades do sistema
- Auditoria de ações dos usuários
- Rastreamento de mudanças

## Próximos Passos

1. **Implementar Controllers**: Criar lógica de negócio
2. **Desenvolver Frontend**: Interface React com Supabase Auth
3. **Configurar Webhooks**: Notificações em tempo real
4. **Implementar IA**: Integração com OpenAI
5. **Testes**: Testes automatizados com Supabase

## Troubleshooting

### Erro de Conexão
- Verifique se as chaves da API estão corretas
- Confirme se o projeto está ativo
- Verifique as políticas RLS

### Erro de Autenticação
- Configure corretamente as URLs de redirecionamento
- Verifique as configurações de provedores
- Teste o fluxo de autenticação

### Erro de Permissões
- Verifique as políticas RLS nas tabelas
- Confirme se o usuário está autenticado
- Teste com a service role key se necessário 