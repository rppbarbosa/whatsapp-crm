const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');

function mapEventStatusToTaskStatus(eventStatus, completedAt) {
  if (eventStatus === 'in_progress') return 'in_progress';
  if (eventStatus === 'completed') return 'completed';
  if (eventStatus === 'cancelled') return 'cancelled';
  if (eventStatus === 'scheduled') return 'pending';
  return completedAt ? 'completed' : 'pending';
}

// GET /api/events - Buscar todos os eventos
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
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
      // Fallback apenas quando a tabela realmente não existe
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist')) {
        return res.json({ success: true, data: [] });
      }
      throw error;
    }

    // Transformar dados para o formato esperado pelo frontend
    const events = data.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description || undefined,
      type: activity.activity_type,
      priority: activity.priority || 'medium',
      status: activity.status || (activity.completed_at ? 'completed' : 'scheduled'),
      start: activity.scheduled_at ? new Date(activity.scheduled_at) : new Date(),
      end: activity.end_at ? new Date(activity.end_at) : new Date(new Date(activity.scheduled_at).getTime() + 60 * 60 * 1000),
      isAllDay: !!activity.is_all_day,
      leadId: activity.lead_id || undefined,
      leadName: activity.leads?.name,
      leadPhone: activity.leads?.phone,
      leadEmail: activity.leads?.email,
      location: activity.location || '',
      reminder: { minutes: activity.reminder_minutes ?? 15, sent: !!activity.reminder_sent },
      tags: activity.tags || []
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
    const { data, error } = await supabaseAdmin
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
      if (msg.includes('does not exist')) {
        return res.status(404).json({ success: false, error: 'Evento não encontrado' });
      }
      throw error;
    }

    const event = {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      type: data.activity_type,
      priority: data.priority || 'medium',
      status: data.status || (data.completed_at ? 'completed' : 'scheduled'),
      start: data.scheduled_at ? new Date(data.scheduled_at) : new Date(),
      end: data.end_at ? new Date(data.end_at) : new Date(new Date(data.scheduled_at).getTime() + 60 * 60 * 1000),
      isAllDay: !!data.is_all_day,
      leadId: data.lead_id || undefined,
      leadName: data.leads?.name,
      leadPhone: data.leads?.phone,
      leadEmail: data.leads?.email,
      location: data.location || '',
      reminder: { minutes: data.reminder_minutes ?? 15, sent: !!data.reminder_sent },
      tags: data.tags || []
    };

    // Sincronizar com tasks quando activity_type = 'task'
    try {
      if (data.activity_type === 'task') {
        const taskStatus = mapEventStatusToTaskStatus(data.status, data.completed_at);
        const dueDateSource = data.end_at || data.scheduled_at;
        await supabaseAdmin
          .from('tasks')
          .upsert({
            activity_id: data.id,
            lead_id: data.lead_id || null,
            title: data.title,
            description: data.description || null,
            status: taskStatus,
            priority: data.priority || 'medium',
            due_date: dueDateSource ? new Date(dueDateSource) : null,
            tags: Array.isArray(data.tags) ? data.tags : [],
            updated_at: new Date()
          }, { onConflict: 'activity_id' })
          .select()
          .single();
      } else {
        await supabaseAdmin.from('tasks').delete().eq('activity_id', data.id);
      }
    } catch (syncErr) {
      console.warn('Aviso: falha ao sincronizar task com evento (update):', syncErr.message);
    }

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
      description: eventData.description || null,
      scheduled_at: eventData.start,
      end_at: eventData.end || null,
      is_all_day: !!eventData.isAllDay,
      location: eventData.location || null,
      priority: eventData.priority || 'medium',
      status: eventData.status || 'scheduled',
      reminder_minutes: eventData.reminder?.minutes ?? 15,
      reminder_sent: eventData.reminder?.sent ?? false,
      tags: Array.isArray(eventData.tags) ? eventData.tags : [],
      completed_at: eventData.status === 'completed' ? (eventData.end || eventData.start) : null
    };

    const { data, error } = await supabaseAdmin
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
      if (msg.includes('does not exist')) {
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
      description: data.description || undefined,
      type: data.activity_type,
      priority: data.priority || 'medium',
      status: data.status || (data.completed_at ? 'completed' : 'scheduled'),
      start: data.scheduled_at ? new Date(data.scheduled_at) : new Date(),
      end: data.end_at ? new Date(data.end_at) : new Date(new Date(data.scheduled_at).getTime() + 60 * 60 * 1000),
      isAllDay: !!data.is_all_day,
      leadId: data.lead_id || undefined,
      leadName: data.leads?.name,
      leadPhone: data.leads?.phone,
      leadEmail: data.leads?.email,
      location: data.location || '',
      reminder: { minutes: data.reminder_minutes ?? 15, sent: !!data.reminder_sent },
      tags: data.tags || []
    };

    // Sincronizar com tasks quando activity_type = 'task'
    try {
      if (data.activity_type === 'task') {
        const taskStatus = mapEventStatusToTaskStatus(data.status, data.completed_at);
        const dueDateSource = data.end_at || data.scheduled_at;
        await supabaseAdmin
          .from('tasks')
          .upsert({
            activity_id: data.id,
            lead_id: data.lead_id || null,
            title: data.title,
            description: data.description || null,
            status: taskStatus,
            priority: data.priority || 'medium',
            due_date: dueDateSource ? new Date(dueDateSource) : null,
            tags: Array.isArray(data.tags) ? data.tags : [],
            updated_at: new Date()
          }, { onConflict: 'activity_id' })
          .select()
          .single();
      } else {
        await supabaseAdmin.from('tasks').delete().eq('activity_id', data.id);
      }
    } catch (syncErr) {
      console.warn('Aviso: falha ao sincronizar task com evento (create):', syncErr.message);
    }

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
      end_at: eventData.end,
      is_all_day: eventData.isAllDay,
      location: eventData.location,
      priority: eventData.priority,
      status: eventData.status,
      reminder_minutes: eventData.reminder?.minutes,
      reminder_sent: eventData.reminder?.sent,
      tags: eventData.tags,
      completed_at: eventData.status === 'completed' ? (eventData.end || eventData.start) : null
    };

    const { data, error } = await supabaseAdmin
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
      if (msg.includes('does not exist')) {
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
      description: data.description || undefined,
      type: data.activity_type,
      priority: data.priority || 'medium',
      status: data.status || (data.completed_at ? 'completed' : 'scheduled'),
      start: data.scheduled_at ? new Date(data.scheduled_at) : new Date(),
      end: data.end_at ? new Date(data.end_at) : new Date(new Date(data.scheduled_at).getTime() + 60 * 60 * 1000),
      isAllDay: !!data.is_all_day,
      leadId: data.lead_id || undefined,
      leadName: data.leads?.name,
      leadPhone: data.leads?.phone,
      leadEmail: data.leads?.email,
      location: data.location || '',
      reminder: { minutes: data.reminder_minutes ?? 15, sent: !!data.reminder_sent },
      tags: data.tags || []
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
    const { error } = await supabaseAdmin
      .from('pipeline_activities')
      .delete()
      .eq('id', id);

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist')) {
        return res.json({ success: true });
      }
      throw error;
    }

    try {
      await supabaseAdmin.from('tasks').delete().eq('activity_id', id);
    } catch (syncErr) {
      console.warn('Aviso: falha ao remover task vinculada:', syncErr.message);
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
    const { data: activities, error } = await supabaseAdmin
      .from('pipeline_activities')
      .select('activity_type, scheduled_at, completed_at');

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist')) {
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
