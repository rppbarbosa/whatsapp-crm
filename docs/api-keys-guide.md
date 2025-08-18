# Guia Completo de Chaves e Configurações

## 🔑 **Chaves Configuradas**

### ✅ **Evolution API Key**
- **Arquivo**: `docker-compose.yml` e `backend/.env`
- **Valor**: `whatsapp-crm-evolution-key-2024-secure`
- **Onde usar**: Para autenticar com a Evolution API
- **Status**: ✅ Configurada

### ✅ **Supabase Keys**
- **Arquivo**: `backend/.env`
- **URL**: `https://bivfqoyeagngdfkfkauf.supabase.co`
- **Anon Key**: Já configurada
- **Service Role Key**: Já configurada
- **Status**: ✅ Configuradas

### ✅ **JWT Secret**
- **Arquivo**: `backend/.env`
- **Valor**: Já configurado
- **Status**: ✅ Configurado

### ✅ **Session Secret**
- **Arquivo**: `backend/.env`
- **Valor**: `efa90f6b367cfc0d422be86e2aa3b08a94031236057ad1afe316b6e9f183386b`
- **Status**: ✅ Configurado

### ✅ **Cookie Secret**
- **Arquivo**: `backend/.env`
- **Valor**: `848dc75d1d909576a96d9ff58045d524a5797a32b70bb92c91b08de72a6eff8c`
- **Status**: ✅ Configurado

## 🔍 **Chaves Pendentes**

### ⚠️ **OpenAI API Key**
- **Onde obter**: [platform.openai.com](https://platform.openai.com)
- **Passos**:
  1. Acesse [platform.openai.com](https://platform.openai.com)
  2. Faça login ou crie uma conta
  3. Vá para **API Keys**
  4. Clique em **Create new secret key**
  5. Copie a chave gerada
  6. Cole no arquivo `backend/.env` em `OPENAI_API_KEY=`

## 📋 **Checklist de Configuração**

### ✅ **Concluído**
- [x] Evolution API Key configurada
- [x] Supabase URL e chaves configuradas
- [x] JWT Secret configurado
- [x] Session Secret configurado
- [x] Cookie Secret configurado
- [x] Docker Compose atualizado
- [x] Schema do banco criado
- [x] Backend funcionando

### ⏳ **Pendente**
- [ ] OpenAI API Key
- [ ] Testar conexão com Evolution API
- [ ] Implementar controllers
- [ ] Desenvolver frontend

## 🚀 **Como Testar as Configurações**

### 1. **Testar Backend**
```bash
# No backend
cd backend
npm run dev

# Testar conexão
curl http://localhost:3001/health
```

### 2. **Testar Supabase**
```bash
# Testar conexão com Supabase
curl http://localhost:3001/
```

### 3. **Testar OpenAI**
```bash
# Após configurar a chave
curl -X POST http://localhost:3001/api/ai/health
```

## 🔧 **Configuração Manual**

### **Para atualizar o .env:**

1. O arquivo `.env` já foi criado com todas as configurações
2. Apenas adicione sua OpenAI API Key:
```env
# OpenAI (obrigatório para IA)
OPENAI_API_KEY=sk-...sua-chave-aqui
```

## 🆘 **Troubleshooting**

### **Evolution API não conecta**
- Verifique se o Docker está rodando
- Confirme se a porta 8080 está livre
- Verifique os logs: `docker logs evolution_api`

### **Supabase não conecta**
- Verifique se as chaves estão corretas
- Confirme se o projeto está ativo
- Teste no dashboard do Supabase

### **OpenAI não funciona**
- Verifique se a chave está correta
- Confirme se tem créditos na conta
- Teste no playground da OpenAI

## 📞 **Suporte**

- **Evolution API**: [Documentação](https://doc.evolution-api.com)
- **Supabase**: [Documentação](https://supabase.com/docs)
- **OpenAI**: [Documentação](https://platform.openai.com/docs) 