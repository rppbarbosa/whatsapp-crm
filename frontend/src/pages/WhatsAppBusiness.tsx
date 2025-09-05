import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Importar componentes individualizados
import { HamburgerButton } from '../components/whatsapp/HamburgerButton';
import { ResponsiveSidebar } from '../components/whatsapp/ResponsiveSidebar';
import { ChatViewWrapper } from '../components/whatsapp/ChatViewWrapper';
import { ChatEmptyState } from '../components/whatsapp/ChatEmptyState';

// Importar utilitário de conversão de dados
import { DataConverter } from '../components/whatsapp/DataConverter';

// Importar hook personalizado
import { useWhatsAppState } from '../hooks/useWhatsAppState';

export default function WhatsAppBusiness() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Usar hook personalizado para gerenciar estado
  const {
    contacts,
    selectedContact,
    messages,
    showChat,
    syncing,
    instanceConnected,
    syncWhatsAppData,
    handleContactSelect,
    handleBackToList,
    handleSendMessage,
    updateContact,
    removeContact
  } = useWhatsAppState();

  // Função para alternar o sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Efeito para ajustar o sidebar baseado no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Em telas grandes, sempre mostrar o sidebar
        setSidebarOpen(true);
      } else {
        // Em telas pequenas, fechar o sidebar por padrão
        setSidebarOpen(false);
      }
    };

    // Executar na montagem
    handleResize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers para os componentes
  const handleContactSelectFromList = (contact: any) => {
    // Encontrar o contato correspondente nos dados mockados
    const mockContact = contacts.find(c => c.id === contact.id);
    if (mockContact) {
      handleContactSelect(mockContact);
      // Fechar o sidebar em telas pequenas quando um contato for selecionado
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  const handleSendMessageFromChat = (message: string) => {
    handleSendMessage(message);
  };

  const handleSendMediaFromChat = (file: File, type: 'image' | 'video' | 'audio' | 'document', message?: string) => {
    // Simular envio de mídia
    console.log('Enviando mídia:', { file, type, message });
    // Aqui você pode implementar a lógica real de envio de mídia
  };

  const handleContactUpdate = (contactId: string, updates: any) => {
    // Converter as atualizações para o formato dos dados mockados
    const convertedUpdates = DataConverter.convertContactUpdates(updates);
    
    // Atualizar o contato usando a função do hook
    updateContact(contactId, convertedUpdates);
  };

  const handleNewChat = () => {
    // Implementar nova conversa se necessário
    console.log('Nova conversa');
    toast.success('Funcionalidade de nova conversa em desenvolvimento!');
  };

  // Se está mostrando o chat, renderizar apenas o ChatViewWrapper
  if (showChat && selectedContact) {
    return (
      <ChatViewWrapper
        contact={selectedContact}
        messages={messages}
        onSendMessage={handleSendMessageFromChat}
        onSendMedia={handleSendMediaFromChat}
        onBackToConversations={handleBackToList}
        onContactUpdate={handleContactUpdate}
      />
    );
  }

  // Renderizar a lista de conversas
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Botão Hamburger - Visível apenas quando não está no chat e sidebar fechado */}
      {!showChat && !sidebarOpen && (
        <HamburgerButton onClick={toggleSidebar} />
      )}

      {/* Sidebar Responsivo */}
      <ResponsiveSidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        contacts={DataConverter.convertContactsForConversationList(contacts)}
        selectedContact={null}
        onContactSelect={handleContactSelectFromList}
        onNewChat={handleNewChat}
        onContactUpdate={handleContactUpdate}
        onContactDelete={removeContact}
        loading={false}
        syncing={syncing}
        onSync={syncWhatsAppData}
        instanceConnected={instanceConnected}
      />

      {/* Chat Area Empty State */}
      <ChatEmptyState />
    </div>
  );
} 