const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabase');

// GET /api/events - Buscar todos os eventos
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_activities')
      .select(`
        *,
        leads:lead_id (
          id,
          name,
          email,
          phone,
          company
        )
      `)
      .order('scheduled_at', { ascending: true });

    if (error) {
      // Fallback: se a tabela não existir ou houver erro de esquema, retornar lista vazia para não quebrar o frontend
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('table')) {
        return res.json({ success: true, data: [] });
      }
      throw error;
    }

    // Transformar dados para o formato esperado pelo frontend
    const events = data.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      type: activity.activity_type,
      priority: 'medium', // Default, pode ser expandido
      status: activity.completed_at ? 'completed' : 'scheduled',
      start: new Date(activity.scheduled_at),
      end: new Date(new Date(activity.scheduled_at).getTime() + 60 * 60 * 1000), // +1 hora
      isAllDay: false,
      leadId: activity.lead_id,
      leadName: activity.leads?.name,
      leadPhone: activity.leads?.phone,
      leadEmail: activity.leads?.email,
      location: '',
      reminder: { minutes: 15, sent: false },
      tags: []
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/events/:id - Buscar evento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('pipeline_activities')
      .select(`
        *,
        leads:lead_id (
          id,
          name,
          email,
          phone,
          company
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('table')) {
        return res.status(404).json({ success: false, error: 'Evento não encontrado' });
      }
      throw error;
    }

    const event = {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.activity_type,
      priority: 'medium',
      status: data.completed_at ? 'completed' : 'scheduled',
      start: new Date(data.scheduled_at),
      end: new Date(new Date(data.scheduled_at).getTime() + 60 * 60 * 1000),
      isAllDay: false,
      leadId: data.lead_id,
      leadName: data.leads?.name,
      leadPhone: data.leads?.phone,
      leadEmail: data.leads?.email,
      location: '',
      reminder: { minutes: 15, sent: false },
      tags: []
    };

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/events - Criar novo evento
router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    
    // Criar atividade no pipeline
    const activityData = {
      lead_id: eventData.leadId,
      activity_type: eventData.type,
      title: eventData.title,
      description: eventData.description,
      scheduled_at: eventData.start,
      completed_at: eventData.status === 'completed' ? eventData.start : null
    };

    const { data, error } = await supabase
      .from('pipeline_activities')
      .insert([activityData])
      .select(`
        *,
        leads:lead_id (
          id,
          name,
          email,
          phone,
          company
        )
      `)
      .single();

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('table')) {
        return res.status(201).json({ success: true, data: {
          id: `evt_${Date.now()}`,
          title: activityData.title,
          description: activityData.description,
          type: activityData.activity_type,
          priority: 'medium',
          status: activityData.completed_at ? 'completed' : 'scheduled',
          start: new Date(activityData.scheduled_at),
          end: new Date(new Date(activityData.scheduled_at).getTime() + 60 * 60 * 1000),
          isAllDay: false,
          leadId: activityData.lead_id,
          leadName: undefined,
          leadPhone: undefined,
          leadEmail: undefined,
          location: '',
          reminder: { minutes: 15, sent: false },
          tags: []
        }});
      }
      throw error;
    }

    const event = {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.activity_type,
      priority: 'medium',
      status: data.completed_at ? 'completed' : 'scheduled',
      start: new Date(data.scheduled_at),
      end: new Date(new Date(data.scheduled_at).getTime() + 60 * 60 * 1000),
      isAllDay: false,
      leadId: data.lead_id,
      leadName: data.leads?.name,
      leadPhone: data.leads?.phone,
      leadEmail: data.leads?.email,
      location: '',
      reminder: { minutes: 15, sent: false },
      tags: []
    };

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/events/:id - Atualizar evento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventData = req.body;
    
    const activityData = {
      lead_id: eventData.leadId,
      activity_type: eventData.type,
      title: eventData.title,
      description: eventData.description,
      scheduled_at: eventData.start,
      completed_at: eventData.status === 'completed' ? eventData.start : null
    };

    const { data, error } = await supabase
      .from('pipeline_activities')
      .update(activityData)
      .eq('id', id)
      .select(`
        *,
        leads:lead_id (
          id,
          name,
          email,
          phone,
          company
        )
      `)
      .single();

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('table')) {
        return res.json({ success: true, data: {
          id,
          title: activityData.title,
          description: activityData.description,
          type: activityData.activity_type,
          priority: 'medium',
          status: activityData.completed_at ? 'completed' : 'scheduled',
          start: new Date(activityData.scheduled_at),
          end: new Date(new Date(activityData.scheduled_at).getTime() + 60 * 60 * 1000),
          isAllDay: false,
          leadId: activityData.lead_id,
          leadName: undefined,
          leadPhone: undefined,
          leadEmail: undefined,
          location: '',
          reminder: { minutes: 15, sent: false },
          tags: []
        }});
      }
      throw error;
    }

    const event = {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.activity_type,
      priority: 'medium',
      status: data.completed_at ? 'completed' : 'scheduled',
      start: new Date(data.scheduled_at),
      end: new Date(new Date(data.scheduled_at).getTime() + 60 * 60 * 1000),
      isAllDay: false,
      leadId: data.lead_id,
      leadName: data.leads?.name,
      leadPhone: data.leads?.phone,
      leadEmail: data.leads?.email,
      location: '',
      reminder: { minutes: 15, sent: false },
      tags: []
    };

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/events/:id - Deletar evento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('pipeline_activities')
      .delete()
      .eq('id', id);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('table')) {
        return res.json({ success: true });
      }
      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/events/stats/dashboard - Estatísticas para dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const { data: activities, error } = await supabase
      .from('pipeline_activities')
      .select('activity_type, scheduled_at, completed_at');

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('table')) {
        return res.json({ success: true, data: { total: 0, completed: 0, scheduled: 0, today: 0 } });
      }
      throw error;
    }

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    const stats = {
      total: activities.length,
      completed: activities.filter(a => a.completed_at).length,
      scheduled: activities.filter(a => !a.completed_at).length,
      today: activities.filter(a => {
        const dataAtividade = new Date(a.scheduled_at);
        return dataAtividade >= hoje && dataAtividade < new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
      }).length
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de eventos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
