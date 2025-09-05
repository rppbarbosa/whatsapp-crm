import React from 'react';
import LeadCard, { Lead } from './LeadCard';

interface Column {
  id: string;
  title: string;
  leads: Lead[];
  color: string;
  icon: React.ComponentType<any>;
}

interface PipelineContainerProps {
  columns: Column[];
  leads: Lead[];
  filteredLeads: Lead[];
  onMoveLead: (lead: Lead) => void;
  onScheduleContact: (lead: Lead) => void;
  openMenuId: string | null;
  onMenuToggle: (leadId: string) => void;
  onCloseAllMenus: () => void;
  className?: string;
}

const PipelineContainer: React.FC<PipelineContainerProps> = ({ 
  columns, 
  leads, 
  filteredLeads,
  onMoveLead, 
  onScheduleContact,
  openMenuId, 
  onMenuToggle, 
  onCloseAllMenus,
  className = '' 
}) => {
  // Usar leads filtrados se houver busca, senão usar todos os leads
  const displayLeads = filteredLeads.length > 0 ? filteredLeads : leads;
  
  // Organizar leads filtrados nas colunas
  const columnsWithFilteredLeads = columns.map(column => ({
    ...column,
    leads: displayLeads.filter(lead => lead.status === column.id)
  }));

  return (
    <div className={`max-w-full mx-auto ${className}`} onClick={onCloseAllMenus}>
      {/* Container das colunas com alinhamento perfeito */}
      <div className="relative">
        {/* Linha de fundo para alinhamento visual */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-20 rounded-full"></div>
        
        {/* Grid responsivo das colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mt-2">
          {columnsWithFilteredLeads.map((column) => (
            <div key={column.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px] flex flex-col">
              {/* Header da Coluna */}
              <div className={`${column.color} rounded-t-xl p-4 text-white flex-shrink-0`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <column.icon className="w-5 h-5" />
                    <h3 className="font-semibold text-sm lg:text-base truncate">{column.title}</h3>
                  </div>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                    {column.leads.length}
                  </span>
                </div>
              </div>

              {/* Lista de Leads */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  {column.leads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex-1 flex items-center justify-center">
                      <p className="text-sm">
                        {displayLeads.length === 0 && leads.length > 0 
                          ? 'Nenhum lead encontrado' 
                          : 'Nenhum lead'}
                      </p>
                    </div>
                  ) : (
                    column.leads.map((lead) => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        onMove={onMoveLead}
                        onSchedule={onScheduleContact}
                        isMenuOpen={openMenuId === lead.id}
                        onMenuToggle={() => onMenuToggle(lead.id)}
                      />
                    ))
                  )}
                </div>
                
                {/* Espaçador para manter altura consistente */}
                <div className="flex-1 min-h-[100px]"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PipelineContainer;
