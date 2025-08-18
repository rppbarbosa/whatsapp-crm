# 🔧 Corrigindo Erros do Dashboard

## ✅ **Problemas Identificados e Soluções:**

### **1. Erro TypeScript - Corrigido ✅**
- **Problema:** `recentActivities` com tipo implícito `any[]`
- **Solução:** Adicionado tipo explícito para o array

### **2. Erro 404 - Backend não está rodando ❌**
- **Problema:** `GET http://localhost:3001/leads 404 (Not Found)`
- **Causa:** Backend não está rodando na porta 3001
- **Solução:** Iniciar o backend

### **3. Warning useEffect - Corrigido ✅**
- **Problema:** Missing dependency warning
- **Solução:** Adicionado eslint-disable comment

## 🚀 **Como Resolver:**

### **Passo 1: Iniciar o Backend**
```bash
# No terminal, na pasta raiz do projeto
cd backend
npm run dev
```

**Ou usar o script PowerShell:**
```powershell
.\start-backend.ps1
```

### **Passo 2: Verificar se o Backend está Rodando**
```bash
# Testar se a API está respondendo
curl http://localhost:3001/health
```

**Resposta esperada:**
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00.000Z"}
```

### **Passo 3: Inserir Dados de Exemplo**
```bash
# No terminal, na pasta backend
npm run seed
```

### **Passo 4: Testar as APIs**
```bash
# Testar rota de leads
curl http://localhost:3001/api/leads

# Testar rota de conversas
curl http://localhost:3001/api/conversations
```

## 🔍 **Verificações:**

### **1. Backend Rodando:**
- ✅ Porta 3001 em uso
- ✅ Logs do servidor aparecendo
- ✅ Health check respondendo

### **2. Rotas Disponíveis:**
- ✅ `GET /api/leads` - Listar leads
- ✅ `GET /api/conversations` - Listar conversas
- ✅ `GET /api/whatsapp/instances` - Listar instâncias
- ✅ `GET /health` - Health check

### **3. Frontend Conectado:**
- ✅ Sem erros 404 no console
- ✅ Dashboard carregando dados
- ✅ Estatísticas aparecendo

## 🚨 **Se Ainda Houver Problemas:**

### **1. Verificar Variáveis de Ambiente:**
```bash
# backend/.env deve ter:
SUPABASE_URL=sua-url-do-supabase
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
EVOLUTION_API_KEY=whatsapp-crm-evolution-key-2024-secure
```

### **2. Verificar Supabase:**
```bash
cd backend
npm run test:supabase
```

### **3. Verificar Logs do Backend:**
- Abrir terminal do backend
- Verificar erros de conexão
- Verificar erros de autenticação

### **4. Verificar Console do Frontend:**
- Abrir DevTools (F12)
- Verificar erros de rede
- Verificar erros de JavaScript

## 🎯 **Resultado Esperado:**

Após corrigir, você deve ver:
- ✅ Dashboard carregando sem erros
- ✅ Estatísticas com números reais
- ✅ Atividades recentes aparecendo
- ✅ Auto-refresh funcionando

---

**🚀 Execute `cd backend && npm run dev` e teste novamente!** 