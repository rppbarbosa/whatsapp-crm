# Deploy na Vercel - WhatsApp CRM

## 🚀 **Configuração Local (Sem Docker)**

### ✅ **Status Atual:**
- ✅ Backend rodando localmente na porta 3001
- ✅ Supabase configurado e funcionando
- ✅ OpenAI configurado e funcionando
- ✅ Evolution API externa configurada
- ✅ Todas as APIs funcionando

## 📋 **Passos para Deploy na Vercel**

### 1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

### 2. **Fazer Login na Vercel**
```bash
vercel login
```

### 3. **Configurar Variáveis de Ambiente**
No dashboard da Vercel, configure as seguintes variáveis:

```env
# Supabase
SUPABASE_URL=https://bivfqoyeagngdfkfkauf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdmZxb3llYWduZ2Rma2ZrYXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwOTQ1NjYsImV4cCI6MjA2OTY3MDU2Nn0.D0PerAxZWiH0ZSr4D_VcXpibBsd6Lj3GB_5TdWcP_Po
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdmZxb3llYWduZ2Rma2ZrYXVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA5NDU2NiwiZXhwIjoyMDY5NjcwNTY2fQ.P_OSD12uv40PX9aTqgRCk31PreNZcJvw9HhMx7xsCcE

# Evolution API
EVOLUTION_API_URL=https://evolution.chatwoot.app.br
EVOLUTION_API_KEY=test

# OpenAI
OPENAI_API_KEY=sua-chave-openai-aqui

# JWT Secret
JWT_SECRET=OGHNStau5kmNxRYIIwZkp/82ejboeq5W5oF8oUKg26vEM0SxVfGzaJouksoJCVnTWy1QSXLcQ212yQZsB5L6YA==

# Segurança
SESSION_SECRET=efa90f6b367cfc0d422be86e2aa3b08a94031236057ad1afe316b6e9f183386b
COOKIE_SECRET=848dc75d1d909576a96d9ff58045d524a5797a32b70bb92c91b08de72a6eff8c

# Frontend URL (será atualizada após deploy)
FRONTEND_URL=https://seu-dominio.vercel.app
```

### 4. **Deploy do Backend**
```bash
# Na pasta raiz do projeto
vercel --prod
```

### 5. **Configurar Domínio Personalizado (Opcional)**
- No dashboard da Vercel, vá em Settings > Domains
- Adicione seu domínio personalizado

## 🔧 **Configuração da Evolution API**

### 1. **Acessar Evolution Manager**
- URL: https://evolution.chatwoot.app.br/login
- Server URL: https://evolution.chatwoot.app.br
- API Key: test

### 2. **Criar Instância do WhatsApp**
1. Clique em "Create Instance"
2. Digite um nome (ex: "whatsapp-crm")
3. Clique em "Create"

### 3. **Conectar WhatsApp**
1. Clique na instância criada
2. Clique em "Connect"
3. Escaneie o QR Code com seu WhatsApp Business

## 📱 **Testando a Integração**

### 1. **Testar APIs**
```bash
# Health check
curl https://seu-dominio.vercel.app/health

# Listar clientes
curl https://seu-dominio.vercel.app/api/customers

# Criar cliente
curl -X POST https://seu-dominio.vercel.app/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "5511999999999",
    "name": "João Silva",
    "email": "joao@email.com"
  }'
```

### 2. **Testar Evolution API**
```bash
# Listar instâncias
curl -H "apikey: test" \
  https://evolution.chatwoot.app.br/instance/fetchInstances
```

## 🎯 **Próximos Passos**

### 1. **Desenvolver Frontend**
- Criar interface React
- Integrar com Supabase Auth
- Dashboard do CRM

### 2. **Configurar Webhooks**
- Webhooks da Evolution API para receber mensagens
- Integração com Supabase para salvar dados

### 3. **Implementar IA**
- Respostas automáticas
- Análise de sentimento
- Sugestões de tags

## 🆘 **Troubleshooting**

### **Erro de CORS**
- Verifique se o `FRONTEND_URL` está correto
- Configure CORS no backend se necessário

### **Erro de Conexão com Evolution API**
- Verifique se a API Key está correta
- Confirme se a instância está conectada

### **Erro de Supabase**
- Verifique as chaves da API
- Confirme se as tabelas foram criadas

## 📞 **Suporte**

- **Vercel**: [Documentação](https://vercel.com/docs)
- **Evolution API**: [Documentação](https://doc.evolution-api.com)
- **Supabase**: [Documentação](https://supabase.com/docs)
- **OpenAI**: [Documentação](https://platform.openai.com/docs) 