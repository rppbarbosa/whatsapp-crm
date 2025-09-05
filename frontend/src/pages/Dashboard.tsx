import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  BarChart3,
  GitBranch
} from 'lucide-react';
import { whatsappApi } from '../services/apiSimple';

// interface Lead {
//     id: string;
//   name: string;
//   email: string;
//   phone: string;
//   status: string;
//   created_at: string;
//   source: string;
// }

interface Conversation {
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  last_message_body: string;
  last_message_timestamp: number;
  message_count: number;
  id: string; // Added for recent conversations display
  last_message: string; // Added for recent conversations display
  last_message_time: number; // Added for recent conversations display
}

export default function Dashboard() {
  // const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [instanceConnected, setInstanceConnected] = useState(false);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalConversations: 0,
    messagesToday: 0,
    conversionRate: 0,
    leadsThisMonth: 0 // Added for new stats display
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Verificar status da instância
      try {
        const instanceResponse = await whatsappApi.getInstanceStatus();
        if (instanceResponse.data.success && instanceResponse.data.data) {
          setInstanceConnected(instanceResponse.data.data.status === 'connected');
        }
      } catch (error) {
        console.log('Status da instância não disponível');
        setInstanceConnected(false);
      }
      
      // Carregar leads
      try {
        const leadsResponse = await whatsappApi.get('/api/leads');
        if (leadsResponse.data.success) {
          // setLeads(leadsResponse.data.data || []);
              }
            } catch (error) {
        console.log('Leads não disponíveis ainda');
        // setLeads([]);
      }

      // Carregar conversas
      try {
        const conversationsResponse = await whatsappApi.get('/api/whatsapp/instance/conversations');
        if (conversationsResponse.data.success) {
          setConversations(conversationsResponse.data.data || []);
          if (conversationsResponse.data.message) {
            console.log('ℹ️', conversationsResponse.data.message);
          }
        }
      } catch (error) {
        console.log('Conversas não disponíveis ainda');
        setConversations([]);
      }

      // Carregar estatísticas
      try {
        const statsResponse = await whatsappApi.get('/api/whatsapp/instance/messages/stats');
        if (statsResponse.data.success && statsResponse.data.data) {
          setStats({
            totalLeads: statsResponse.data.data.totalLeads || 0,
            totalConversations: statsResponse.data.data.totalConversations || 0,
            messagesToday: statsResponse.data.data.messagesToday || 0,
            conversionRate: statsResponse.data.data.conversionRate || 0,
            leadsThisMonth: statsResponse.data.data.leadsThisMonth || 0
          });
          if (statsResponse.data.message) {
            console.log('ℹ️', statsResponse.data.message);
          }
        }
      } catch (error) {
        console.log('Estatísticas não disponíveis ainda');
        // Manter valores padrão
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // const getTimeAgo = (timestamp: number) => {
  //   try {
  //     const date = new Date(timestamp * 1000);
  //     if (isNaN(date.getTime())) return 'Data inválida';
  //     
  //   const now = new Date();
  //   const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  //   
  //     if (diffInSeconds < 60) return 'Agora mesmo';
  //     if (diffInSeconds < 60) return `${Math.floor(diffInSeconds / 60)}m atrás`;
  //   if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  //     return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  //   } catch (error) {
  //     return 'Data inválida';
  //   }
  // };

  // const recentConversations = conversations
  //   .filter(conv => conv.last_message_timestamp && conv.last_message_timestamp > 0)
  //   .sort((a, b) => (b.last_message_timestamp || 0) - (a.last_message_timestamp || 0))
  //   .slice(0, 5)
  //   .map(conv => {
  //     try {
  //       const date = new Date((conv.last_message_timestamp || 0) * 1000);
  //       if (isNaN(date.getTime())) {
  //         return { ...conv, formattedTime: 'Data inválida' };
  //         }
  //       return { ...conv, formattedTime: getTimeAgo(conv.last_message_timestamp || 0) };
  //     } catch (error) {
  //       return { ...conv, formattedTime: 'Data inválida' };
  //     }
  //   });

  // const recentLeads = leads
  //   .filter(lead => lead.created_at)
  //   .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  //   .slice(0, 5);

  // const conversationsThisMonth = conversations.filter(conv => {
  //   try {
  //     if (!conv.last_message_timestamp || conv.last_message_timestamp <= 0) return false;
  //     const date = new Date(conv.last_message_timestamp * 1000);
  //     if (isNaN(date.getTime())) return false;
  //     
  //     const now = new Date();
  //     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  //     return date >= startOfMonth;
  //     } catch (error) {
  //     return false;
  //   }
  // });

  // const leadsThisMonth = leads.filter(lead => {
  //   try {
  //     if (!lead.created_at) return false;
  //     const date = new Date(lead.created_at);
  //       if (isNaN(date.getTime())) return false;
  //     
  //     const now = new Date();
  //     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  //     return date >= startOfMonth;
  //   } catch (error) {
  //     return false;
  //   }
  // });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-500">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Visão geral do seu CRM WhatsApp
              </p>
            </div>
            {/* Status da Instância */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              instanceConnected 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                instanceConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {instanceConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Aviso de Instância Desconectada */}
        {!instanceConnected && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  WhatsApp não conectado
                </h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  <p>
                    Para ver conversas e estatísticas reais, conecte sua instância do WhatsApp em{' '}
                    <a href="/gerenciar-instancias" className="font-medium underline hover:text-amber-600 dark:hover:text-amber-400">
                      Gerenciar Instâncias
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total de Leads */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                  Total de Leads
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalLeads || 0}
                </p>
                </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
          </div>

          {/* Conversas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                  Conversas
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalConversations || 0}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 dark:text-green-400" />
            </div>
          </div>
      </div>

          {/* Mensagens Hoje */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                  Mensagens Hoje
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.messagesToday || 0}
                </p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 dark:text-purple-400" />
              </div>
              </div>
                        </div>

          {/* Leads Este Mês */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                          <div>
                <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400">
                  Leads Este Mês
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.leadsThisMonth || 0}
                </p>
                          </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                <GitBranch className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600 dark:text-orange-400" />
                          </div>
                        </div>
                      </div>
                    </div>

        {/* Recent Conversations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Conversas Recentes
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {conversations.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {conversations.slice(0, 5).map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                      {conversation.contact_name ? conversation.contact_name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                        {conversation.contact_name || 'Contato'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.last_message || 'Nenhuma mensagem'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {conversation.last_message_time ? new Date(conversation.last_message_time).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma conversa recente
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Comece a usar o WhatsApp para ver suas conversas aqui
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 