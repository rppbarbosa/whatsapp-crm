import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  PhoneIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { leadsAPI, whatsappApi } from '../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalLeads: number;
  totalConversations: number;
  totalInstances: number;
  activeConversations: number;
  leadsThisMonth: number;
  conversationsThisMonth: number;
  recentActivities: Array<{
    id: string;
    type: 'lead' | 'conversation' | 'message' | 'instance';
    message: string;
    time: string;
    timestamp: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalConversations: 0,
    totalInstances: 0,
    activeConversations: 0,
    leadsThisMonth: 0,
    conversationsThisMonth: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar leads
      const leads = await leadsAPI.getAll();
      
      // Carregar conversas (usando WhatsApp API)
      let conversations: any[] = [];
      let instances: any[] = [];
      try {
        // Buscar conversas de todas as instâncias conectadas
        const instancesResponse = await whatsappApi.getInstances();
        // A resposta do backend tem estrutura: { success: true, data: instances[] }
        // instancesResponse.data é a resposta completa do axios
        // instancesResponse.data.data é o array de instâncias do backend
        instances = instancesResponse.data?.data || [];
        
        for (const instance of instances) {
          if (instance.status === 'connected') {
            try {
              const convResponse = await whatsappApi.getConversations(instance.instance_name);
              // A resposta do backend tem estrutura: { success: true, data: conversations[] }
              const convData = convResponse.data?.data || [];
              if (convData.length > 0) {
                conversations = conversations.concat(convData);
              }
            } catch (error) {
              console.warn(`Erro ao buscar conversas da instância ${instance.instance_name}:`, error);
            }
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar conversas:', error);
      }
      
      // Calcular estatísticas
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const leadsThisMonth = leads.filter(lead => 
        new Date(lead.created_at) >= thisMonth
      ).length;
      
      const conversationsThisMonth = conversations.filter(conv => 
        new Date(conv.last_message_timestamp * 1000) >= thisMonth
      ).length;
      
      const activeConversations = conversations.length; // Todas as conversas são consideradas ativas
      
      // Criar atividades recentes
      const recentActivities: Array<{
        id: string;
        type: 'lead' | 'conversation' | 'message' | 'instance';
        message: string;
        time: string;
        timestamp: string;
      }> = [];
      
      // Adicionar leads recentes
      const recentLeads = leads
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);
      
      recentLeads.forEach(lead => {
        recentActivities.push({
          id: `lead-${lead.id}`,
          type: 'lead' as const,
          message: `Novo lead criado: ${lead.name}`,
          time: getTimeAgo(lead.created_at),
          timestamp: lead.created_at
        });
      });
      
      // Adicionar conversas recentes
      const recentConversations = conversations
        .sort((a, b) => b.last_message_timestamp - a.last_message_timestamp)
        .slice(0, 3);
      
      recentConversations.forEach(conv => {
        const contactName = conv.contact_name || 'Cliente';
        recentActivities.push({
          id: `conv-${conv.contact_id}`,
          type: 'conversation' as const,
          message: `Conversa com ${contactName}`,
          time: getTimeAgo(new Date(conv.last_message_timestamp * 1000).toISOString()),
          timestamp: new Date(conv.last_message_timestamp * 1000).toISOString()
        });
      });
      
      // Ordenar atividades por timestamp
      recentActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setStats({
        totalLeads: leads.length,
        totalConversations: conversations.length,
        totalInstances: instances.length,
        activeConversations,
        leadsThisMonth,
        conversationsThisMonth,
        recentActivities: recentActivities.slice(0, 8) // Limitar a 8 atividades
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular tempo relativo
  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} segundos atrás`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
  };

  // Calcular percentual de crescimento
  const getGrowthPercentage = (current: number, previous: number): { value: string; type: 'positive' | 'negative' | 'neutral' } => {
    if (previous === 0) {
      return { value: current > 0 ? '+100%' : '0%', type: current > 0 ? 'positive' : 'neutral' };
    }
    
    const percentage = ((current - previous) / previous) * 100;
    const rounded = Math.round(percentage);
    
    if (rounded > 0) return { value: `+${rounded}%`, type: 'positive' };
    if (rounded < 0) return { value: `${rounded}%`, type: 'negative' };
    return { value: '0%', type: 'neutral' };
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadDashboardData();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dados dos cards de estatísticas
  const statsCards = [
    { 
      name: 'Total de Leads', 
      value: stats.totalLeads.toLocaleString(), 
      change: getGrowthPercentage(stats.leadsThisMonth, Math.floor(stats.totalLeads * 0.8)), 
      icon: UsersIcon 
    },
    { 
      name: 'Conversas Ativas', 
      value: stats.activeConversations.toString(), 
      change: getGrowthPercentage(stats.conversationsThisMonth, Math.floor(stats.totalConversations * 0.8)), 
      icon: ChatBubbleLeftRightIcon 
    },
    { 
      name: 'Instâncias WhatsApp', 
      value: stats.totalInstances.toString(), 
      change: { value: '0%', type: 'neutral' as const }, 
      icon: PhoneIcon 
    },
    { 
      name: 'Total Conversas', 
      value: stats.totalConversations.toString(), 
      change: getGrowthPercentage(stats.conversationsThisMonth, Math.floor(stats.totalConversations * 0.8)), 
      icon: CurrencyDollarIcon 
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu WhatsApp CRM</p>
        </div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white shadow rounded-lg animate-pulse">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu WhatsApp CRM</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        item.change.type === 'positive' ? 'text-green-600' : 
                        item.change.type === 'negative' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {item.change.type === 'positive' && <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />}
                        {item.change.type === 'negative' && <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />}
                        <span className="ml-1">{item.change.value}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Atividades Recentes</h3>
          <div className="flow-root">
            {stats.recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade recente</h3>
                <p className="mt-1 text-sm text-gray-500">As atividades aparecerão aqui conforme você usar o sistema.</p>
              </div>
            ) : (
              <ul className="-mb-8">
                {stats.recentActivities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== stats.recentActivities.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            activity.type === 'lead' ? 'bg-blue-500' :
                            activity.type === 'conversation' ? 'bg-green-500' :
                            activity.type === 'message' ? 'bg-purple-500' : 'bg-gray-500'
                          }`}>
                            {activity.type === 'lead' && <UsersIcon className="h-4 w-4 text-white" />}
                            {activity.type === 'conversation' && <ChatBubbleLeftRightIcon className="h-4 w-4 text-white" />}
                            {activity.type === 'message' && <PhoneIcon className="h-4 w-4 text-white" />}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">{activity.message}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>{activity.time}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 