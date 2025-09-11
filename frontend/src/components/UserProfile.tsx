import React, { useState, useEffect } from 'react';
import { useUserProject } from '../contexts/UserProjectContext';
import { userAPI } from '../services/userProjectAPI';
import { toast } from 'react-hot-toast';
import PhoneInput from './PhoneInput';
import { 
  User, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Loader2,
  Shield,
  Smartphone
} from 'lucide-react';

const UserProfile: React.FC = () => {
  const { currentUser, isLoading, loadCurrentUser } = useUserProject();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Atualizar dados de edição quando currentUser mudar
  useEffect(() => {
    if (currentUser) {
      setEditData({
        name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }
  }, [currentUser]);

  const handleEdit = () => {
    if (currentUser) {
      setEditData({
        name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (currentUser) {
      setEditData({
        name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }
  };

  const handleSave = async () => {
    if (!editData.name.trim() || !editData.email.trim()) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      setIsSaving(true);
      toast.loading('Salvando alterações...');
      
      // Preparar dados para atualização
      const updateData = {
        full_name: editData.name.trim(),
        phone: editData.phone || undefined
      };

      // Chamar API para atualizar perfil
      const updatedUser = await userAPI.updateProfile(updateData);
      
      toast.dismiss();
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
      
      // Recarregar dados do usuário no contexto
      await loadCurrentUser();
      
    } catch (error) {
      toast.dismiss();
      toast.error('Erro ao salvar alterações. Tente novamente.');
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Mostrar loading se estiver carregando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando perfil...</span>
      </div>
    );
  }

  // Mostrar mensagem se não houver usuário
  if (!currentUser) {
    return (
      <div className="text-center p-8">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Nenhum usuário encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Perfil do Usuário</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie suas informações pessoais</p>
          </div>
        </div>
        
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
          >
            <Edit3 className="h-4 w-4" />
            <span>Editar</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors duration-200"
            >
              {isSaving ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
            
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors duration-200"
            >
              <X className="h-4 w-4" />
              <span>Cancelar</span>
            </button>
          </div>
        )}
      </div>

      {/* Informações do usuário */}
      <div className="space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome completo
          </label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-white"
              placeholder="Seu nome completo"
            />
          ) : (
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-900 dark:text-white">{currentUser.full_name}</span>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={editData.email}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-white"
              placeholder="seu@email.com"
            />
          ) : (
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-900 dark:text-white">{currentUser.email}</span>
            </div>
          )}
        </div>

        {/* Data de criação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Membro desde
          </label>
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-900 dark:text-white">
              {new Date(currentUser.created_at).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Status da conta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status da conta
          </label>
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              {currentUser.is_active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefone
          </label>
          {isEditing ? (
            <PhoneInput
              value={editData.phone}
              onChange={(value) => setEditData(prev => ({ ...prev, phone: value }))}
              placeholder="+55 11 99999-9999"
              className="block w-full"
            />
          ) : (
            <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Smartphone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-900 dark:text-white">
                {currentUser.phone ? 
                  currentUser.phone.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 $2 $3-$4') : 
                  'Não informado'
                }
              </span>
            </div>
          )}
        </div>

        {/* ID do usuário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ID do usuário
          </label>
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Smartphone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-900 dark:text-white font-mono text-sm">{currentUser.id}</span>
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            💡 Dica de segurança
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Para alterar sua senha, use a opção "Esqueci minha senha" na página de login. 
            Isso garante que apenas você tenha acesso à sua conta.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
