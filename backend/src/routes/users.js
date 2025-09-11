const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authSimple = require('../middleware/auth-simple');

// Aplicar middleware de autenticação em todas as rotas
router.use(authSimple);

// =====================================================
// ROTAS DE USUÁRIOS
// =====================================================

/**
 * GET /api/users/profile
 * Buscar perfil do usuário atual
 */
router.get('/profile', userController.getProfile);

/**
 * PUT /api/users/profile
 * Atualizar perfil do usuário
 */
router.put('/profile', userController.updateProfile);

/**
 * GET /api/users/stats
 * Buscar estatísticas do usuário
 */
router.get('/stats', userController.getUserStats);

// =====================================================
// ROTAS DE PROJETOS
// =====================================================

/**
 * POST /api/users/projects
 * Criar novo projeto
 */
router.post('/projects', userController.createProject);

/**
 * GET /api/users/projects
 * Buscar projetos do usuário
 */
router.get('/projects', userController.getUserProjects);

/**
 * GET /api/users/projects/:id
 * Buscar projeto por ID
 */
router.get('/projects/:id', userController.getProject);

/**
 * PUT /api/users/projects/:id
 * Atualizar projeto
 */
router.put('/projects/:id', userController.updateProject);

/**
 * GET /api/users/projects/:id/members
 * Buscar membros do projeto
 */
router.get('/projects/:id/members', userController.getProjectMembers);

// =====================================================
// ROTAS DE CONVITES
// =====================================================

/**
 * POST /api/users/projects/:id/invites
 * Enviar convite para projeto
 */
router.post('/projects/:id/invites', userController.sendInvite);

/**
 * GET /api/users/invites/received
 * Buscar convites recebidos
 */
router.get('/invites/received', userController.getReceivedInvites);

/**
 * GET /api/users/invites/sent
 * Buscar convites enviados
 */
router.get('/invites/sent', userController.getSentInvites);

/**
 * POST /api/users/invites/:id/approve
 * Aprovar convite
 */
router.post('/invites/:id/approve', userController.approveInvite);

/**
 * POST /api/users/invites/:id/reject
 * Rejeitar convite
 */
router.post('/invites/:id/reject', userController.rejectInvite);

// =====================================================
// ROTAS DE AUDITORIA
// =====================================================

/**
 * GET /api/users/audit-logs
 * Buscar logs de auditoria
 */
router.get('/audit-logs', userController.getAuditLogs);

module.exports = router;
