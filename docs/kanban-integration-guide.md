# 🎯 Guia de Integração do Kanban - Pipeline de Vendas

## 📋 Visão Geral

Este guia explica como testar e usar o Pipeline de Vendas (Kanban) integrado com dados reais do backend e banco de dados.

## 🚀 Funcionalidades Implementadas

### ✅ **Integração Completa**
- **Dados Reais**: Carrega leads e conversas do Supabase
- **Drag & Drop**: Move cards entre colunas com atualização no backend
- **Status Tracking**: Atualiza status de leads e conversas em tempo real
- **Modal de Criação**: Adiciona novos leads diretamente do Kanban

### ✅ **Colunas do Pipeline**
1. **Lead Bruto** - Novos leads capturados
2. **Contato Realizado** - Primeiro contato estabelecido
3. **Qualificado** - Lead com interesse confirmado
4. **Proposta Enviada** - Proposta comercial enviada
5. **Follow-up** - Acompanhamento em andamento
6. **Fechado (Ganho)** - Deal fechado com sucesso
7. **Fechado (Perdido)** - Lead perdido

### ✅ **Cards Inteligentes**
- **Diferenciação**: Ícones para conversas vs leads
- **Prioridade**: Tags de prioridade (Alta, Média, Baixa)
- **Campanha**: Exibe a campanha de origem
- **Timestamps**: Mostra quando foi criado/atualizado

## 🛠️ Configuração Inicial

### 1. **Criar View no Banco**
```bash
cd backend
node create-conversations-view.js
```

### 2. **Inserir Dados de Exemplo**
```bash
cd backend
node seed-kanban-data.js
```

### 3. **Verificar Backend**
```bash
cd backend
npm start
```

### 4. **Iniciar Frontend**
```bash
cd frontend
npm start
```

## 🧪 Como Testar

### **1. Visualização dos Dados**
- Acesse: `http://localhost:3000/conversations`
- Verifique se os cards aparecem nas colunas corretas
- Confirme que os contadores no topo mostram os números corretos

### **2. Drag & Drop**
- **Arraste um card** de uma coluna para outra
- **Verifique o toast** de confirmação
- **Recarregue a página** para confirmar que a mudança persistiu
- **Teste reordenação** dentro da mesma coluna

### **3. Criação de Leads**
- Clique em **"Novo Lead"**
- Preencha o formulário
- Clique em **"Criar Lead"**
- Verifique se o card aparece na coluna "Lead Bruto"

### **4. Diferenciação de Tipos**
- **Cards de Lead**: Mostram dados do lead (nome, email, campanha)
- **Cards de Conversa**: Mostram ícone de chat e dados da conversa

## 🔧 Estrutura Técnica

### **Frontend (`Conversations.tsx`)**
```typescript
interface KanbanItem {
  id: string;
  type: 'conversation' | 'lead';
  title: string;
  contact: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  status: string;
  priority: string;
  campaign?: string;
  notes?: string;
}
```

### **Backend APIs**
- `GET /api/conversations` - Lista conversas com dados de leads
- `GET /api/leads` - Lista todos os leads
- `PUT /api/conversations/:id/pipeline-status` - Atualiza status da conversa
- `PUT /api/leads/:id` - Atualiza dados do lead
- `POST /api/leads` - Cria novo lead

### **View do Banco (`conversations_with_lead`)**
```sql
SELECT 
  c.*,
  l.name as lead_name,
  l.email as lead_email,
  l.campaign as lead_campaign,
  cust.name as customer_name
FROM conversations c
LEFT JOIN leads l ON c.lead_id = l.id
LEFT JOIN customers cust ON c.customer_id = cust.id
```

## 🎨 Interface do Usuário

### **Cards do Kanban**
- **Título**: Nome do lead/cliente
- **Contato**: Email ou WhatsApp
- **Mensagem**: Última atividade ou observações
- **Timestamp**: Quando foi criado/atualizado
- **Tags**: Prioridade e campanha
- **Ícones**: Diferenciação entre tipos

### **Colunas**
- **Cores**: Diferentes tons para cada status
- **Contadores**: Número de cards em cada coluna
- **Drop Zones**: Áreas para arrastar cards

### **Modal de Criação**
- **Campos**: Nome, email, telefone, campanha, observações
- **Validação**: Nome obrigatório
- **Feedback**: Toast de sucesso/erro

## 🔍 Troubleshooting

### **Problema: Cards não aparecem**
- Verifique se o backend está rodando
- Confirme se há dados no banco
- Verifique os logs do console

### **Problema: Drag & Drop não funciona**
- Verifique se a rota `/api/conversations/:id/pipeline-status` existe
- Confirme se o `conversationsAPI.updatePipelineStatus` está funcionando
- Verifique os logs de erro

### **Problema: Modal não abre**
- Verifique se `showAddModal` está sendo setado
- Confirme se não há erros de JavaScript
- Verifique se o componente `AddLeadModal` está importado

### **Problema: Dados não atualizam**
- Verifique se `loadData()` está sendo chamado
- Confirme se as APIs estão retornando dados corretos
- Verifique se o estado `kanbanItems` está sendo atualizado

## 📊 Próximos Passos

### **Funcionalidades Futuras**
- [ ] **Filtros**: Por campanha, prioridade, data
- [ ] **Busca**: Pesquisar leads/conversas
- [ ] **Bulk Actions**: Ações em lote
- [ ] **Notificações**: Alertas de novos leads
- [ ] **Relatórios**: Métricas do pipeline
- [ ] **Integração WhatsApp**: Mensagens em tempo real

### **Melhorias de UX**
- [ ] **Loading States**: Skeleton loaders
- [ ] **Error Boundaries**: Tratamento de erros
- [ ] **Responsividade**: Mobile-friendly
- [ ] **Animações**: Transições suaves
- [ ] **Keyboard Navigation**: Navegação por teclado

## 🎯 Resultado Esperado

Após seguir este guia, você terá:
- ✅ **Kanban funcional** com dados reais
- ✅ **Drag & Drop** funcionando perfeitamente
- ✅ **Criação de leads** integrada
- ✅ **Interface intuitiva** e responsiva
- ✅ **Dados persistentes** no banco

**🎉 O Pipeline de Vendas está pronto para uso em produção!** 