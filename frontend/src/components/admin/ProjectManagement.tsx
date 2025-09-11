import React, { useState } from 'react';
import {
  Trash2,
  Building,
  UserPlus,
  Check,
  X,
  Copy,
  Settings,
  Bell
} from 'lucide-react';
import { useUserProject } from '../../contexts/UserProjectContext';
import { Project } from '../../services/userProjectAPI';
import { toast } from 'react-hot-toast';
import ProjectSettingsModal from './ProjectSettingsModal';

const ProjectManagement: React.FC = () => {
  const {
    users,
    projects,
    invites,
    currentUser,
    isLoading,
    error,
    sendInvite,
    approveInvite,
    rejectInvite,
    removeProjectMember,
    updateProject,
    clearError
  } = useUserProject();

  const [activeTab, setActiveTab] = useState<'my-project' | 'join-project'>('my-project');
  const [projectIdInput, setProjectIdInput] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Dados derivados
  const currentProject = projects.find(p => p.id === currentUser?.project_id);
  const projectMembers = users.filter(u => u.project_id === currentProject?.id);
  const pendingInvites = invites.filter(invite => 
    invite.project_id === currentProject?.id && invite.status === 'pending'
  );

  // Debug: mostrar informações para diagnóstico
  console.log('🔍 Debug ProjectManagement:', {
    currentUser: currentUser,
    currentUserProjectId: currentUser?.project_id,
    projects: projects,
    currentProject: currentProject,
    projectsCount: projects.length
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Recusado';
      default: return 'Desconhecido';
    }
  };


  const handleApproveInvite = async (inviteId: string) => {
    try {
      await approveInvite(inviteId);
      toast.success('Convite aprovado! Usuário adicionado ao projeto.');
    } catch (error) {
      toast.error('Erro ao aprovar convite');
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await rejectInvite(inviteId);
      toast.success('Convite recusado!');
    } catch (error) {
      toast.error('Erro ao recusar convite');
    }
  };

  const handleJoinProject = async () => {
    if (!projectIdInput.trim()) {
      toast.error('Digite o ID do projeto');
      return;
    }
    
    const project = projects.find(p => p.id === projectIdInput);
    if (!project) {
      toast.error('Projeto não encontrado');
      return;
    }

    // Verificar se o usuário já está em um projeto
    if (currentUser?.project_id && currentUser.project_id !== projectIdInput) {
      toast.error('Você já está participando de um projeto. Deixe o projeto atual antes de participar de outro.');
      return;
    }

    // Verificar se já existe convite pendente para este projeto
    const existingInvite = invites.find(inv => 
      inv.inviter_id === currentUser?.id && 
      inv.project_id === projectIdInput && 
      inv.status === 'pending'
    );
    
    if (existingInvite) {
      toast.error('Você já enviou um convite para este projeto. Aguarde a resposta.');
      return;
    }

    try {
      await sendInvite(projectIdInput, {
        invitee_email: currentUser?.email || '',
        message: `Gostaria de participar do projeto "${project.name}"`
      });
      setProjectIdInput('');
      toast.success('Convite enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar convite');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja remover este membro?')) {
      try {
        if (currentProject) {
          await removeProjectMember(currentProject.id, userId);
          toast.success('Membro removido com sucesso!');
        }
      } catch (error) {
        toast.error('Erro ao remover membro');
      }
    }
  };

  const handleCopyProjectId = () => {
    if (currentProject) {
      navigator.clipboard.writeText(currentProject.id);
      toast.success('ID do projeto copiado!');
    }
  };

  const handleSaveProjectSettings = async (updatedProject: Project) => {
    try {
      await updateProject(updatedProject.id, updatedProject);
      toast.success('Configurações do projeto atualizadas!');
    } catch (error) {
      toast.error('Erro ao atualizar configurações do projeto');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mostrar loading se estiver carregando
  if (isLoading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados do projeto...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Erro ao carregar dados</h3>
            <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se não há projeto atual, mostrar mensagem
  if (!currentProject) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="text-center">
          <Building className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Nenhum projeto encontrado
          </h3>
          <p className="text-yellow-600 dark:text-yellow-400">
            Você não está associado a nenhum projeto no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gerenciamento de Projetos
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seu projeto e participe de outros
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('my-project')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'my-project'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Meu Projeto</span>
          </button>
          <button
            onClick={() => setActiveTab('join-project')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'join-project'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Participar de Projeto</span>
          </button>
        </div>
      </div>

      {/* Meu Projeto */}
      {activeTab === 'my-project' && (
        <div className="space-y-6">
          {/* Informações do Projeto */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: currentProject.color + '20' }}
                >
                  <Building 
                    className="w-8 h-8" 
                    style={{ color: currentProject.color }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentProject.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {currentProject.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Criado em {formatDate(currentProject.created_at)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">ID:</span>
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {currentProject.id}
                      </code>
                      <button
                        onClick={handleCopyProjectId}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Copiar ID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configurações</span>
                </button>
              </div>
            </div>
          </div>

          {/* Convites Pendentes */}
          {pendingInvites.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Convites Pendentes
                </h3>
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    {pendingInvites.length} pendente(s)
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {invite.inviter_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invite.inviter_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {invite.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(invite.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveInvite(invite.id)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Aprovar"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRejectInvite(invite.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Recusar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Membros do Projeto */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Membros do Projeto
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {projectMembers.length} membro(s)
              </span>
            </div>
            
            <div className="space-y-3">
              {projectMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-green-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {member.full_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.full_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.email}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.role === 'owner'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {member.role === 'owner' ? 'Proprietário' : 'Membro'}
                      </span>
                    </div>
                  </div>
                  
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remover membro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Participar de Projeto */}
      {activeTab === 'join-project' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Participar de um Projeto
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Digite o ID do projeto que você deseja participar. Um convite será enviado para o proprietário do projeto.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID do Projeto
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Digite o ID do projeto..."
                    value={projectIdInput}
                    onChange={(e) => setProjectIdInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleJoinProject}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Enviar Convite</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Meus Convites */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Meus Convites
            </h3>
            
            <div className="space-y-3">
              {invites.filter(invite => invite.inviter_id === currentUser?.id).map((invite) => {
                const project = projects.find(p => p.id === invite.project_id);
                return (
                  <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: project?.color + '20' }}
                      >
                        <Building 
                          className="w-5 h-5" 
                          style={{ color: project?.color }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {project?.name || 'Projeto não encontrado'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {invite.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Enviado em {formatDate(invite.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invite.status)}`}>
                      {getStatusLabel(invite.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações */}
      <ProjectSettingsModal
        project={currentProject}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSaveProjectSettings}
        allProjects={projects}
      />
    </div>
  );
};

export default ProjectManagement;