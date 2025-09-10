import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WhatsAppContact } from '../components/whatsapp/ConversationList';

interface LeadModalContextType {
  isOpen: boolean;
  selectedContact: WhatsAppContact | null;
  openModal: (contact: WhatsAppContact) => void;
  closeModal: () => void;
}

const LeadModalContext = createContext<LeadModalContextType | undefined>(undefined);

export const useLeadModal = () => {
  const context = useContext(LeadModalContext);
  if (!context) {
    throw new Error('useLeadModal must be used within a LeadModalProvider');
  }
  return context;
};

interface LeadModalProviderProps {
  children: ReactNode;
}

export const LeadModalProvider: React.FC<LeadModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);

  const openModal = (contact: WhatsAppContact) => {
    console.log('🔥 LeadModalContext - Abrindo modal para:', contact);
    console.log('🔥 LeadModalContext - Estado antes:', { isOpen, selectedContact });
    setSelectedContact(contact);
    setIsOpen(true);
    console.log('🔥 LeadModalContext - Estado após setState');
  };

  const closeModal = () => {
    console.log('🔥 LeadModalContext - Fechando modal');
    setIsOpen(false);
    setSelectedContact(null);
  };

  const value: LeadModalContextType = {
    isOpen,
    selectedContact,
    openModal,
    closeModal,
  };

  return (
    <LeadModalContext.Provider value={value}>
      {children}
    </LeadModalContext.Provider>
  );
};
