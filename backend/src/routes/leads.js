const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');

// GET /api/leads - Buscar todos os leads
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/:id - Buscar lead por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads - Criar novo lead
router.post('/', async (req, res) => {
  try {
    const leadData = req.body;
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/leads/:id - Atualizar lead
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leadData = req.body;
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(leadData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/leads/:id - Deletar lead
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/stats/dashboard - Estatísticas para dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('status, priority, created_at');

    if (error) throw error;

    // Calcular estatísticas
    const stats = {
      total: leads.length,
      porStatus: {},
      porPrioridade: {},
      ultimos7Dias: 0,
      ultimos30Dias: 0
    };

    const agora = new Date();
    const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    leads.forEach(lead => {
      // Contar por status
      stats.porStatus[lead.status] = (stats.porStatus[lead.status] || 0) + 1;
      
      // Contar por prioridade
      stats.porPrioridade[lead.priority] = (stats.porPrioridade[lead.priority] || 0) + 1;
      
      // Contar por período
      const dataCriacao = new Date(lead.created_at);
      if (dataCriacao >= seteDiasAtras) stats.ultimos7Dias++;
      if (dataCriacao >= trintaDiasAtras) stats.ultimos30Dias++;
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;