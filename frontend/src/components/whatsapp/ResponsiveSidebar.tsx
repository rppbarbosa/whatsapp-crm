import React from 'react';
import { ConversationList } from './ConversationList';
import { SidebarHeader } from './SidebarHeader';

interface ResponsiveSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  contacts: any[];
  selectedContact: any;
  onContactSelect: (contact: any) => void;
  onNewChat: () => void;
  onContactUpdate: (contactId: string, updates: any) => void;
  onContactDelete: (contactId: string) => void;
  loading?: boolean;
  syncing?: boolean;
  onSync: () => void;
  instanceConnected?: boolean;
  className?: string;
}

export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  isOpen,
  onToggle,
  contacts,
  selectedContact,
  onContactSelect,
  onNewChat,
  onContactUpdate,
  onContactDelete,
  loading = false,
  syncing = false,
  onSync,
  instanceConnected = false,
  className = ''
}) => {
  return (
    <div className={`${isOpen ? 'w-80 lg:w-96' : 'w-0'} bg-white border-r border-gray-200 flex flex-col shadow-sm relative z-10 transition-all duration-300 ease-in-out overflow-hidden ${className}`}>
      {/* Header do Sidebar com botão de fechar em telas pequenas */}
      <SidebarHeader
        title="Conversas"
        onClose={onToggle}
        showCloseButton={true}
      />
      
      {/* Indicador de Status da Conexão */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className={`flex items-center space-x-2 text-sm ${
          instanceConnected ? 'text-green-600' : 'text-red-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            instanceConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="font-medium">
            {instanceConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
          </span>
        </div>
        {!instanceConnected && (
          <p className="text-xs text-gray-500 mt-1">
            Conecte sua instância para ver conversas reais
          </p>
        )}
      </div>
      
      {/* Lista de Conversas */}
      <ConversationList
        contacts={contacts}
        selectedContact={selectedContact}
        onContactSelect={onContactSelect}
        onNewChat={onNewChat}
        loading={loading}
        syncing={syncing}
        onSync={onSync || undefined}
        onContactUpdate={onContactUpdate}
        onContactDelete={onContactDelete}
      />
    </div>
  );
};
