import React, { useState } from 'react';
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
import { Lead, Task } from '../components/pipeline/LeadCard';
import PipelineContainer from '../components/pipeline/PipelineContainer';
import ScheduleContactModal from '../components/pipeline/ScheduleContactModal';
import ScheduledContactsList from '../components/pipeline/ScheduledContactsList';
import NewLeadModal from '../components/leads/NewLeadModal';

interface Column {
  id: string;
  title: string;
  leads: Lead[];
  color: string;
  icon: React.ComponentType<any>;
}

const PipelineVendas: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'João Silva',
      company: 'TechCorp Ltda',
      phone: '(11) 99999-9999',
      email: 'joao@techcorp.com',
      value: 15000,
      priority: 'alta',
      nextContact: '19/12/2024',
      status: 'prospecto',
      isOverdue: true,
      tasks: []
    },
    {
      id: '2',
      name: 'Maria Santos',
      company: 'Inovação Digital',
      phone: '(11) 88888-8888',
      email: 'maria@inovacao.com',
      value: 25000,
      priority: 'media',
      nextContact: '18/12/2024',
      status: 'contato',
      isOverdue: true,
      tasks: []
    },
    {
      id: '3',
      name: 'Carlos Oliveira',
      company: 'StartupXYZ',
      phone: '(11) 77777-7777',
      email: 'carlos@startup.com',
      value: 8000,
      priority: 'baixa',
      nextContact: '21/12/2024',
      status: 'proposta',
      isOverdue: true,
      tasks: []
    },
    {
      id: '4',
      name: 'Ana Costa',
      company: 'Empresa ABC',
      phone: '(11) 66666-6666',
      email: 'ana@abc.com',
      value: 35000,
      priority: 'alta',
      nextContact: '17/12/2024',
      status: 'negociacao',
      isOverdue: true,
      tasks: []
    },
    {
      id: '5',
      name: 'Pedro Lima',
      company: 'Corporação 123',
      phone: '(11) 55555-5555',
      email: 'pedro@corp123.com',
      value: 20000,
      priority: 'media',
      nextContact: '24/12/2024',
      status: 'fechado',
      isOverdue: true,
      tasks: []
    }
  ]);

  const [columns, setColumns] = useState<Column[]>([
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
  const [showScheduledContacts, setShowScheduledContacts] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('todas');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [scheduledContacts, setScheduledContacts] = useState<any[]>([]);

  // Organizar leads nas colunas baseado no status
  React.useEffect(() => {
    const updatedColumns = columns.map(column => ({
      ...column,
      leads: leads.filter(lead => lead.status === column.id)
    }));
    setColumns(updatedColumns);
  }, [leads]); // CORREÇÃO: Remover 'columns' das dependências para evitar loop infinito

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

  // Organizar leads filtrados nas colunas
  React.useEffect(() => {
    const updatedColumns = columns.map(column => ({
      ...column,
      leads: filteredLeads.filter(lead => lead.status === column.id)
    }));
    setColumns(updatedColumns);
  }, [filteredLeads]); // CORREÇÃO: Remover 'columns' das dependências para evitar loop infinito

  // Função para abrir modal de movimentação
  const handleMoveLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowMoveModal(true);
    setOpenMenuId(null); // Fechar menu
  };

  // Função para confirmar movimentação e abrir modal de tarefa
  const handleConfirmMove = (newStatus: string) => {
    setTargetColumn(newStatus);
    setShowMoveModal(false);
    setShowTaskModal(true);
  };

  // Função para salvar tarefa e mover o lead
  const handleSaveTask = (taskData: Omit<Task, 'id'>) => {
    if (selectedLead && targetColumn) {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString()
      };

      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === selectedLead.id 
            ? { 
                ...lead, 
                status: targetColumn as Lead['status'],
                tasks: [...(lead.tasks || []), newTask]
              }
            : lead
        )
      );

      setShowTaskModal(false);
      setSelectedLead(null);
      setTargetColumn('');
    }
  };

  // Função para cancelar movimentação
  const handleCancelMove = () => {
    setShowMoveModal(false);
    setShowTaskModal(false);
    setSelectedLead(null);
    setTargetColumn('');
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
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const closedValue = leads.filter(lead => lead.status === 'fechado').reduce((sum, lead) => sum + lead.value, 0);
  const conversionRate = totalLeads > 0 ? (leads.filter(lead => lead.status === 'fechado').length / totalLeads) * 100 : 0;

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
              onClick={() => setShowScheduledContacts(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendamentos ({scheduledContacts.filter(c => new Date(`${c.date}T${c.time}`) > new Date()).length})
            </button>
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
          columns={columns}
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
          columns={columns}
          onConfirm={handleConfirmMove}
          onClose={() => setShowMoveModal(false)}
        />
      )}

      {/* Modal de Tarefa */}
      {showTaskModal && selectedLead && (
        <TaskModal
          lead={selectedLead}
          targetColumn={targetColumn}
          onSave={handleSaveTask}
          onCancel={handleCancelMove}
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

      {/* Modal de Agendamentos */}
      {showScheduledContacts && (
        <ScheduledContactsList
          scheduledContacts={scheduledContacts}
          onClose={() => setShowScheduledContacts(false)}
        />
      )}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
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

        <div className="p-6">
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
                <div className={`w-4 h-4 rounded-full ${column.color}`}></div>
                <span className="font-medium text-gray-900 dark:text-white">{column.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
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

// Modal para criação de tarefa
interface TaskModalProps {
  lead: Lead;
  targetColumn: string;
  onSave: (taskData: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ lead, targetColumn, onSave, onCancel }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: '',
    priority: 'media' as Task['priority'],
    status: 'pendente' as Task['status']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(taskData);
  };

  const getColumnTitle = (columnId: string) => {
    const column = {
      'prospecto': 'Prospecto',
      'contato': 'Contato',
      'proposta': 'Proposta',
      'negociacao': 'Negociação',
      'fechado': 'Fechado',
      'perdido': 'Perdido'
    }[columnId] || columnId;
    
    return column;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nova Tarefa - {getColumnTitle(targetColumn)}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título da Tarefa
            </label>
            <input
              type="text"
              required
              value={taskData.title}
              onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Fazer demonstração do produto"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              rows={3}
              value={taskData.description}
              onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Detalhes da tarefa..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Vencimento
              </label>
              <input
                type="date"
                required
                value={taskData.dueDate}
                onChange={(e) => setTaskData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsável
              </label>
              <input
                type="text"
                required
                value={taskData.assignedTo}
                onChange={(e) => setTaskData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridade
              </label>
              <select
                value={taskData.priority}
                onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={taskData.status}
                onChange={(e) => setTaskData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
            >
              Salvar e Mover
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



export default PipelineVendas;
