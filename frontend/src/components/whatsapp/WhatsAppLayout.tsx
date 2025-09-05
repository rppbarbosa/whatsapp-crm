import React, { useState } from 'react';
import { 
  Menu,
  Plus,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { ProfileEditModal } from './ProfileEditModal';

interface WhatsAppLayoutProps {
  children: React.ReactNode;
  activeFilter?: string;
  instance?: {
    userInfo?: {
      name: string;
      phone: string;
      avatarUrl?: string;
    };
  };
  onNewChat?: () => void;
  showChat?: boolean;
  onBackToConversations?: () => void;
}

export const WhatsAppLayout: React.FC<WhatsAppLayoutProps> = ({
  children,
  activeFilter = 'all',
  instance,
  onNewChat,
  showChat = false,
  onBackToConversations
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleProfileSave = (userInfo: { name: string; phone: string; avatarUrl?: string }) => {
    // Aqui você pode implementar a lógica para salvar as alterações
    console.log('Perfil atualizado:', userInfo);
    // Em produção, isso seria uma chamada para a API
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
      {/* Botão de Menu Mobile - Abre o sidebar principal */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-950 dark:to-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
        title="Menu principal"
      >
        <Menu className="w-6 h-6" />
        {/* Indicador sutil */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full opacity-75"></div>
      </button>

      {/* Botão de Voltar - Visível apenas quando estiver no chat no mobile */}
      {showChat && onBackToConversations && (
        <button
          onClick={onBackToConversations}
          className="lg:hidden fixed top-4 left-20 z-50 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
          title="Voltar para conversas"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      {/* Sidebar Mobile - Visível apenas no mobile */}
      <div className={`lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-30 w-[85vw] sm:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg transition-all duration-500`}>
        {/* Header do Sidebar */}
        <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
          {/* Botão Fechar Mobile */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Menu
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-lg font-bold">×</span>
            </button>
          </div>
          
          {/* Informações do Usuário Logado */}
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="relative group flex-shrink-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden group-hover:shadow-xl transition-all duration-300">
                {instance?.userInfo?.avatarUrl ? (
                  <img 
                    src={instance.userInfo.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm sm:text-lg font-bold">
                    {instance?.userInfo?.name ? instance.userInfo.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              {/* Overlay indicando que é clicável */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-300 flex items-center justify-center">
                <Settings className="w-0 h-0 group-hover:w-4 group-hover:h-4 sm:group-hover:w-5 sm:group-hover:h-5 text-white transition-all duration-300" />
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                {instance?.userInfo?.name || 'Usuário WhatsApp'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {instance?.userInfo?.phone || '+55 11 99999-9999'}
              </p>
            </div>
          </div>

          {/* Botão Nova Conversa */}
          <button
            onClick={onNewChat}
            className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="text-sm sm:text-base font-semibold">Nova Conversa</span>
          </button>
        </div>

        {/* Navegação do Sidebar */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 sm:p-4">
          {/* Título da Seção */}
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Navegação
            </h3>
          </div>
          
          <nav className="space-y-2">
            {/* WhatsApp Business */}
            <a href="/whatsapp" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-sm font-bold">W</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">WhatsApp Business</span>
            </a>
            
            {/* Dashboard */}
            <a href="/dashboard" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">D</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Dashboard</span>
            </a>
            
            {/* Pipeline */}
            <a href="/pipeline-vendas" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">P</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Pipeline</span>
            </a>
            
            {/* Instâncias */}
            <a href="/gerenciar-instancias" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">I</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Instâncias</span>
            </a>
            
            {/* Relatórios */}
            <a href="/relatorios" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">R</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Relatórios</span>
            </a>
            
            {/* Configurações */}
            <a href="/configuracoes" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">S</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Configurações</span>
            </a>
          </nav>
        </div>
      </div>

      {/* Área Principal - Lista de Conversas ou Chat */}
      <div className="flex-1 bg-white dark:bg-gray-900 shadow-inner transition-all duration-500 min-w-0 overflow-hidden">
        {children}
      </div>

      {/* Overlay para Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Modal de Edição de Perfil */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userInfo={instance?.userInfo || { name: 'Usuário WhatsApp', phone: '+55 11 99999-9999' }}
        onSave={handleProfileSave}
      />
    </div>
  );
};
