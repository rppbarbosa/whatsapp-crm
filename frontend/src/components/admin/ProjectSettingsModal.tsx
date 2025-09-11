import React, { useState } from 'react';
import {
  X,
  Settings,
  Users,
  Shield,
  Save,
  AlertCircle
} from 'lucide-react';
import { Project } from '../../services/userProjectAPI';
import { toast } from 'react-hot-toast';

interface ProjectSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
  allProjects: Project[];
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  allProjects
}) => {
  const [settings, setSettings] = useState({
    id: project.id,
    name: project.name,
    description: project.description,
    allowInvites: project.settings.allowInvites,
    maxMembers: project.settings.maxMembers
  });

  const [isValidatingId, setIsValidatingId] = useState(false);
  const [idError, setIdError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const validateProjectId = async (newId: string) => {
    if (newId === project.id) {
      setIdError('');
      return true;
    }

    if (!newId.trim()) {
      setIdError('ID do projeto é obrigatório');
      return false;
    }

    if (newId.length < 3) {
      setIdError('ID deve ter pelo menos 3 caracteres');
      return false;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(newId)) {
      setIdError('ID deve conter apenas letras, números, hífens e underscores');
      return false;
    }

    setIsValidatingId(true);
    
    // Simular verificação no banco de dados
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const idExists = allProjects.some(p => p.id === newId && p.id !== project.id);
    
    setIsValidatingId(false);
    
    if (idExists) {
      setIdError('Este ID já está sendo usado por outro projeto');
      return false;
    }
    
    setIdError('');
    return true;
  };

  const handleIdChange = async (newId: string) => {
    setSettings(prev => ({ ...prev, id: newId }));
    
    if (newId !== project.id) {
      const isValid = await validateProjectId(newId);
      if (!isValid) {
        return;
      }
    }
  };

  const handleSave = async () => {
    // Validar ID antes de salvar
    const isIdValid = await validateProjectId(settings.id);
    if (!isIdValid) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    setIsLoading(true);
    
    // Simular delay de salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedProject: Project = {
      ...project,
      id: settings.id,
      name: settings.name,
      description: settings.description,
      settings: {
        allowInvites: settings.allowInvites,
        maxMembers: settings.maxMembers
      }
    };
    
    onSave(updatedProject);
    setIsLoading(false);
    toast.success('Configurações salvas com sucesso!');
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Configurações do Projeto
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Gerencie as configurações e permissões do seu projeto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Informações Básicas</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID do Projeto
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.id}
                    onChange={(e) => handleIdChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      idError 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Digite o ID do projeto"
                  />
                  {isValidatingId && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {idError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{idError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use apenas letras, números, hífens e underscores. Mínimo 3 caracteres.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Máximo de Membros
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxMembers}
                  onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Projeto
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Digite o nome do projeto"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição do Projeto
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Descreva o propósito e objetivos do projeto"
              />
            </div>
          </div>

          {/* Configurações de Convites */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Configurações de Convites</span>
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="allowInvites"
                  checked={settings.allowInvites}
                  onChange={(e) => handleInputChange('allowInvites', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex-1">
                  <label htmlFor="allowInvites" className="text-sm font-medium text-gray-900 dark:text-white">
                    Permitir convites de novos membros
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Quando ativado, outros usuários podem solicitar para participar do seu projeto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso sobre Limitação */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Limitação de Projetos
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Cada usuário pode participar de apenas um projeto por vez. Se um usuário for aprovado em um novo projeto, 
                  ele será automaticamente removido do projeto anterior.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !settings.name.trim() || !settings.id.trim() || !!idError || isValidatingId}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;
