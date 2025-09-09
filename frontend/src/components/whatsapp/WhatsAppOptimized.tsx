import React, { useState, useEffect } from 'react';
import { useWhatsAppOptimized } from '../../hooks/useWhatsAppOptimized';
import { ChatView } from './ChatView';
import { ConversationListOptimized } from './ConversationListOptimized';

const WhatsAppOptimized: React.FC = () => {
  const {
    status,
    conversations,
    selectedConversation,
    messages,
    loading,
    wsConnected,
    loadConversations,
    selectConversation,
    sendMessage,
    isConnected
  } = useWhatsAppOptimized();

  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar conversas por termo de busca
  const filteredConversations = conversations.filter(conv =>
    conv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Renderizar estado de não conectado
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            WhatsApp não conectado
          </h3>
          <p className="text-gray-500 mb-4">
            {!wsConnected ? 'Conectando ao servidor...' : 'Acesse "Gerenciar Instâncias" para conectar o WhatsApp'}
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>WebSocket: {wsConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar com lista de conversas */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            WhatsApp CRM
          </h2>
          
          {/* Status indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-green-600">WhatsApp Conectado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={wsConnected ? 'text-green-600' : 'text-red-600'}>
                WebSocket {wsConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          <ConversationListOptimized
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={selectConversation}
            loading={loading}
          />
        </div>
      </div>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatView
            contact={{
              id: selectedConversation.id,
              name: selectedConversation.id.replace('@c.us', ''),
              phone: selectedConversation.id.replace('@c.us', ''),
              isGroup: false
            }}
            messages={messages.map(msg => ({
              id: msg.id,
              text: msg.body, // Mapear body para text
              timestamp: new Date(msg.timestamp * 1000), // Converter timestamp para Date
              type: (msg.type as 'text' | 'image' | 'video' | 'audio' | 'document') || 'text', // Garantir tipo válido
              mediaUrl: msg.mediaInfo?.url,
              mediaName: msg.mediaInfo?.filename,
              mediaSize: msg.mediaInfo?.size,
              mediaDuration: undefined, // Não disponível
              mediaInfo: msg.mediaInfo,
              status: (msg.status as 'sent' | 'delivered' | 'read' | 'failed' | 'received') || 'received', // Garantir status válido
              isFromMe: msg.isFromMe
            }))}
            loading={loading}
            onSendMessage={(message: string) => sendMessage(selectedConversation.id, message)}
            onSendMedia={() => {}} // Placeholder - não implementado na versão otimizada
            onBackToConversations={() => {}} // Placeholder - não necessário na versão otimizada
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppOptimized;
