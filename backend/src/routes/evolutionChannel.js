const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');

// Webhook para receber mensagens da Evolution API (conforme documentação oficial)
// POST /webhook/evolution
router.post('/evolution', async (req, res) => {
  try {
    console.log('📨 Webhook Evolution Channel recebido:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });

    const { numberId, key, pushName, message, messageType } = req.body;

    if (!numberId || !key || !message) {
      console.warn('⚠️ Webhook com dados incompletos:', req.body);
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Extrair informações da mensagem
    const contactId = key.remoteJid;
    const messageId = key.id;
    const isFromMe = key.fromMe;
    const messageBody = message.conversation || message.text || 'Mensagem de mídia';
    const timestamp = Math.floor(Date.now() / 1000);

    console.log(`📱 Processando mensagem:`, {
      instanceId: numberId,
      contactId,
      messageId,
      fromMe: isFromMe,
      body: messageBody.substring(0, 50),
      messageType
    });

    // Processar apenas mensagens recebidas (não enviadas por nós)
    if (isFromMe) {
      console.log('📤 Mensagem enviada por nós (ignorada)');
      return res.status(200).json({ status: 'ignored', reason: 'outbound_message' });
    }

    // Garantir que o contato existe no banco
    const cleanContactId = contactId.replace('@c.us', '').replace('@s.whatsapp.net', '');
    
    try {
      // Verificar se o contato já existe
      const { data: existingContact, error: findError } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('id, has_messages')
        .eq('id', cleanContactId)
        .eq('instance_name', numberId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar contato:', findError);
      }

      if (!existingContact) {
        // Criar novo contato
        const { error: createError } = await supabaseAdmin
          .from('whatsapp_contacts')
          .insert({
            id: cleanContactId,
            instance_name: numberId,
            phone: cleanContactId,
            name: pushName || cleanContactId,
            has_messages: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('❌ Erro ao criar contato:', createError);
        } else {
          console.log(`✅ Novo contato criado: ${cleanContactId}`);
        }
      } else if (!existingContact.has_messages) {
        // Atualizar contato existente para marcar que tem mensagens
        await supabaseAdmin
          .from('whatsapp_contacts')
          .update({ 
            has_messages: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', cleanContactId)
          .eq('instance_name', numberId);
      }
    } catch (contactError) {
      console.error('❌ Erro ao processar contato:', contactError);
    }

    // Salvar a mensagem no banco
    try {
      const { error: messageError } = await supabaseAdmin
        .from('whatsapp_messages')
        .insert({
          id: `${numberId}_${messageId}_${Date.now()}`,
          instance_name: numberId,
          from_id: cleanContactId,
          to_id: numberId, // ID da instância
          body: messageBody,
          timestamp: timestamp,
          type: messageType || 'text',
          is_from_me: false,
          status: 'received',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('❌ Erro ao salvar mensagem:', messageError);
      } else {
        console.log(`✅ Mensagem salva no banco: ${messageBody.substring(0, 30)}...`);
      }
    } catch (messageError) {
      console.error('❌ Erro ao salvar mensagem:', messageError);
    }

    // Responder com sucesso
    res.status(200).json({
      status: 'success',
      message: 'Message processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no webhook Evolution Channel:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Rota para verificar status do webhook
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    service: 'Evolution Channel Webhook',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/webhook/evolution',
      status: '/webhook/status'
    }
  });
});

// Rota para testar o webhook
router.post('/test', (req, res) => {
  console.log('🧪 Teste do webhook Evolution Channel recebido');
  res.json({
    status: 'success',
    message: 'Webhook test successful',
    timestamp: new Date().toISOString(),
    testData: req.body
  });
});

module.exports = router; 