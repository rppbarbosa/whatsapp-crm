# WhatsApp CRM com Evolution API

Um sistema completo de CRM para WhatsApp baseado na arquitetura do Evolution API, com integração de IA e gerenciamento de clientes.

## 🚀 Características

- ✅ **Compatível com Evolution API** - Segue os padrões do Evolution API oficial
- 📱 **Múltiplas instâncias WhatsApp** - Gerencie várias contas simultaneamente
- 🤖 **Integração com IA** - OpenAI para automação de respostas
- 👥 **CRM completo** - Gerenciamento de clientes e conversas
- 🔐 **Autenticação segura** - API keys e JWT
- 📊 **Monitoramento** - Logs e health checks
- 🗄️ **Banco de dados** - Supabase integrado
- ⚡ **Cache em memória** - Performance otimizada

## 📋 Pré-requisitos

- Node.js 18+
- Supabase (conta gratuita)
- OpenAI API (opcional, para IA)

## 🛠️ Instalação Rápida

### Instalação Manual

```bash
# Opção 1: Iniciar tudo de uma vez (recomendado)
chmod +x start-both.sh
./start-both.sh

# Opção 2: Script de instalação
chmod +x start-local.sh
./start-local.sh

# Opção 3: Verificar portas primeiro
chmod +x check-ports.sh
./check-ports.sh

# Opção 4: Manual
# 1. Configure o Supabase primeiro (obrigatório)
# Siga o guia em docs/supabase-setup-guide.md

# 2. Backend (porta 3001)
cd backend
npm install
cp env.example .env
# Configure as variáveis do Supabase no .env
npm run test:supabase  # Teste a conexão
npm run dev

# 3. Frontend (porta 3000) - em outro terminal
cd frontend
npm install
cp env.example .env
npm start
```

### 🔧 Correção de Problemas

Se você encontrar erros relacionados ao WhatsApp Web.js ou arquivos bloqueados:

**Windows (PowerShell):**
```powershell
# Executar script de correção
.\fix-backend.ps1

# Ou limpeza manual
cd backend
npm run cleanup
```

**Linux/Mac:**
```bash
# Executar script de correção
chmod +x fix-backend.sh
./fix-backend.sh

# Ou limpeza manual
cd backend
npm run cleanup
```

**Problemas Comuns:**
- **EBUSY: resource busy or locked** - Execute o script de limpeza
- **ERR_CONNECTION_REFUSED** - Verifique se o backend está rodando na porta 3001
- **Chrome processes** - Use o script para matar processos bloqueados
- **Protocol error (Runtime.callFunctionOn)** - Execute limpeza completa via API: `POST /api/whatsapp/cleanup`
- **Execution context was destroyed** - Reinicie o servidor e tente novamente
- **Initialization timeout** - Aumente o timeout ou use configuração alternativa

## ⚙️ Configuração

### 🗄️ Configuração do Supabase (Obrigatório)

**1. Criar Projeto no Supabase**
- Acesse [supabase.com](https://supabase.com)
- Crie um novo projeto
- Anote as credenciais (URL, anon key, service role key)

**2. Executar Schema SQL**
- No Supabase, vá em **SQL Editor**
- Execute o arquivo `docs/supabase-schema-complete.sql`
- Isso criará todas as tabelas necessárias

**3. Configurar Variáveis de Ambiente**
```env
# Backend/.env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-public
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

**4. Testar Conexão**
```bash
cd backend
npm run test:supabase
```

📖 **Guia Completo**: Veja `docs/supabase-setup-guide.md` para instruções detalhadas.

### Portas Utilizadas

O projeto utiliza as seguintes portas:

- **Frontend (React)**: `3000` - Interface do usuário
- **Backend (Node.js)**: `3001` - API e serviços

Para verificar se as portas estão livres:
```bash
chmod +x check-ports.sh
./check-ports.sh
```

### Variáveis de Ambiente

Copie o arquivo `backend/env.example` para `.env` e configure:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Evolution API
EVOLUTION_API_KEY=sua-chave-api

# Supabase
SUPABASE_URL=sua-url-supabase
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-servico

# OpenAI
OPENAI_API_KEY=sua-chave-openai

# Segurança
JWT_SECRET=seu-jwt-secret
SESSION_SECRET=seu-session-secret
COOKIE_SECRET=seu-cookie-secret


```



## 📱 Uso da API

### Endpoints Principais

#### Instâncias WhatsApp
```bash
# Listar instâncias
GET /api/whatsapp/instances

# Criar instância
POST /api/whatsapp/instances
{
  "instanceName": "minha-instancia"
}

# Conectar instância (gerar QR)
GET /api/whatsapp/instances/{instanceName}/connect

# Enviar mensagem
POST /api/whatsapp/instances/{instanceName}/send
{
  "number": "5511999999999",
  "text": "Olá!"
}

# Deletar instância
DELETE /api/whatsapp/instances/{instanceName}
```

#### Clientes
```bash
# Listar clientes
GET /api/customers

# Criar cliente
POST /api/customers
{
  "phone": "5511999999999",
  "name": "João Silva",
  "email": "joao@email.com"
}
```

#### Conversas
```bash
# Listar conversas
GET /api/conversations

# Obter conversa específica
GET /api/conversations/{id}
```

#### IA
```bash
# Processar mensagem com IA
POST /api/ai/process
{
  "message": "Olá, preciso de ajuda",
  "context": "cliente"
}
```

## 🔧 Compatibilidade com Evolution API

Este projeto é **compatível** com o Evolution API oficial e inclui:

### ✅ Funcionalidades Implementadas
- ✅ Gerenciamento de instâncias
- ✅ QR Code para conexão
- ✅ Envio de mensagens
- ✅ Autenticação por API Key
- ✅ Logs e monitoramento
- ✅ Health checks
- ✅ Rate limiting
- ✅ CORS configurado

### 🔄 Diferenças do Evolution API Oficial
- 🔄 Usa `whatsapp-web.js` diretamente (baseado no Baileys)
- 🔄 Estrutura simplificada para CRM
- 🔄 Integração com Supabase
- 🔄 Sistema de IA integrado

### 📈 Próximos Passos para Compatibilidade Total
- [ ] Implementar webhooks
- [ ] Adicionar suporte a arquivos de mídia
- [ ] Implementar chatwoot integration
- [ ] Adicionar suporte a Typebot

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Evolution     │
│   (React)       │◄──►│   (Express)     │◄──►│   API Service   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │    Supabase     │
                       │   (Database)    │
                       └─────────────────┘
```

## 🔍 Monitoramento

### Health Checks
- `GET /health` - Status geral da API
- `GET /api/whatsapp/health` - Status do serviço WhatsApp

### Logs
Os logs são salvos em:
- Console (desenvolvimento)
- Arquivos (produção)
- Cache em memória (sessões)

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de porta em uso**
   - Execute `./check-ports.sh` para verificar
   - Libere as portas 3000 e 3001 se necessário
   - No Windows: `netstat -ano | findstr :3000` e `taskkill /PID <PID> /F`
   - No Linux/Mac: `lsof -ti:3000 | xargs kill -9`

2. **QR Code não aparece**
   - Verifique se o Puppeteer está funcionando
   - Confirme se o Chromium está instalado

3. **Erro de conexão com banco**
   - Verifique as credenciais do Supabase no `.env`

4. **Erro de autenticação**
   - Verifique se a API key está correta
   - Confirme o header `apikey` nas requisições

5. **Frontend não conecta com backend**
   - Verifique se o backend está rodando na porta 3001
   - Confirme se a URL da API está correta no frontend

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- 📧 Email: suporte@seu-projeto.com
- 💬 Discord: [Link do Discord]
- 📖 Documentação: [Link da documentação]

## 🙏 Agradecimentos

- [Evolution API](https://github.com/EvolutionAPI/evolution-api) - Base para este projeto
- [WhatsApp Web.js](https://github.com/pedroslopez/whatsapp-web.js) - Biblioteca WhatsApp
- [Baileys](https://github.com/whiskeysockets/baileys) - Biblioteca base do WhatsApp 