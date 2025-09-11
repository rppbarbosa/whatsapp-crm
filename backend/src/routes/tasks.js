const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabase');

// Helper: transforma linha do banco no formato esperado pelo frontend
function mapDbTaskToFrontend(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee_id
      ? {
          id: row.assignee_id,
          name: row.assignee?.full_name || row.assignee?.email || 'Usuário',
          avatar: row.assignee?.avatar_url || undefined,
        }
      : undefined,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    tags: row.tags || [],
    leadId: row.lead_id || undefined,
    leadName: row.leads?.name || undefined,
  };
}

// GET /api/tasks - lista tarefas
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        leads:lead_id ( id, name ),
        assignee:assignee_id ( id, full_name, email, avatar_url )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('table')) {
        return res.json({ success: true, data: [] });
      }
      throw error;
    }

    const tasks = (data || []).map(mapDbTaskToFrontend);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Erro ao listar tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tasks/:id - obter tarefa
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        leads:lead_id ( id, name ),
        assignee:assignee_id ( id, full_name, email, avatar_url )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Task não encontrada' });

    res.json({ success: true, data: mapDbTaskToFrontend(data) });
  } catch (error) {
    console.error('Erro ao obter task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tasks - criar tarefa
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};

    const insertData = {
      title: payload.title,
      description: payload.description || null,
      status: payload.status || 'pending',
      priority: payload.priority || 'medium',
      assignee_id: payload.assignee?.id || payload.assigneeId || null,
      due_date: payload.dueDate ? new Date(payload.dueDate) : null,
      lead_id: payload.leadId || null,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
    };

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([insertData])
      .select(`
        *,
        leads:lead_id ( id, name ),
        assignee:assignee_id ( id, full_name, email, avatar_url )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: mapDbTaskToFrontend(data) });
  } catch (error) {
    console.error('Erro ao criar task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/tasks/:id - atualizar tarefa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const updateData = {
      title: payload.title,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
      assignee_id: payload.assignee?.id ?? payload.assigneeId,
      due_date: payload.dueDate !== undefined ? (payload.dueDate ? new Date(payload.dueDate) : null) : undefined,
      lead_id: payload.leadId,
      tags: Array.isArray(payload.tags) ? payload.tags : undefined,
      updated_at: new Date(),
    };

    // Remover chaves undefined (Supabase rejeita explicitamente)
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        leads:lead_id ( id, name ),
        assignee:assignee_id ( id, full_name, email, avatar_url )
      `)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Task não encontrada' });

    res.json({ success: true, data: mapDbTaskToFrontend(data) });
  } catch (error) {
    console.error('Erro ao atualizar task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/tasks/:id - excluir tarefa
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;


