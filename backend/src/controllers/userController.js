const userService = require('../services/userService');

class UserController {
  // =====================================================
  // ROTAS DE USUÁRIOS
  // =====================================================

  /**
   * GET /api/users/profile
   * Buscar perfil do usuário atual
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserById(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/users/profile
   * Atualizar perfil do usuário
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      // Campos permitidos para atualização
      const allowedFields = ['full_name', 'phone', 'avatar_url'];
      const filteredUpdates = {};
      
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const updatedUser = await userService.updateUserProfile(userId, filteredUpdates);

      // Log da ação
      await userService.logAuditAction(
        userId,
        'updated',
        'profile',
        userId,
        { fields: Object.keys(filteredUpdates) },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: updatedUser,
        message: 'Perfil atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/users/stats
   * Buscar estatísticas do usuário
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await userService.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // =====================================================
  // ROTAS DE PROJETOS
  // =====================================================

  /**
   * POST /api/projects
   * Criar novo projeto
   */
  async createProject(req, res) {
    try {
      const userId = req.user.id;
      const projectData = req.body;

      // Validar dados obrigatórios
      if (!projectData.name) {
        return res.status(400).json({
          success: false,
          message: 'Nome do projeto é obrigatório'
        });
      }

      const project = await userService.createProject(userId, projectData);

      // Log da ação
      await userService.logAuditAction(
        userId,
        'created',
        'project',
        project.id,
        { name: project.name },
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        data: project,
        message: 'Projeto criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/projects/:id
   * Buscar projeto por ID
   */
  async getProject(req, res) {
    try {
      const { id } = req.params;
      const project = await userService.getProjectById(id);
      
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/projects/:id
   * Atualizar projeto
   */
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Verificar se usuário é owner do projeto
      const project = await userService.getProjectById(id);
      if (project.owner_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Apenas o proprietário pode atualizar o projeto'
        });
      }

      const updatedProject = await userService.updateProject(id, updates);

      // Log da ação
      await userService.logAuditAction(
        userId,
        'updated',
        'project',
        id,
        { fields: Object.keys(updates) },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: updatedProject,
        message: 'Projeto atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/projects
   * Buscar projetos do usuário
   */
  async getUserProjects(req, res) {
    try {
      const userId = req.user.id;
      const projects = await userService.getUserProjects(userId);
      
      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/projects/:id/members
   * Buscar membros do projeto
   */
  async getProjectMembers(req, res) {
    try {
      const { id } = req.params;
      const members = await userService.getUsersByProject(id);
      
      res.json({
        success: true,
        data: members
      });
    } catch (error) {
      console.error('Erro ao buscar membros do projeto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // =====================================================
  // ROTAS DE CONVITES
  // =====================================================

  /**
   * POST /api/projects/:id/invites
   * Enviar convite para projeto
   */
  async sendInvite(req, res) {
    try {
      const { id: projectId } = req.params;
      const { toUserId, message } = req.body;
      const fromUserId = req.user.id;

      if (!toUserId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
      }

      const invite = await userService.sendProjectInvite(fromUserId, toUserId, projectId, message);

      // Log da ação
      await userService.logAuditAction(
        fromUserId,
        'created',
        'invite',
        invite.id,
        { projectId, toUserId },
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        data: invite,
        message: 'Convite enviado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * GET /api/invites/received
   * Buscar convites recebidos
   */
  async getReceivedInvites(req, res) {
    try {
      const userId = req.user.id;
      const invites = await userService.getReceivedInvites(userId);
      
      res.json({
        success: true,
        data: invites
      });
    } catch (error) {
      console.error('Erro ao buscar convites recebidos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/invites/sent
   * Buscar convites enviados
   */
  async getSentInvites(req, res) {
    try {
      const userId = req.user.id;
      const invites = await userService.getSentInvites(userId);
      
      res.json({
        success: true,
        data: invites
      });
    } catch (error) {
      console.error('Erro ao buscar convites enviados:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /api/invites/:id/approve
   * Aprovar convite
   */
  async approveInvite(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await userService.approveInvite(id);

      // Log da ação
      await userService.logAuditAction(
        userId,
        'approved',
        'invite',
        id,
        {},
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: result,
        message: 'Convite aprovado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao aprovar convite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/invites/:id/reject
   * Rejeitar convite
   */
  async rejectInvite(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await userService.rejectInvite(id);

      // Log da ação
      await userService.logAuditAction(
        userId,
        'rejected',
        'invite',
        id,
        {},
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: result,
        message: 'Convite rejeitado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // =====================================================
  // ROTAS DE AUDITORIA
  // =====================================================

  /**
   * GET /api/audit-logs
   * Buscar logs de auditoria
   */
  async getAuditLogs(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        action: req.query.action,
        entityType: req.query.entity_type,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        limit: req.query.limit ? parseInt(req.query.limit) : 50
      };

      const logs = await userService.getAuditLogs(userId, filters);
      
      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
