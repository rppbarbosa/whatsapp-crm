import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Search,
  User,
  Phone,
  Mail,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  X,
  Calendar
} from 'lucide-react';
import { Lead } from '../components/pipeline/LeadCard';
import PipelineContainer from '../components/pipeline/PipelineContainer';
import ScheduleContactModal from '../components/pipeline/ScheduleContactModal';
// Scheduled contacts foi removido
import NewLeadModal from '../components/leads/NewLeadModal';
import UnifiedTaskModal from '../components/tasks/UnifiedTaskModal';
import { useTasks } from '../contexts/TaskContext';
import { leadsService, LeadStats } from '../services/leadsService';

interface Column {
  id: string;
  title: string;
  leads: Lead[];
  color: string;
  icon: React.ComponentType<any>;
}

const PipelineVendas: React.FC = () => {
  const { addTask } = useTasks();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do banco
  useEffect(() => {
    loadLeads();
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLeads = async () => {
    try {
      setLoading(true);
      const apiLeads = await leadsService.getLeads();
      
      // Converter leads da API para o formato do frontend
      const convertedLeads: Lead[] = apiLeads.map(apiLead => ({
        id: apiLead.id,
        name: apiLead.name,
        company: apiLead.company || '',
        phone: apiLead.phone || '',
        email: apiLead.email || '',
        value: 0, // Valor não está no schema atual
        priority: mapApiPriorityToFrontend(apiLead.priority),
        nextContact: new Date(apiLead.created_at).toLocaleDateString('pt-BR'),
        status: mapApiStatusToFrontend(apiLead.status) as 'prospecto' | 'contato' | 'proposta' | 'negociacao' | 'fechado' | 'perdido',
        isOverdue: false, // Calcular baseado na data
        tasks: []
      }));
      
      setLeads(convertedLeads);
    } catch (err) {
      setError('Erro ao carregar leads');
      console.error('Erro ao carregar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await leadsService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const mapApiStatusToFrontend = (apiStatus: string): 'prospecto' | 'contato' | 'proposta' | 'negociacao' | 'fechado' | 'perdido' => {
    const statusMap: Record<string, string> = {
      'lead-bruto': 'prospecto',
      'contato-realizado': 'contato',
      'qualificado': 'proposta',
      'proposta-enviada': 'proposta',
      'follow-up': 'negociacao',
      'fechado-ganho': 'fechado',
      'fechado-perdido': 'perdido'
    };
    return (statusMap[apiStatus] as 'prospecto' | 'contato' | 'proposta' | 'negociacao' | 'fechado' | 'perdido') || 'prospecto';
  };

  const mapApiPriorityToFrontend = (apiPriority: string): 'baixa' | 'media' | 'alta' => {
    const priorityMap: Record<string, string> = {
      'low': 'baixa',
      'medium': 'media',
      'high': 'alta',
      'urgent': 'alta'
    };
    return (priorityMap[apiPriority] as 'baixa' | 'media' | 'alta') || 'media';
  };

  const [columns] = useState<Column[]>([
    {
      id: 'prospecto',
      title: 'Prospecto',
      leads: [],
      color: 'bg-blue-500',
      icon: User
    },
    {
      id: 'contato',
      title: 'Contato',
      leads: [],
      color: 'bg-yellow-500',
      icon: Phone
    },
    {
      id: 'proposta',
      title: 'Proposta',
      leads: [],
      color: 'bg-purple-500',
      icon: Mail
    },
    {
      id: 'negociacao',
      title: 'Negociação',
      color: 'bg-orange-500',
      icon: TrendingUp,
      leads: []
    },
    {
      id: 'fechado',
      title: 'Fechado',
      leads: [],
      color: 'bg-green-500',
      icon: CheckCircle
    },
    {
      id: 'perdido',
      title: 'Perdido',
      leads: [],
      color: 'bg-red-500',
      icon: XCircle
    }
  ]);

  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  // const [targetColumn, setTargetColumn] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('todas');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [scheduledContacts, setScheduledContacts] = useState<any[]>([]);

  // Filtrar leads baseado na busca e prioridade
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesPriority = priorityFilter === 'todas' || lead.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  // Calcular colunas com leads filtrados usando useMemo para evitar loops
  const columnsWithLeads = React.useMemo(() => {
    return columns.map(column => ({
      ...column,
      leads: filteredLeads.filter(lead => lead.status === column.id)
    }));
  }, [filteredLeads, columns]);

  // Função para abrir modal de movimentação
  const handleMoveLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowMoveModal(true);
    setOpenMenuId(null); // Fechar menu
  };

  // Função para confirmar movimentação e abrir modal de tarefa
  const handleConfirmMove = (newStatus: string) => {
    // setTargetColumn(newStatus); // Removido - não está sendo usado
    setShowMoveModal(false);
    setShowTaskModal(true);
  };



  // Função para adicionar novo lead
  const handleAddLead = (newLead: Omit<Lead, 'id' | 'tasks'>) => {
    const lead: Lead = {
      ...newLead,
      id: Date.now().toString(),
      status: 'prospecto',
      tasks: []
    };
    setLeads(prev => [...prev, lead]);
    setShowNewLeadModal(false);
  };

  // Função para controlar abertura/fechamento de menus
  const handleMenuToggle = (leadId: string) => {
    if (openMenuId === leadId) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(leadId);
    }
  };

  // Função para fechar todos os menus
  const closeAllMenus = () => {
    setOpenMenuId(null);
  };

  // Função para abrir modal de agendamento
  const handleScheduleContact = (lead: Lead) => {
    setSelectedLead(lead);
    setShowScheduleModal(true);
    setOpenMenuId(null); // Fechar menu
  };

  // Função para salvar agendamento
  const handleSaveSchedule = (scheduleData: any) => {
    if (selectedLead) {
      const newSchedule = {
        id: Date.now().toString(),
        leadId: selectedLead.id,
        leadName: selectedLead.name,
        leadCompany: selectedLead.company,
        ...scheduleData,
        createdAt: new Date().toISOString()
      };

      setScheduledContacts(prev => [...prev, newSchedule]);
      
      // Atualizar o nextContact do lead
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === selectedLead.id 
            ? { ...lead, nextContact: scheduleData.date }
            : lead
        )
      );

      setShowScheduleModal(false);
      setSelectedLead(null);
    }
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setPriorityFilter('todas');
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm !== '' || priorityFilter !== 'todas';

  // Calcular métricas
  const totalLeads = stats?.total || leads.length;
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const closedValue = leads.filter(lead => lead.status === 'fechado').reduce((sum, lead) => sum + lead.value, 0);
  const conversionRate = totalLeads > 0 ? (leads.filter(lead => lead.status === 'fechado').length / totalLeads) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-500 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <XCircle className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadLeads}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-500" onClick={closeAllMenus}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pipeline de Vendas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seus leads e acompanhe o progresso das vendas
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewLeadModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Lead
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Leads
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalLeads}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valor Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  R$ {totalValue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Fechados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  R$ {closedValue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taxa Conversão
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar leads por nome, empresa ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="todas">Todas as Prioridades</option>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar Filtros
                </button>
              )}
              
              <button className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
              </button>
            </div>
          </div>

          {/* Indicador de resultados da busca */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {filteredLeads.length} de {leads.length} leads encontrados
                </span>
                {searchTerm && (
                  <span className="text-gray-500 dark:text-gray-500">
                    Buscando por: "{searchTerm}"
                  </span>
                )}
                {priorityFilter !== 'todas' && (
                  <span className="text-gray-500 dark:text-gray-500">
                    Prioridade: {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="px-6 py-4 pb-8">
        <PipelineContainer
          columns={columnsWithLeads}
          leads={leads}
          filteredLeads={filteredLeads}
          onMoveLead={handleMoveLead}
          onScheduleContact={handleScheduleContact}
          openMenuId={openMenuId}
          onMenuToggle={handleMenuToggle}
          onCloseAllMenus={closeAllMenus}
        />
      </div>

      {/* Modal Novo Lead */}
      <NewLeadModal
        isOpen={showNewLeadModal}
        onClose={() => setShowNewLeadModal(false)}
        onAdd={handleAddLead}
      />

      {/* Modal de Movimentação */}
      {showMoveModal && selectedLead && (
        <MoveLeadModal
          lead={selectedLead}
          columns={columnsWithLeads}
          onConfirm={handleConfirmMove}
          onClose={() => setShowMoveModal(false)}
        />
      )}

      {/* Modal de Agendamento */}
      {showScheduleModal && selectedLead && (
        <ScheduleContactModal
          lead={selectedLead}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleSaveSchedule}
        />
      )}

      {/* Modal de Tarefa Unificado */}
      <UnifiedTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={(taskData) => {
          addTask(taskData);
          setShowTaskModal(false);
        }}
        leadId={selectedLead?.id}
        leadName={selectedLead?.name}
        leads={leads.map(lead => ({ id: lead.id, name: lead.name, phone: lead.phone, email: lead.email }))}
        assignees={[
          { id: '1', name: 'Ana Costa' },
          { id: '2', name: 'Pedro Lima' },
          { id: '3', name: 'Sofia Alves' },
        ]}
        mode="quick_create"
        title="Nova Tarefa - Negociação"
      />

      {/* Modal de Agendamentos removido */}
    </div>
  );
};

// Modal para movimentação de lead
interface MoveLeadModalProps {
  lead: Lead;
  columns: Column[];
  onConfirm: (newStatus: string) => void;
  onClose: () => void;
}

const MoveLeadModal: React.FC<MoveLeadModalProps> = ({ lead, columns, onConfirm, onClose }) => {
  const availableColumns = columns.filter(col => col.id !== lead.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mover Lead
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Mover <strong>{lead.name}</strong> para qual etapa do pipeline?
          </p>
          
          <div className="space-y-2">
            {availableColumns.map((column) => (
              <button
                key={column.id}
                onClick={() => onConfirm(column.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
              >
                <div className={`w-4 h-4 rounded-full ${column.color} flex-shrink-0`}></div>
                <span className="font-medium text-gray-900 dark:text-white truncate">{column.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PipelineVendas;