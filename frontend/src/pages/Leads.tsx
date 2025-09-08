import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { whatsappApi } from '../services/api';
import { toast } from 'react-hot-toast';
import NewLeadModal from '../components/leads/NewLeadModal';
import { Lead } from '../components/pipeline/LeadCard';

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await whatsappApi.get('/api/leads');
      if (response.data.success) {
        setLeads(response.data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (newLead: Omit<Lead, 'id' | 'tasks'>) => {
    try {
      const leadData = {
        name: newLead.name,
        email: newLead.email || null,
        phone: newLead.phone,
        company: newLead.company || null,
        value: newLead.value || null,
        priority: newLead.priority,
        nextContact: newLead.nextContact || null,
        source: newLead.source || 'manual',
        status: 'lead-bruto',
        notes: '',
        // Adicionar todos os campos do modal
        cargo: (newLead as any).cargo || null,
        linkedin: (newLead as any).linkedin || null,
        website: (newLead as any).website || null,
        setor: (newLead as any).setor || null,
        tamanhoEmpresa: (newLead as any).tamanhoEmpresa || null,
        industria: (newLead as any).industria || null,
        observacoes: (newLead as any).observacoes || null,
        tags: (newLead as any).tags || null
      };
      
      const response = await whatsappApi.post('/api/leads', leadData);
      if (response.data && response.data.success) {
        setShowAddModal(false);
        loadLeads();
      } else {
        throw new Error(response.data?.error || 'Erro ao criar lead');
      }
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm) ||
                         (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'inactive': return 'Inativo';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
        <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Gerenciar Leads
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie seus leads e oportunidades de negócio
              </p>
        </div>
        <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
        >
              <Plus className="w-5 h-5" />
              <span>Novo Lead</span>
        </button>
          </div>
      </div>

        {/* Filtros e Busca */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                  placeholder="Buscar leads por nome, email, telefone ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white"
              />
            </div>
          </div>
            <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="inactive">Inativo</option>
            </select>
              <button className="px-4 py-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200 flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filtros</span>
              </button>
          </div>
        </div>
      </div>

        {/* Lista de Leads */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Leads ({filteredLeads.length})
            </h2>
          </div>
          
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum lead encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro lead'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200"
                >
                  Criar Primeiro Lead
                </button>
              )}
            </div>
          ) : (
        <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Lead
                </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Empresa
                </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Prioridade
                </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Próximo Contato
                </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {lead.name}
                            </div>
                            {lead.nextContact && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                Próximo contato: {lead.nextContact}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.company ? (
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.company}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                       </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {lead.priority}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {lead.nextContact}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
                    </div>
                  )}
                </div>
              </div>

      {/* Modal de Adicionar Lead */}
      <NewLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddLead}
      />
    </div>
  );
} 