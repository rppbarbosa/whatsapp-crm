# 🚀 Guia de Teste do Dashboard

## ✅ **Dashboard Conectado ao Supabase!**

O Dashboard agora está conectado com dados reais do banco de dados. Aqui está como testar:

## 📊 **Funcionalidades Implementadas:**

### **1. Estatísticas em Tempo Real:**
- ✅ **Total de Leads** - Conta todos os leads do banco
- ✅ **Conversas Ativas** - Mostra conversas com status 'open'
- ✅ **Instâncias WhatsApp** - Conta instâncias conectadas
- ✅ **Total Conversas** - Conta todas as conversas
- ✅ **Percentuais de Crescimento** - Calcula crescimento mensal

### **2. Atividades Recentes:**
- ✅ **Leads Recentes** - Últimos leads criados
- ✅ **Conversas Recentes** - Últimas conversas iniciadas
- ✅ **Tempo Relativo** - "2 min atrás", "1h atrás", etc.
- ✅ **Ordenação por Data** - Mais recentes primeiro

### **3. Loading States:**
- ✅ **Skeleton Loading** - Durante carregamento
- ✅ **Auto-refresh** - Atualiza a cada 30 segundos
- ✅ **Tratamento de Erros** - Toast notifications

## 🧪 **Como Testar:**

### **1. Inserir Dados de Exemplo:**
```bash
# No terminal, na pasta backend
cd backend
npm run seed
```

### **2. Verificar Dashboard:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### **3. Acessar Dashboard:**
- Abra: `http://localhost:3000`
- Clique em "Dashboard" no menu lateral
- Veja as estatísticas reais carregando

## 📈 **Dados que Serão Inseridos:**

### **Leads (5):**
- João Silva (lead-bruto)
- Maria Santos (contato-realizado)
- Pedro Costa (qualificado)
- Ana Oliveira (proposta-enviada)
- Carlos Ferreira (follow-up)

### **Clientes (2):**
- João Silva (ativo)
- Maria Santos (lead)

### **Conversas (4):**
- 2 conversas ativas
- 1 conversa fechada (ganha)
- 1 conversa pendente

### **Mensagens (4):**
- Mensagens de exemplo entre cliente e agente

## 🎯 **O que Você Verá:**

### **Cards de Estatísticas:**
- **Total de Leads:** 5
- **Conversas Ativas:** 2
- **Instâncias WhatsApp:** 0 (até criar uma)
- **Total Conversas:** 4

### **Atividades Recentes:**
- "Novo lead criado: João Silva"
- "Conversa iniciada com João Silva"
- "Novo lead criado: Maria Santos"
- etc.

## 🔄 **Atualizações Automáticas:**

O Dashboard atualiza automaticamente:
- ✅ **A cada 30 segundos**
- ✅ **Ao criar novos leads**
- ✅ **Ao iniciar novas conversas**
- ✅ **Ao conectar instâncias WhatsApp**

## 🚨 **Se Não Aparecer Dados:**

1. **Verificar Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verificar Supabase:**
   ```bash
   cd backend
   npm run test:supabase
   ```

3. **Inserir Dados:**
   ```bash
   cd backend
   npm run seed
   ```

4. **Verificar Console:**
   - Abrir DevTools (F12)
   - Verificar erros no console
   - Verificar logs das APIs

## 🎉 **Próximos Passos:**

Após testar o Dashboard, podemos:
1. **Conectar a página de Leads** com dados reais
2. **Conectar o Pipeline** com conversas reais
3. **Conectar WhatsApp Business** com mensagens reais
4. **Adicionar gráficos** e métricas avançadas

---

**🚀 Pronto para testar? Execute `npm run seed` no backend e veja o Dashboard em ação!** 