const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../services/supabase.js');

// Middleware de autenticação (simplificado por enquanto)
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['apikey'] || req.headers['x-api-key'];
  console.log('🔑 API Key recebida:', apiKey);
  console.log('🔑 API Key esperada:', process.env.EVOLUTION_API_KEY);
  
  if (!apiKey || apiKey !== process.env.EVOLUTION_API_KEY) {
    console.log('❌ API Key inválida');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.log('✅ API Key válida');
  next();
};

// GET /api/leads - Listar todos os leads
router.get('/', authenticateApiKey, async (req, res) => {
  try {
    console.log('📋 Buscando leads...');
    
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ ${data.length} leads encontrados`);
    res.json(data);
  } catch (error) {
    console.error('❌ Erro geral na busca de leads:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads/:id - Obter lead específico
router.get('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/leads - Criar novo lead
router.post('/', authenticateApiKey, async (req, res) => {
  try {
    console.log('📝 Recebendo dados para criar lead:', req.body);
    
    const { name, email, phone, campaign, source, status, priority, notes } = req.body;

    // Validação básica
    if (!name) {
      console.log('❌ Nome não fornecido');
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const leadData = {
      name,
      email,
      phone,
      campaign,
      source: source || 'website',
      status: status || 'lead-bruto',
      priority: priority || 'medium',
      notes
    };

    console.log('📊 Dados do lead a serem inseridos (campanha:', campaign, '):', leadData);

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro do Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Lead criado com sucesso:', data);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/leads/:id - Atualizar lead
router.put('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/leads/:id - Deletar lead
router.delete('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ message: 'Lead deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads/dashboard/stats - Estatísticas do dashboard
router.get('/dashboard/stats', authenticateApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads_dashboard')
      .select('*');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads/by-status/:status - Filtrar leads por status
router.get('/by-status/:status', authenticateApiKey, async (req, res) => {
  try {
    const { status } = req.params;
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 