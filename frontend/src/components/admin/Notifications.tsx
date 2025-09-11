import React, { useState } from 'react';
import {
  Bell,
  Check,
  X,
  UserPlus,
  Clock,
  AlertCircle
} from 'lucide-react';
import { ProjectInvite } from '../../data/mockData';

interface NotificationProps {
  invites: ProjectInvite[];
  onApprove: (inviteId: string) => void;
  onReject: (inviteId: string) => void;
}

const Notifications: React.FC<NotificationProps> = ({ invites, onApprove, onReject }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredInvites = invites.filter(invite => {
    if (filter === 'all') return true;
    return invite.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'approved': return 'text-green-600 dark:text-green-400';
      case 'rejected': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <Check className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Recusado';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = invites.filter(invite => invite.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Gerencie convites e atividades do projeto
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {[
            { key: 'all', label: 'Todas', count: invites.length },
            { key: 'pending', label: 'Pendentes', count: invites.filter(i => i.status === 'pending').length },
            { key: 'approved', label: 'Aprovadas', count: invites.filter(i => i.status === 'approved').length },
            { key: 'rejected', label: 'Recusadas', count: invites.filter(i => i.status === 'rejected').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === key
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  filter === key
                    ? 'bg-gray-200 dark:bg-gray-500 text-gray-700 dark:text-gray-200'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {filteredInvites.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? 'Você não tem notificações no momento.'
                : `Nenhuma notificação ${filter === 'pending' ? 'pendente' : filter === 'approved' ? 'aprovada' : 'recusada'}.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredInvites.map((invite) => (
              <div key={invite.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    invite.status === 'pending' 
                      ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                      : invite.status === 'approved'
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {invite.status === 'pending' ? (
                      <UserPlus className={`w-5 h-5 ${getStatusColor(invite.status)}`} />
                    ) : invite.status === 'approved' ? (
                      <Check className={`w-5 h-5 ${getStatusColor(invite.status)}`} />
                    ) : (
                      <X className={`w-5 h-5 ${getStatusColor(invite.status)}`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {invite.status === 'pending' 
                          ? `Convite de ${invite.fromUserName}`
                          : invite.status === 'approved'
                          ? `Convite aprovado por ${invite.fromUserName}`
                          : `Convite recusado por ${invite.fromUserName}`
                        }
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${
                          invite.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : invite.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {getStatusIcon(invite.status)}
                          <span>{getStatusLabel(invite.status)}</span>
                        </span>
                      </div>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {invite.message}
                    </p>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {invite.status === 'pending' 
                          ? `Enviado em ${formatDate(invite.createdAt)}`
                          : `Respondido em ${formatDate(invite.respondedAt!)}`
                        }
                      </p>
                      
                      {invite.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onApprove(invite.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-md transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Aprovar</span>
                          </button>
                          <button
                            onClick={() => onReject(invite.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Recusar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
