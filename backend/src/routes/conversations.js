const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase.js');

// Middleware de autenticação
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['apikey'] || req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.EVOLUTION_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// GET /api/conversations - Listar todas as conversas
router.get('/', authenticateApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations_with_lead')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conversations/:id - Obter conversa específica
router.get('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        lead:leads(*),
        customer:customers(*),
        messages(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/conversations - Criar nova conversa
router.post('/', authenticateApiKey, async (req, res) => {
  try {
    const { customer_id, lead_id, whatsapp_instance, whatsapp_number, status, pipeline_status } = req.body;

    // Validação básica
    if (!whatsapp_instance || !whatsapp_number) {
      return res.status(400).json({ error: 'Instância e número do WhatsApp são obrigatórios' });
    }

    const conversationData = {
      customer_id,
      lead_id,
      whatsapp_instance,
      whatsapp_number,
      status: status || 'open',
      pipeline_status: pipeline_status || 'lead-bruto'
    };

    const { data, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/conversations/:id - Atualizar conversa
router.put('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/conversations/:id - Deletar conversa
router.delete('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    res.json({ message: 'Conversa deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conversations/by-status/:status - Filtrar conversas por status do pipeline
router.get('/by-status/:status', authenticateApiKey, async (req, res) => {
  try {
    const { status } = req.params;
    const { data, error } = await supabase
      .from('conversations_with_lead')
      .select('*')
      .eq('pipeline_status', status)
      .order('last_message_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conversations/:id/messages - Obter mensagens de uma conversa
router.get('/:id/messages', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se é um ID de conversa do banco ou um ID de contato do WhatsApp
    if (id.includes('@')) {
      // É um ID de contato do WhatsApp (ex: 141953131933700@lid)
      // Retornar mensagens do WhatsApp para este contato
      const contactId = id;
      const instanceName = req.query.instance; // Instância deve ser passada como query param
      
      if (!instanceName) {
        return res.status(400).json({ error: 'Parâmetro instance é obrigatório para contatos do WhatsApp' });
      }
      
      // Buscar mensagens do WhatsApp para este contato
      const evolutionApiService = require('../services/evolutionApi');
      
      try {
        const messages = await evolutionApiService.getMessages(instanceName, 50);
        
        // Filtrar mensagens para este contato específico
        const contactMessages = messages.filter(msg => 
          msg.from === contactId || msg.to === contactId
        );
        
        // Converter para o formato esperado pelo frontend
        const formattedMessages = contactMessages.map(msg => ({
          id: msg.id,
          content: msg.body,
          sender_type: msg.isFromMe ? 'user' : 'customer',
          message_type: msg.type || 'text',
          created_at: new Date(msg.timestamp * 1000).toISOString(),
          conversation_id: contactId
        }));
        
        res.json(formattedMessages);
      } catch (whatsappError) {
        console.error('Erro ao buscar mensagens do WhatsApp:', whatsappError);
        return res.status(500).json({ error: 'Erro ao buscar mensagens do WhatsApp' });
      }
    } else {
      // É um ID de conversa do banco
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/conversations/:id/pipeline-status - Atualizar status do pipeline
router.put('/:id/pipeline-status', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { pipeline_status } = req.body;

    if (!pipeline_status) {
      return res.status(400).json({ error: 'Status do pipeline é obrigatório' });
    }

    const { data, error } = await supabase
      .from('conversations')
      .update({ pipeline_status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/conversations/:id/messages - Adicionar mensagem à conversa
router.post('/:id/messages', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, sender_type, message_type, media_url } = req.body;

    // Validação básica
    if (!content || !sender_type) {
      return res.status(400).json({ error: 'Conteúdo e tipo de remetente são obrigatórios' });
    }

    const messageData = {
      conversation_id: id,
      content,
      sender_type,
      message_type: message_type || 'text',
      media_url
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Atualizar last_message_at da conversa
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', id);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 