# Pesquisa Evolution API e WhatsApp Web

## Problemas Identificados

### 1. Duplicação de Conversas
- Mensagens para a instância criam nova conversa em vez de atualizar a existente
- Contatos aparecem com números crus (`554497460856@c.us`) em vez de nomes

### 2. Timestamps Incorretos
- Mensagens mostram hora atual em vez da hora real da mensagem
- Problema de conversão de timezone

## Documentação Evolution API

### Estrutura de IDs WhatsApp
- **Contatos**: `554497460856@c.us`
- **Grupos**: `120363401692352115@g.us`
- **Status/Broadcast**: `status@broadcast`
- **Canais**: `120363123456789@c.us`

### Eventos de Mensagem
```javascript
client.on('message', async (message) => {
  console.log('Nova mensagem:', {
    id: message.id._serialized,
    from: message.from, // ID do remetente
    to: message.to,     // ID do destinatário
    body: message.body,
    timestamp: message.timestamp, // Unix timestamp
    isFromMe: message.fromMe,
    chat: message.chat.id._serialized
  });
});
```

### Timestamps
- `message.timestamp` retorna Unix timestamp (segundos desde 1970)
- Precisa converter para Date: `new Date(message.timestamp * 1000)`
- WhatsApp usa UTC, precisa ajustar timezone local

### Identificação de Contatos
- `message.fromMe` indica se a mensagem é da instância
- `message.chat.id._serialized` é o ID da conversa
- Para conversas com a própria instância, `from` e `to` podem ser iguais

## Soluções Propostas

### 1. Corrigir Identificação de Conversas
```javascript
// Identificar conversa correta
const getConversationId = (message) => {
  if (message.fromMe) {
    return message.to; // Mensagem enviada para este contato
  } else {
    return message.from; // Mensagem recebida deste contato
  }
};
```

### 2. Corrigir Timestamps
```javascript
// Converter timestamp corretamente
const formatTimestamp = (timestamp) => {
  // timestamp é em segundos, converter para milissegundos
  const date = new Date(timestamp * 1000);
  return date.toISOString();
};
```

### 3. Melhorar Processamento de Contatos
```javascript
// Extrair número limpo para contatos
const getCleanPhone = (phone) => {
  if (phone.includes('@c.us')) {
    return phone.replace('@c.us', '');
  }
  return phone;
};
```

## Referências
- [Evolution API Documentation](https://doc.evolution-api.com/)
- [WhatsApp Web JS](https://github.com/pedroslopez/whatsapp-web.js)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp) 