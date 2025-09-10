import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lead } from '../components/pipeline/LeadCard';

interface LeadContextType {
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'tasks'>) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  deleteLead: (leadId: string) => void;
  getLeadById: (leadId: string) => Lead | undefined;
  getLeadsByStatus: (status: Lead['status']) => Lead[];
  getLeadsByPriority: (priority: Lead['priority']) => Lead[];
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};

interface LeadProviderProps {
  children: ReactNode;
}

export const LeadProvider: React.FC<LeadProviderProps> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);

  // Carregar leads do localStorage na inicialização
  useEffect(() => {
    const savedLeads = localStorage.getItem('whatsapp-crm-leads');
    if (savedLeads) {
      try {
        const parsedLeads = JSON.parse(savedLeads).map((lead: any) => ({
          ...lead,
          tasks: lead.tasks || []
        }));
        setLeads(parsedLeads);
      } catch (error) {
        console.error('Erro ao carregar leads do localStorage:', error);
      }
    }
  }, []);

  // Salvar leads no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('whatsapp-crm-leads', JSON.stringify(leads));
  }, [leads]);

  const addLead = (leadData: Omit<Lead, 'id' | 'tasks'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tasks: []
    };
    setLeads(prev => [...prev, newLead]);
    return newLead;
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, ...updates }
        : lead
    ));
  };

  const deleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  };

  const getLeadById = (leadId: string) => {
    return leads.find(lead => lead.id === leadId);
  };

  const getLeadsByStatus = (status: Lead['status']) => {
    return leads.filter(lead => lead.status === status);
  };

  const getLeadsByPriority = (priority: Lead['priority']) => {
    return leads.filter(lead => lead.priority === priority);
  };

  const value: LeadContextType = {
    leads,
    addLead,
    updateLead,
    deleteLead,
    getLeadById,
    getLeadsByStatus,
    getLeadsByPriority,
  };

  return (
    <LeadContext.Provider value={value}>
      {children}
    </LeadContext.Provider>
  );
};
