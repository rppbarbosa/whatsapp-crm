import React, { useState, useEffect, useRef } from 'react';
import {
  MoreVertical,
  Phone,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  ChevronDown
} from 'lucide-react';
import LeadDetailsModal from './LeadDetailsModal';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  value: number;
  priority: 'alta' | 'media' | 'baixa';
  nextContact: string;
  status: 'prospecto' | 'contato' | 'proposta' | 'negociacao' | 'fechado' | 'perdido';
  isOverdue: boolean;
  source?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  assignedTo: string;
  priority: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'em_andamento' | 'concluida';
}

interface LeadCardProps {
  lead: Lead;
  onMove: (lead: Lead) => void;
  onSchedule: (lead: Lead) => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onMove, onSchedule, isMenuOpen, onMenuToggle }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isMenuOpen) {
          onMenuToggle();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        onMenuToggle();
      }
    };

    // Fechar dropdown quando modal de detalhes for aberto
    if (showDetailsModal && isMenuOpen) {
      onMenuToggle();
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, onMenuToggle, showDetailsModal]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'baixa': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove(lead);
    // Fechar dropdown quando abrir modal de movimentação
    if (isMenuOpen) {
      onMenuToggle();
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetailsModal(true);
    // Fechar dropdown quando abrir modal
    if (isMenuOpen) {
      onMenuToggle();
    }
  };

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSchedule(lead);
    // Fechar dropdown quando abrir modal de agendamento
    if (isMenuOpen) {
      onMenuToggle();
    }
  };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 relative">
        {/* Informações Principais - Apenas Nome e Telefone */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {lead.name}
            </h4>
            <div className="flex items-center space-x-2 text-xs mt-1">
              <Phone className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-400 truncate">{lead.phone}</span>
            </div>
          </div>
          
          {/* Menu de Ações */}
          <div className="relative ml-3 flex-shrink-0" ref={dropdownRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Abrir menu de opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {isMenuOpen && (
              <>
                {/* Overlay invisível para capturar cliques fora */}
                <div 
                  className="fixed inset-0 z-[9998]" 
                  onClick={() => onMenuToggle()}
                />
                <div className="dropdown-menu absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] min-w-[200px] py-1">
                <button
                  onClick={handleMoveClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Mover para...
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button 
                  onClick={handleDetailsClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver detalhes
                </button>
                <button 
                  onClick={handleScheduleClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar contato
                </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Indicadores de Status */}
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
            {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
          </span>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.nextContact}</span>
          </div>
        </div>

        {/* Indicador de Atraso */}
        {lead.isOverdue && (
          <div className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400 mb-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>Atrasado</span>
          </div>
        )}

        {/* Indicador de Tarefas */}
        {lead.tasks && lead.tasks.length > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span>{lead.tasks.length} tarefa(s)</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && (
        <LeadDetailsModal
          lead={lead}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
};

export default LeadCard;
