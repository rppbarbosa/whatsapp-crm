import React from 'react';
import {
  X, User, Phone, Mail, DollarSign, Clock, AlertCircle, FileText
} from 'lucide-react';
import { Lead } from './LeadCard';

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
}

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, onClose }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'baixa': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'prospecto': 'Prospecto',
      'contato': 'Contato',
      'proposta': 'Proposta',
      'negociacao': 'Negociação',
      'fechado': 'Fechado',
      'perdido': 'Perdido'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalhes do Lead
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Informações completas de {lead.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {lead.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {lead.company}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{lead.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">{lead.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Valor do Lead
                  </span>
                  <DollarSign className="w-4 h-4 text-gray-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(lead.value)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                    {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prioridade</p>
                </div>
                <div className="text-center">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {getStatusLabel(lead.status)}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Status</p>
                </div>
              </div>
            </div>
          </div>

          {/* Próximo Contato */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Próximo Contato
            </h5>
            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-medium">
                {lead.nextContact}
              </span>
              {lead.isOverdue && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Atrasado</span>
                </div>
              )}
            </div>
          </div>

          {/* Tarefas */}
          {lead.tasks && lead.tasks.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Tarefas ({lead.tasks.length})
              </h5>
              <div className="space-y-3">
                {lead.tasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                          {task.title}
                        </h6>
                        {task.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Responsável: {task.assignedTo}</span>
                      <span>Vencimento: {task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de Atividades */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Histórico de Atividades
            </h5>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Lead criado em {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
              {lead.status !== 'prospecto' && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Movido para {getStatusLabel(lead.status)}
                  </span>
                </div>
              )}
              {lead.tasks && lead.tasks.length > 0 && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {lead.tasks.length} tarefa(s) criada(s)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300">
              Editar Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;
