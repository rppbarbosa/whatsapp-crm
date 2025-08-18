import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { leadsAPI, Lead } from '../services/api';
import toast from 'react-hot-toast';

// Mapeamento de status do backend para o frontend
const statusMapping = {
  'lead-bruto': 'novo',
  'contato-realizado': 'contatado',
  'qualificado': 'qualificado',
  'proposta-enviada': 'proposta',
  'follow-up': 'follow-up',
  'fechado-ganho': 'fechado',
  'fechado-perdido': 'fechado'
} as const;

type FrontendStatus = 'novo' | 'contatado' | 'qualificado' | 'proposta' | 'follow-up' | 'fechado';

const statusColors: Record<FrontendStatus, string> = {
  novo: 'bg-gray-100 text-gray-800',
  contatado: 'bg-blue-100 text-blue-800',
  qualificado: 'bg-yellow-100 text-yellow-800',
  proposta: 'bg-purple-100 text-purple-800',
  'follow-up': 'bg-orange-100 text-orange-800',
  fechado: 'bg-green-100 text-green-800'
};

const statusLabels: Record<FrontendStatus, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  'follow-up': 'Follow-up',
  fechado: 'Fechado'
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Carregar leads do backend
  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsAPI.getAll();
      setLeads(data);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  // Carregar leads na inicialização
  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (lead.campaign && lead.campaign.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const frontendStatus = statusMapping[lead.status as keyof typeof statusMapping] || 'novo';
    const matchesStatus = statusFilter === 'all' || frontendStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (lead: Lead) => {
    setDeletingLead(lead);
    setDeleteConfirmation('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Digite DELETE para confirmar a exclusão');
      return;
    }

    if (!deletingLead) return;

    try {
      await leadsAPI.delete(deletingLead.id);
      toast.success('Lead excluído com sucesso!');
      loadLeads(); // Recarregar lista
      setShowDeleteModal(false);
      setDeletingLead(null);
      setDeleteConfirmation('');
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingLead(null);
    setDeleteConfirmation('');
  };

  // Limpar confirmação quando modal é fechado
  useEffect(() => {
    if (!showDeleteModal) {
      setDeleteConfirmation('');
    }
  }, [showDeleteModal]);

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  const handleSave = async (leadData: Partial<Lead>) => {
    try {
      if (editingLead) {
        // Atualizar lead existente
        await leadsAPI.update(editingLead.id, leadData);
        toast.success('Lead atualizado com sucesso!');
      } else {
        // Criar novo lead
                 const newLeadData = {
           name: leadData.name || '',
           email: leadData.email || '',
           phone: leadData.phone || '',
           campaign: leadData.campaign || '',
           status: 'lead-bruto' as const, // Status padrão
           source: (leadData.source as Lead['source']) || 'website',
           priority: 'medium' as const,
           notes: leadData.notes || ''
         };
        await leadsAPI.create(newLeadData);
        toast.success('Lead criado com sucesso!');
      }
      
      setShowModal(false);
      setEditingLead(null);
      loadLeads(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar lead');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600">Gerencie seus leads e oportunidades</p>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600">Gerencie seus leads e oportunidades</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Todos os status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campanha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {leads.length === 0 ? 'Nenhum lead encontrado. Crie seu primeiro lead!' : 'Nenhum lead encontrado com os filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const frontendStatus = statusMapping[lead.status as keyof typeof statusMapping] || 'novo' as FrontendStatus;
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            {lead.email && (
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            )}
                            {lead.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <PhoneIcon className="h-3 w-3 mr-1" />
                                {lead.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {lead.campaign || '-'}
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[frontendStatus]}`}>
                          {statusLabels[frontendStatus]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.source || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(lead)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <LeadModal
          lead={editingLead}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingLead(null);
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && deletingLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mt-4 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Você está prestes a excluir o lead <strong>{deletingLead.name}</strong>.
                Esta ação não pode ser desfeita.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> para confirmar:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && deleteConfirmation === 'DELETE') {
                        confirmDelete();
                      }
                    }}
                    className={`block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                      deleteConfirmation === 'DELETE' 
                        ? 'border-green-500 focus:ring-green-500 bg-green-50' 
                        : 'border-gray-300 focus:ring-red-500'
                    }`}
                    placeholder="Digite DELETE"
                    autoFocus
                  />
                  {deleteConfirmation === 'DELETE' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="text-green-600">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteConfirmation !== 'DELETE'}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Component
interface LeadModalProps {
  lead?: Lead | null;
  onSave: (data: Partial<Lead>) => void;
  onClose: () => void;
}

function LeadModal({ lead, onSave, onClose }: LeadModalProps) {
  const [formData, setFormData] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    campaign: lead?.campaign || '',
    status: lead?.status || 'lead-bruto',
    source: lead?.source || 'website',
    notes: lead?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Campanha</label>
                             <select
                 value={formData.campaign}
                 onChange={(e) => setFormData({...formData, campaign: e.target.value})}
                 className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
               >
                <option value="">Selecione uma campanha</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Facebook Ads">Facebook Ads</option>
                <option value="Instagram Ads">Instagram Ads</option>
                <option value="LinkedIn Ads">LinkedIn Ads</option>
                <option value="WhatsApp Business">WhatsApp Business</option>
                <option value="Email Marketing">Email Marketing</option>
                <option value="SEO">SEO (Busca Orgânica)</option>
                <option value="Indicação">Indicação</option>
                <option value="Evento">Evento</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as Lead['status']})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="lead-bruto">Lead Bruto</option>
                <option value="contato-realizado">Contato Realizado</option>
                <option value="qualificado">Qualificado</option>
                <option value="proposta-enviada">Proposta Enviada</option>
                <option value="follow-up">Follow-up</option>
                <option value="fechado-ganho">Fechado (Ganho)</option>
                <option value="fechado-perdido">Fechado (Perdido)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Origem</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value as Lead['source']})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="website">Website</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="referral">Indicação</option>
                <option value="social">Redes Sociais</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                {lead ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 