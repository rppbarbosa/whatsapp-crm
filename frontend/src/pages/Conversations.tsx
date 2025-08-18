import React, { useState, useEffect, useRef } from 'react';

import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { leadsAPI, conversationsAPI, Lead } from '../services/api';
import { toast } from 'react-hot-toast';

interface KanbanItem {
  id: string;
  type: 'conversation' | 'lead';
  title: string;
  contact: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  status: 'lead-bruto' | 'contato-realizado' | 'qualificado' | 'proposta-enviada' | 'follow-up' | 'fechado-ganho' | 'fechado-perdido';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  unreadCount: number;
  campaign?: string;
  notes?: string;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'agent' | 'ai';
  timestamp: string;
  is_read: boolean;
}

const columns = {
  'lead-bruto': { title: 'Lead Bruto', icon: PlusIcon, color: 'bg-gray-100' },
  'contato-realizado': { title: 'Contato Realizado', icon: ChatBubbleLeftRightIcon, color: 'bg-blue-100' },
  'qualificado': { title: 'Qualificado', icon: CheckCircleIcon, color: 'bg-yellow-100' },
  'proposta-enviada': { title: 'Proposta Enviada', icon: ClockIcon, color: 'bg-orange-100' },
  'follow-up': { title: 'Follow-up', icon: ChatBubbleLeftRightIcon, color: 'bg-purple-100' },
  'fechado-ganho': { title: 'Fechado (Ganho)', icon: CheckCircleIcon, color: 'bg-green-100' },
  'fechado-perdido': { title: 'Fechado (Perdido)', icon: ExclamationTriangleIcon, color: 'bg-red-100' }
};

export default function Conversations() {
  const [kanbanItems, setKanbanItems] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadData = async () => {
    console.log('🔄 Loading data...');
    setLoading(true);
    
    try {
      // Carregar conversas
      const conversationsResponse = await conversationsAPI.getAll();
      const conversations = conversationsResponse || [];
      console.log('💬 Conversations loaded:', conversations.length);

      // Carregar leads
      const leadsResponse = await leadsAPI.getAll();
      const leads = leadsResponse || [];
      console.log('👤 Leads loaded:', leads.length);

      // Converter conversas para KanbanItem
      const conversationItems: KanbanItem[] = conversations.map(conv => ({
        id: conv.id,
        type: 'conversation',
        title: conv.customer_name || conv.whatsapp_number,
        contact: conv.customer_whatsapp || conv.whatsapp_number,
        phone: conv.whatsapp_number,
        lastMessage: 'Última mensagem da conversa',
        timestamp: new Date(conv.last_message_at || conv.created_at).toLocaleString('pt-BR'),
        status: conv.pipeline_status,
        priority: 'medium',
        unreadCount: 0,
        campaign: conv.lead_name ? 'Conversa' : undefined
      }));

      // Converter leads para KanbanItem
      const leadItems: KanbanItem[] = leads.map(lead => ({
        id: lead.id,
        type: 'lead',
        title: lead.name,
        contact: lead.email || lead.phone || 'Sem contato',
        phone: lead.phone || '',
        lastMessage: lead.notes || 'Lead capturado',
        timestamp: new Date(lead.created_at).toLocaleString('pt-BR'),
        status: lead.status,
        priority: lead.priority,
        unreadCount: 0,
        campaign: lead.campaign,
        notes: lead.notes
      }));

      // Combinar e ordenar
      const allItems = [...conversationItems, ...leadItems].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log('📊 Total items loaded:', allItems.length);
      
      // Contar por status
      const itemsByStatus = allItems.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('📋 Items by status:', itemsByStatus);

      setKanbanItems(allItems);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToStatus = async (itemId: string, newStatus: keyof typeof columns) => {
    try {
      const item = kanbanItems.find(i => i.id === itemId);
      if (!item) return;

      // Atualizar no backend
      if (item.type === 'conversation') {
        await conversationsAPI.updatePipelineStatus(itemId, newStatus);
      } else {
        await leadsAPI.update(itemId, { status: newStatus });
      }

      // Atualizar estado local
      setKanbanItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, status: newStatus } : i
      ));

      toast.success('Status atualizado com sucesso!');
      setActiveMenu(null);
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };



  const handleOpenConversation = async (item: KanbanItem) => {
    setSelectedItem(item);
    setShowConversationModal(true);
    setLoadingMessages(true);

    try {
      // Simular carregamento de mensagens (você pode integrar com a API real)
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Olá! Gostaria de saber mais sobre seus serviços.',
          sender_type: 'customer',
          timestamp: new Date(Date.now() - 3600000).toLocaleString('pt-BR'),
          is_read: true
        },
        {
          id: '2',
          content: 'Olá! Obrigado pelo interesse. Posso te ajudar com informações sobre nossos serviços de automação.',
          sender_type: 'agent',
          timestamp: new Date(Date.now() - 3000000).toLocaleString('pt-BR'),
          is_read: true
        },
        {
          id: '3',
          content: 'Quanto custa o plano básico?',
          sender_type: 'customer',
          timestamp: new Date(Date.now() - 2400000).toLocaleString('pt-BR'),
          is_read: true
        },
        {
          id: '4',
          content: 'O plano básico custa R$ 297/mês e inclui automação completa para WhatsApp.',
          sender_type: 'agent',
          timestamp: new Date(Date.now() - 1800000).toLocaleString('pt-BR'),
          is_read: false
        }
      ];

      setConversationMessages(mockMessages);
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedItem) return;

    try {
      // Criar nova mensagem
      const newMessage: Message = {
        id: Date.now().toString(), // ID temporário
        content: content.trim(),
        sender_type: 'agent',
        timestamp: new Date().toLocaleString('pt-BR'),
        is_read: false
      };

      // Adicionar ao histórico local
      setConversationMessages(prev => [...prev, newMessage]);

      // Aqui você pode integrar com a API para enviar a mensagem
      console.log('Enviando mensagem para:', selectedItem.title, ':', content);
      
      // Simular envio para API (remover quando integrar com backend real)
      // await conversationsAPI.sendMessage(selectedItem.id, content);
      
      toast.success('Mensagem enviada!');
      
      // Atualizar último status de leitura
      setConversationMessages(prev => 
        prev.map(msg => ({ ...msg, is_read: true }))
      );

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const getColumnItems = (status: keyof typeof columns) => {
    return kanbanItems.filter(item => item.status === status);
  };

  const handleAddLead = () => {
    setShowAddModal(true);
  };

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    try {
      await leadsAPI.create({
        ...leadData,
        status: 'lead-bruto',
        source: 'website'
      } as Lead);
      
      toast.success('Lead criado com sucesso!');
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error('❌ Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu && !(event.target as Element).closest('.menu-container')) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-gray-600">Gerencie seus leads e oportunidades em um quadro Kanban</p>
        </div>
        <button
          onClick={handleAddLead}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo Lead
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-7 gap-4 mb-6">
        {Object.entries(columns).map(([status, column]) => {
          const Icon = column.icon;
          const count = getColumnItems(status as keyof typeof columns).length;
          return (
            <div key={status} className={`p-4 rounded-lg ${column.color}`}>
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-gray-600" />
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{column.title}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {Object.entries(columns).map(([columnId, column]) => (
          <div key={columnId} className="space-y-3 min-w-[300px]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">{column.title}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {getColumnItems(columnId as keyof typeof columns).length}
              </span>
            </div>
            
            <div className="min-h-[500px] p-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
              {getColumnItems(columnId as keyof typeof columns).map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenConversation(item)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{item.contact}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.priority === 'high' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Alta
                        </span>
                      )}
                      {item.type === 'conversation' && (
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500" />
                      )}
                      
                      {/* Menu de ações */}
                      <div className="relative menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === item.id ? null : item.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {activeMenu === item.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                              {/* Mover para... */}
                              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Mover para...
                              </div>
                              {Object.entries(columns).map(([status, col]) => {
                                if (status === item.status) return null;
                                return (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveToStatus(item.id, status as keyof typeof columns);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    {col.title}
                                  </button>
                                );
                              })}
                              
                              <div className="border-t border-gray-200 my-1"></div>
                              
                              {/* Abrir Conversa */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenConversation(item);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <ChatBubbleLeftIcon className="h-4 w-4 mr-2 text-green-500" />
                                Abrir Conversa
                              </button>
                              
                              {/* Ligar */}
                              {item.phone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`tel:${item.phone}`, '_self');
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <PhoneIcon className="h-4 w-4 mr-2 text-blue-500" />
                                  Ligar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {item.lastMessage}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.timestamp}</span>
                    {item.campaign && (
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        {item.campaign}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal para adicionar lead */}
      {showAddModal && (
        <AddLeadModal
          onSave={handleSaveLead}
          onClose={() => setShowAddModal(false)}
        />
      )}

             {/* Modal de Conversa */}
       {showConversationModal && selectedItem && (
         <ConversationModal
           item={selectedItem}
           messages={conversationMessages}
           loading={loadingMessages}
           onClose={() => {
             setShowConversationModal(false);
             setSelectedItem(null);
             setConversationMessages([]);
           }}
           onSendMessage={handleSendMessage}
         />
       )}
    </div>
  );
}

// Modal de Conversa
interface ConversationModalProps {
  item: KanbanItem;
  messages: Message[];
  loading: boolean;
  onClose: () => void;
  onSendMessage: (content: string) => Promise<void>;
}

function ConversationModal({ item, messages, loading, onClose, onSendMessage }: ConversationModalProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Limpar campo imediatamente
    
    try {
      await onSendMessage(messageContent);
    } catch (error) {
      // Se der erro, restaurar a mensagem no campo
      setNewMessage(messageContent);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-0 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
                 {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-gray-200">
           <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
               <span className="text-white font-medium text-sm">
                 {item.title.charAt(0).toUpperCase()}
               </span>
             </div>
             <div>
               <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
               <div className="flex items-center space-x-2 text-sm text-gray-500">
                 <span>{item.contact}</span>
                 {item.phone && (
                   <>
                     <span>•</span>
                     <span className="flex items-center">
                       <PhoneIcon className="h-3 w-3 mr-1" />
                       {item.phone}
                     </span>
                   </>
                 )}
               </div>
             </div>
           </div>
           <div className="flex items-center space-x-2">
             <button
               onClick={onClose}
               className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
             >
               <XMarkIcon className="h-5 w-5" />
             </button>
           </div>
         </div>

                 {/* Messages */}
         <div className="h-96 overflow-y-auto p-4 bg-gray-50">
           {loading ? (
             <div className="flex items-center justify-center h-full">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
             </div>
           ) : messages.length === 0 ? (
             <div className="flex items-center justify-center h-full text-gray-500">
               <p>Nenhuma mensagem encontrada</p>
             </div>
           ) : (
             <div className="space-y-4">
               {messages.map((message) => (
                 <div
                   key={message.id}
                   className={`flex ${message.sender_type === 'customer' ? 'justify-start' : 'justify-end'}`}
                 >
                   <div
                     className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                       message.sender_type === 'customer'
                         ? 'bg-white border border-gray-200'
                         : 'bg-green-500 text-white'
                     }`}
                   >
                     <p className="text-sm">{message.content}</p>
                     <p className={`text-xs mt-1 ${
                       message.sender_type === 'customer' ? 'text-gray-500' : 'text-green-100'
                     }`}>
                       {message.timestamp}
                     </p>
                   </div>
                 </div>
               ))}
               <div ref={messagesEndRef} />
             </div>
           )}
         </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para adicionar lead
interface AddLeadModalProps {
  onSave: (data: Partial<Lead>) => void;
  onClose: () => void;
}

function AddLeadModal({ onSave, onClose }: AddLeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    campaign: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Novo Lead</h3>
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
                Criar Lead
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 