# Evolution API - Configuração Local

Este diretório contém a configuração para rodar a Evolution API localmente durante o desenvolvimento.

## 🚀 **Configuração Rápida**

### **1. Pré-requisitos:**
- Java 11 ou superior instalado
- PowerShell (Windows) ou Terminal (Linux/Mac)

### **2. Configuração inicial:**
```powershell
# Executar o script de configuração
.\setup-evolution-api.ps1
```

### **3. Iniciar a API:**
```powershell
# Iniciar Evolution API
.\start-evolution-api.ps1
```

## 📋 **O que cada script faz:**

### **`setup-evolution-api.ps1`:**
- ✅ Baixa a Evolution API JAR mais recente
- ✅ Cria diretório de logs
- ✅ Cria arquivo de configuração `.env`
- ✅ Verifica se o Java está instalado

### **`start-evolution-api.ps1`:**
- ✅ Verifica se tudo está configurado
- ✅ Inicia a Evolution API na porta 8080
- ✅ Mostra logs de inicialização

### **`ecosystem.config.js`:**
- ✅ Configuração PM2 para produção
- ✅ Gerenciamento de processos
- ✅ Logs estruturados

## 🌐 **Endpoints disponíveis:**

Após iniciar, a Evolution API estará disponível em:
- **URL Base:** `http://localhost:8080`
- **API Key:** `whatsapp-crm-evolution-key-2024-secure`

### **Endpoints principais:**
- `POST /instance/create` - Criar instância
- `GET /instance/connect/{instance}` - Conectar e obter QR
- `GET /instance/status/{instance}` - Status da instância
- `POST /message/sendText/{instance}` - Enviar mensagem
- `DELETE /instance/delete/{instance}` - Deletar instância

## 🔧 **Configurações personalizadas:**

Edite o arquivo `.env` para personalizar:
- Porta da API
- Nível de logs
- Configurações de banco
- Webhooks

## 📱 **Testando a API:**

### **1. Health Check:**
```bash
curl http://localhost:8080/health
```

### **2. Criar instância:**
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: whatsapp-crm-evolution-key-2024-secure" \
  -d '{
    "instanceName": "teste",
    "token": "teste-token",
    "qrcode": true,
    "integration": "EVOLUTION"
  }'
```

## 🚨 **Solução de problemas:**

### **Porta 8080 em uso:**
```powershell
# Verificar o que está usando a porta
netstat -ano | findstr :8080

# Parar processo específico
taskkill /PID <PID> /F
```

### **Java não encontrado:**
- Instale Java 11+ do site oficial
- Adicione ao PATH do sistema
- Reinicie o terminal

### **Erro de permissão:**
- Execute PowerShell como administrador
- Verifique permissões de escrita no diretório

## 📚 **Documentação oficial:**
- [Evolution API Docs](https://doc.evolution-api.com/)
- [GitHub Repository](https://github.com/EvolutionAPI/evolution-api)
- [Releases](https://github.com/EvolutionAPI/evolution-api/releases)

## 🔄 **Para produção (Vercel):**

Quando estiver funcionando localmente, você pode:
1. Fazer deploy da Evolution API na Vercel
2. Atualizar as variáveis de ambiente
3. Configurar webhooks para produção

## 💡 **Dicas:**

- Mantenha a Evolution API rodando em um terminal separado
- Use PM2 para gerenciar o processo em produção
- Monitore os logs para debug
- Teste sempre localmente antes de fazer deploy 