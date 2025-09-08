import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
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
  // const { user, updateUser } = useAuth();
  const user = { id: '1', name: 'Usuário', email: 'usuario@exemplo.com', createdAt: new Date().toISOString() };
  const updateUser = (data: any) => console.log('Update user:', data);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const handleEdit = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: user?.name || '',
      email: user?.email || ''
    });
  };

  const handleSave = async () => {
    if (!editData.name.trim() || !editData.email.trim()) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      setIsSaving(true);
      toast.loading('Salvando alterações...');
      
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.dismiss();
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
      
      // Atualizar dados do usuário
      await updateUser(editData);
      
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

  if (!user) {
    return (
      <div className="text-center py-8">
        <Loader2 className="animate-spin h-8 w-8 text-gray-400 mx-auto" />
        <p className="text-gray-500 mt-2">Carregando perfil...</p>
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
              <span className="text-gray-900 dark:text-white">{user.name}</span>
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
              <span className="text-gray-900 dark:text-white">{user.email}</span>
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
              {new Date(user.createdAt).toLocaleDateString('pt-BR', {
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
              Ativa
            </span>
          </div>
        </div>

        {/* ID do usuário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ID do usuário
          </label>
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Smartphone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-900 dark:text-white font-mono text-sm">{user.id}</span>
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
