# Guia de Setup - WhatsApp CRM

## 🚀 **Setup Completo do Projeto**

### **1. Pré-requisitos**
- Node.js 20+
- Git
- Conta Supabase
- Conta OpenAI

### **2. Clone e Setup**
```bash
git clone <seu-repositorio>
cd whatsapp-crm
```

### **3. Configurar Backend**
```bash
cd backend
cp env.example .env
npm install
```

### **4. Configurar Variáveis de Ambiente**
Edite o arquivo `backend/.env`:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Evolution API (Integrada)
EVOLUTION_API_KEY=test

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# OpenAI
OPENAI_API_KEY=sua-chave-openai

# Segurança
JWT_SECRET=seu-jwt-secret
SESSION_SECRET=seu-session-secret
COOKIE_SECRET=seu-cookie-secret
```

### **5. Configurar Supabase**
1. Acesse: https://supabase.com
2. Crie um novo projeto
3. Execute o SQL em `docs/supabase-schema.sql`
4. Copie as chaves para o `.env`

### **6. Configurar OpenAI**
1. Acesse: https://platform.openai.com
2. Crie uma conta e obtenha sua API Key
3. Adicione no `.env`

### **7. Iniciar o Projeto**
```bash
npm run dev
```

## 📱 **Configurar WhatsApp**

### **1. Acessar Manager Web**
- URL: http://localhost:3001/api/whatsapp/manager
- API Key: `test`

### **2. Criar Instância**
1. Digite um nome (ex: "whatsapp-crm")
2. Clique em "Create Instance"
3. Aguarde o QR Code aparecer

### **3. Conectar WhatsApp**
1. Abra o WhatsApp no celular
2. Escaneie o QR Code
3. Confirme a conexão

## 🧪 **Testar APIs**

### **Health Check**
```bash
curl http://localhost:3001/health
```

### **Listar Instâncias**
```bash
curl -H "apikey: test" http://localhost:3001/api/whatsapp/instances
```

### **Criar Cliente**
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_number": "5511999999999",
    "name": "João Silva",
    "email": "joao@email.com"
  }'
```

### **Enviar Mensagem**
```bash
curl -X POST http://localhost:3001/api/whatsapp/instances/whatsapp-crm/send \
  -H "apikey: test" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Como posso ajudar?"
  }'
```

## 🚀 **Deploy na Vercel**

### **1. Instalar Vercel CLI**
```bash
npm install -g vercel
```

### **2. Login e Deploy**
```bash
vercel login
vercel --prod
```

### **3. Configurar Variáveis**
No dashboard da Vercel, adicione todas as variáveis do `.env`

## 🐛 **Troubleshooting**

### **Erro de Porta**
Se a porta 3001 estiver ocupada:
```env
PORT=3002
```

### **Erro de Supabase**
- Verifique as chaves no `.env`
- Confirme se o projeto está ativo
- Teste no dashboard do Supabase

### **Erro de OpenAI**
- Verifique se a API Key está correta
- Confirme se tem créditos disponíveis

### **WhatsApp não conecta**
- Verifique se o QR Code foi escaneado
- Confirme se o WhatsApp está conectado à internet
- Tente deletar e recriar a instância

## 📞 **Suporte**

- **Issues**: Abra uma issue no GitHub
- **Documentação**: Veja os arquivos em `docs/`
- **Logs**: Verifique o console do servidor

---

**Projeto simplificado e integrado! 🎉** 