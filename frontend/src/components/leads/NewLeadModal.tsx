import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Lead } from '../../components/pipeline/LeadCard';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lead: Omit<Lead, 'id' | 'tasks'>) => void;
}

const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [activeTab, setActiveTab] = useState<'basico' | 'empresa' | 'negocio'>('basico');
  const [formData, setFormData] = useState({
    // Informações Básicas
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    cargo: '',
    
    // Informações da Empresa
    company: '',
    website: '',
    setor: '',
    tamanhoEmpresa: '',
    industria: '',
    
    // Informações de Negócio
    value: '',
    priority: 'media' as Lead['priority'],
    nextContact: '',
    fonte: '',
    observacoes: '',
    tags: [] as string[]
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica - apenas campos obrigatórios
    const newErrors: {[key: string]: string} = {};
    const missingFields: string[] = [];
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      missingFields.push('Nome');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
      missingFields.push('Telefone');
    }
    if (!formData.priority) {
      newErrors.priority = 'Prioridade é obrigatória';
      missingFields.push('Prioridade');
    }
    if (!formData.fonte.trim()) {
      newErrors.fonte = 'Fonte do lead é obrigatória';
      missingFields.push('Fonte do Lead');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Mostrar toast com campos obrigatórios faltando
      const missingFieldsText = missingFields.join(', ');
      toast.error(
        `Campos obrigatórios não preenchidos: ${missingFieldsText}`,
        {
          duration: 4000,
          style: {
            background: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500'
          },
          icon: '⚠️'
        }
      );
      return;
    }

    onAdd({
      name: formData.name,
      company: formData.company,
      phone: formData.phone,
      email: formData.email,
      value: Number(formData.value) || 0,
      priority: formData.priority,
      nextContact: formData.nextContact,
      status: 'prospecto',
      isOverdue: false,
      source: formData.fonte,
      // Adicionar todos os campos do modal
      cargo: formData.cargo,
      linkedin: formData.linkedin,
      website: formData.website,
      setor: formData.setor,
      tamanhoEmpresa: formData.tamanhoEmpresa,
      industria: formData.industria,
      observacoes: formData.observacoes,
      tags: formData.tags
    });

    // Mostrar toast de sucesso
    toast.success(
      `Lead "${formData.name}" criado com sucesso!`,
      {
        duration: 3000,
        style: {
          background: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500'
        },
        icon: '✅'
      }
    );

    // Resetar formulário e fechar modal
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      cargo: '',
      company: '',
      website: '',
      setor: '',
      tamanhoEmpresa: '',
      industria: '',
      value: '',
      priority: 'media',
      nextContact: '',
      fonte: '',
      observacoes: '',
      tags: []
    });
    setErrors({});
    setActiveTab('basico');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const tabs = [
    { id: 'basico', label: 'Informações Básicas', icon: '👤' },
    { id: 'empresa', label: 'Empresa', icon: '🏢' },
    { id: 'negocio', label: 'Negócio', icon: '💰' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Novo Lead
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Preencha as informações para criar um novo lead
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Tab: Informações Básicas */}
          {activeTab === 'basico' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Nome completo do contato"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profissão
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => handleInputChange('cargo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Gerente de Vendas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="email@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rede Social
                </label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://linkedin.com/in/usuario"
                />
              </div>
            </div>
          )}

          {/* Tab: Empresa */}
          {activeTab === 'empresa' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Nome da empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="https://empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Setor/Indústria
                  </label>
                  <select
                    value={formData.setor}
                    onChange={(e) => handleInputChange('setor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione um setor</option>
                    <option value="tecnologia">Tecnologia</option>
                    <option value="saude">Saúde</option>
                    <option value="educacao">Educação</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="varejo">Varejo</option>
                    <option value="industria">Indústria</option>
                    <option value="servicos">Serviços</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tamanho da Empresa
                  </label>
                  <select
                    value={formData.tamanhoEmpresa}
                    onChange={(e) => handleInputChange('tamanhoEmpresa', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione o tamanho</option>
                    <option value="startup">Startup (1-10)</option>
                    <option value="pequena">Pequena (11-50)</option>
                    <option value="media">Média (51-200)</option>
                    <option value="grande">Grande (201-1000)</option>
                    <option value="enterprise">Enterprise (1000+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição da Indústria
                </label>
                <textarea
                  rows={3}
                  value={formData.industria}
                  onChange={(e) => handleInputChange('industria', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Descreva brevemente o segmento de atuação da empresa..."
                />
              </div>
            </div>
          )}

          {/* Tab: Negócio */}
          {activeTab === 'negocio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridade *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Próximo Contato
                  </label>
                  <input
                    type="date"
                    value={formData.nextContact}
                    onChange={(e) => handleInputChange('nextContact', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fonte do Lead *
                  </label>
                  <select
                    value={formData.fonte}
                    onChange={(e) => handleInputChange('fonte', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.fonte ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Selecione a fonte</option>
                    <option value="whatsapp">📱 WhatsApp</option>
                    <option value="instagram">📷 Instagram</option>
                    <option value="facebook">👥 Facebook</option>
                    <option value="website">🌐 Website</option>
                    <option value="linkedin">💼 LinkedIn</option>
                    <option value="google-ads">🔍 Google Ads</option>
                    <option value="facebook-ads">📊 Facebook Ads</option>
                    <option value="instagram-ads">📈 Instagram Ads</option>
                    <option value="indicacao">🤝 Indicação</option>
                    <option value="evento">🎪 Evento</option>
                    <option value="feira">🏢 Feira/Exposição</option>
                    <option value="cold-call">📞 Cold Call</option>
                    <option value="email">📧 Email Marketing</option>
                    <option value="youtube">📺 YouTube</option>
                    <option value="tiktok">🎵 TikTok</option>
                    <option value="twitter">🐦 Twitter/X</option>
                    <option value="telefone">☎️ Telefone Direto</option>
                    <option value="visita">🚪 Visita Presencial</option>
                    <option value="outros">❓ Outros</option>
                  </select>
                  {errors.fonte && <p className="text-red-500 text-xs mt-1">{errors.fonte}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Adicionar tag..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Adicionar tag..."]') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          addTag(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Adicionar
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  rows={4}
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Informações adicionais sobre o lead, contexto da oportunidade, etc..."
                />
              </div>
            </div>
          )}

          {/* Navegação entre abas */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              {activeTab !== 'basico' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'empresa' ? 'basico' : 'empresa')}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  ← Anterior
                </button>
              )}
              {activeTab !== 'negocio' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'basico' ? 'empresa' : 'negocio')}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Próximo →
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
              >
                Criar Lead
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLeadModal;
