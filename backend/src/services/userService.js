const { supabase, supabaseAdmin } = require('./supabase');

class UserService {
  // =====================================================
  // OPERAÇÕES DE USUÁRIOS
  // =====================================================

  /**
   * Buscar usuário por ID
   */
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          projects:project_id (
            id,
            name,
            description,
            settings,
            color,
            created_at
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  /**
   * Buscar usuários por projeto
   */
  async getUsersByProject(projectId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuários do projeto:', error);
      throw error;
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Atualizar último login
   */
  async updateLastLogin(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas do usuário
   */
  async getUserStats(userId) {
    try {
      const { data: user } = await this.getUserById(userId);
      
      if (!user.project_id) {
        return {
          totalMembers: 0,
          pendingInvites: 0,
          projectName: null
        };
      }

      // Buscar estatísticas do projeto
      const { data: projectStats, error } = await supabase
        .from('project_stats')
        .select('*')
        .eq('id', user.project_id)
        .single();

      if (error) throw error;

      return {
        totalMembers: projectStats?.member_count || 0,
        pendingInvites: projectStats?.pending_invites || 0,
        projectName: projectStats?.name || user.projects?.name
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error);
      throw error;
    }
  }

  // =====================================================
  // OPERAÇÕES DE PROJETOS
  // =====================================================

  /**
   * Criar projeto
   */
  async createProject(ownerId, projectData) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          owner_id: ownerId,
          settings: projectData.settings || {
            allowInvites: true,
            maxMembers: 10
          },
          color: projectData.color || '#10B981'
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar usuário para ser owner do projeto
      await this.updateUserProfile(ownerId, {
        project_id: data.id,
        role: 'owner'
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }
  }

  /**
   * Buscar projeto por ID
   */
  async getProjectById(projectId) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:owner_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      throw error;
    }
  }

  /**
   * Atualizar projeto
   */
  async updateProject(projectId, updates) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }
  }

  /**
   * Buscar projetos do usuário
   */
  async getUserProjects(userId) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:owner_id (
            id,
            full_name,
            email
          )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar projetos do usuário:', error);
      throw error;
    }
  }

  // =====================================================
  // OPERAÇÕES DE CONVITES
  // =====================================================

  /**
   * Enviar convite para projeto
   */
  async sendProjectInvite(fromUserId, toUserId, projectId, message = '') {
    try {
      // Verificar se usuário já está em um projeto
      const { data: user } = await this.getUserById(toUserId);
      if (user.project_id) {
        throw new Error('Usuário já está em um projeto');
      }

      // Verificar se já existe convite pendente
      const { data: existingInvite } = await supabase
        .from('project_invites')
        .select('id')
        .eq('project_id', projectId)
        .eq('to_user_id', toUserId)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        throw new Error('Convite já enviado para este usuário');
      }

      const { data, error } = await supabase
        .from('project_invites')
        .insert({
          project_id: projectId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message: message,
          status: 'pending'
        })
        .select(`
          *,
          from_user:from_user_id (
            id,
            full_name,
            email
          ),
          to_user:to_user_id (
            id,
            full_name,
            email
          ),
          project:project_id (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      throw error;
    }
  }

  /**
   * Buscar convites recebidos
   */
  async getReceivedInvites(userId) {
    try {
      const { data, error } = await supabase
        .from('project_invites')
        .select(`
          *,
          from_user:from_user_id (
            id,
            full_name,
            email,
            avatar_url
          ),
          project:project_id (
            id,
            name,
            description,
            color
          )
        `)
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar convites recebidos:', error);
      throw error;
    }
  }

  /**
   * Buscar convites enviados
   */
  async getSentInvites(userId) {
    try {
      const { data, error } = await supabase
        .from('project_invites')
        .select(`
          *,
          to_user:to_user_id (
            id,
            full_name,
            email,
            avatar_url
          ),
          project:project_id (
            id,
            name,
            description
          )
        `)
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar convites enviados:', error);
      throw error;
    }
  }

  /**
   * Aprovar convite
   */
  async approveInvite(inviteId) {
    try {
      const { data, error } = await supabase
        .rpc('approve_project_invite', { p_invite_id: inviteId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao aprovar convite:', error);
      throw error;
    }
  }

  /**
   * Rejeitar convite
   */
  async rejectInvite(inviteId) {
    try {
      const { data, error } = await supabase
        .from('project_invites')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', inviteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      throw error;
    }
  }

  // =====================================================
  // OPERAÇÕES DE AUDITORIA
  // =====================================================

  /**
   * Registrar ação de auditoria
   */
  async logAuditAction(userId, action, entityType, entityId, details = {}, ipAddress = null, userAgent = null) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: action,
          entity_type: entityType,
          entity_id: entityId,
          details: details,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao registrar ação de auditoria:', error);
      throw error;
    }
  }

  /**
   * Buscar logs de auditoria
   */
  async getAuditLogs(userId, filters = {}) {
    try {
      let query = supabase
        .from('audit_logs_detailed')
        .select('*')
        .eq('user_id', userId);

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      query = query.order('timestamp', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
