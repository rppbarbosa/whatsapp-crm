const { supabase } = require('../services/supabase');

// GET /api/customers - Listar todos os clientes
const getAllCustomers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return res.status(500).json({ error: 'Erro ao buscar clientes' });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/customers/:id - Buscar cliente por ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      console.error('Erro ao buscar cliente:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// POST /api/customers - Criar novo cliente
const createCustomer = async (req, res) => {
  try {
    const { whatsapp_number, name, email, company, tags, status, notes } = req.body;

    // Validações básicas
    if (!whatsapp_number || !name) {
      return res.status(400).json({ 
        error: 'Número do WhatsApp e nome são obrigatórios' 
      });
    }

    // Verificar se o número já existe
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('whatsapp_number', whatsapp_number)
      .single();

    if (existingCustomer) {
      return res.status(409).json({ 
        error: 'Cliente com este número de WhatsApp já existe' 
      });
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([{
        whatsapp_number,
        name,
        email,
        company,
        tags: tags || [],
        status: status || 'active',
        notes
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar cliente:', error);
      return res.status(500).json({ error: 'Erro ao criar cliente' });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Cliente criado com sucesso'
    });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// PUT /api/customers/:id - Atualizar cliente
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { whatsapp_number, name, email, company, tags, status, notes } = req.body;

    // Verificar se o cliente existe
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Se o número foi alterado, verificar se já existe
    if (whatsapp_number) {
      const { data: duplicateNumber } = await supabase
        .from('customers')
        .select('id')
        .eq('whatsapp_number', whatsapp_number)
        .neq('id', id)
        .single();

      if (duplicateNumber) {
        return res.status(409).json({ 
          error: 'Outro cliente já usa este número de WhatsApp' 
        });
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        whatsapp_number,
        name,
        email,
        company,
        tags,
        status,
        notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }

    res.json({
      success: true,
      data,
      message: 'Cliente atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// DELETE /api/customers/:id - Deletar cliente
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o cliente existe
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar cliente:', error);
      return res.status(500).json({ error: 'Erro ao deletar cliente' });
    }

    res.json({
      success: true,
      message: 'Cliente deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/customers/search - Buscar clientes por termo
const searchCustomers = async (req, res) => {
  try {
    const { q, status, tags } = req.query;

    let query = supabase
      .from('customers')
      .select('*');

    // Busca por termo
    if (q) {
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%,whatsapp_number.ilike.%${q}%`);
    }

    // Filtro por status
    if (status) {
      query = query.eq('status', status);
    }

    // Filtro por tags
    if (tags) {
      const tagArray = tags.split(',');
      query = query.overlaps('tags', tagArray);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return res.status(500).json({ error: 'Erro ao buscar clientes' });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers
}; 