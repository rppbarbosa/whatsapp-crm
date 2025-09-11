const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { authenticateApiKey } = require('../middleware/auth');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const router = express.Router();

// Login
router.post('/login', authenticateApiKey, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Usuário específico do Rony
    if (email === 'rony@ronypetersonadv.com' && password === 'Bazzinga05') {
      const user = {
        id: 'rony-user-123',
        email: 'rony@ronypetersonadv.com',
        full_name: 'Rony Peterson',
        created_at: new Date().toISOString()
      };

      // Gerar token JWT
      const JWT_SECRET = 'whatsapp-crm-secret-key-2024';
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.full_name,
          email: user.email,
          createdAt: user.created_at
        }
      });
    }

    // Usar Supabase Auth para outros usuários
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciais inválidas' 
      });
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
    }

    res.json({
      success: true,
      token: data.session.access_token,
      user: {
        id: data.user.id,
        name: profile?.full_name || data.user.email.split('@')[0],
        email: data.user.email,
        createdAt: data.user.created_at
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Verificar token
router.post('/verify', authenticateApiKey, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token não fornecido' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token JWT
    try {
      const JWT_SECRET = 'whatsapp-crm-secret-key-2024';
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Se for o usuário do Rony
      if (decoded.userId === 'rony-user-123') {
        return res.json({
          success: true,
          user: {
            id: 'rony-user-123',
            name: 'Rony Peterson',
            email: 'rony@ronypetersonadv.com',
            createdAt: new Date().toISOString()
          }
        });
      }
    } catch (jwtError) {
      console.error('Erro ao verificar JWT:', jwtError);
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }

    // Verificar token com Supabase para outros usuários
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      success: true,
      user: {
        id: user.id,
        name: profile?.full_name || user.email.split('@')[0],
        email: user.email,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Token inválido' 
    });
  }
});

// Logout
router.post('/logout', authenticateApiKey, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await supabase.auth.signOut();
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Registrar usuário
router.post('/register', authenticateApiKey, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos os campos são obrigatórios' 
      });
    }

    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    // Confirmar usuário automaticamente (sem depender de email)
    if (data.user) {
      const { error: confirmError } = await supabase.auth.admin.updateUserById(data.user.id, {
        email_confirm: true
      });

      if (confirmError) {
        console.error('Erro ao confirmar usuário:', confirmError);
        // Continuar mesmo com erro de confirmação
      } else {
        console.log('✅ Usuário confirmado automaticamente:', email);
      }

      // Criar perfil na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          full_name: name,
          role: 'user',
          is_active: true,
          created_at: data.user.created_at,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Se já existe perfil, atualizar
        if (profileError.code === '23505') { // duplicate key
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: name,
              role: 'user',
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Erro ao atualizar perfil:', updateError);
          } else {
            console.log('✅ Perfil atualizado:', email);
          }
        }
      } else {
        console.log('✅ Perfil criado:', email);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso. Você já pode fazer login!',
      user: {
        id: data.user?.id,
        name: name,
        email: email,
        createdAt: data.user?.created_at,
        emailConfirmed: true
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

module.exports = router;