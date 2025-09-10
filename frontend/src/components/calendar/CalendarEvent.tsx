import React from 'react';
import { 
  Clock, 
  User, 
  Flag, 
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'call' | 'task' | 'follow_up' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  location?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  reminder?: {
    minutes: number;
    sent: boolean;
  };
  tags?: string[];
  isAllDay?: boolean;
}

interface CalendarEventProps {
  event: CalendarEvent;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onStatusChange?: (eventId: string, status: CalendarEvent['status']) => void;
  compact?: boolean;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false
}) => {
  const getTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'call':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'task':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'follow_up':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700';
      case 'other':
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return <CalendarIcon className="w-3 h-3" />;
      case 'call':
        return <Phone className="w-3 h-3" />;
      case 'task':
        return <Flag className="w-3 h-3" />;
      case 'follow_up':
        return <Clock className="w-3 h-3" />;
      case 'other':
      default:
        return <CalendarIcon className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      case 'scheduled':
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: ptBR });
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  if (compact) {
    return (
      <div className={`p-2 rounded border-l-4 ${getTypeColor(event.type)} bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {event.title}
            </h4>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatTime(event.start)}</span>
              {!event.isAllDay && event.start.getTime() !== event.end.getTime() && (
                <span className="ml-1">- {formatTime(event.end)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Badge className={`text-xs px-2 py-1 ${getPriorityColor(event.priority)}`}>
              {event.priority === 'urgent' ? 'Urgente' : 
               event.priority === 'high' ? 'Alta' :
               event.priority === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight mb-1">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Type and Status */}
      <div className="flex items-center space-x-2 mb-3">
        <Badge className={`text-xs px-2 py-1 ${getTypeColor(event.type)}`}>
          {getTypeIcon(event.type)}
          <span className="ml-1">
            {event.type === 'meeting' ? 'Reunião' :
             event.type === 'call' ? 'Ligação' :
             event.type === 'task' ? 'Tarefa' :
             event.type === 'follow_up' ? 'Follow-up' : 'Outro'}
          </span>
        </Badge>
        
        <Badge className={`text-xs px-2 py-1 ${getStatusColor(event.status)}`}>
          {event.status === 'completed' ? 'Concluído' :
           event.status === 'in_progress' ? 'Em Andamento' :
           event.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
        </Badge>
      </div>

      {/* Time */}
      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-2">
        <Clock className="w-3 h-3 mr-2" />
        <span>
          {event.isAllDay ? 'Dia inteiro' : `${formatTime(event.start)} - ${formatTime(event.end)}`}
        </span>
        <span className="ml-2">{formatDate(event.start)}</span>
      </div>

      {/* Lead Info */}
      {event.leadName && (
        <div className="space-y-1 mb-3">
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
            <User className="w-3 h-3 mr-2" />
            <span>Lead: {event.leadName}</span>
          </div>
          {event.leadPhone && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
              <Phone className="w-3 h-3 mr-2" />
              <span>{event.leadPhone}</span>
            </div>
          )}
          {event.leadEmail && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
              <Mail className="w-3 h-3 mr-2" />
              <span>{event.leadEmail}</span>
            </div>
          )}
        </div>
      )}

      {/* Location */}
      {event.location && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-2">
          <MapPin className="w-3 h-3 mr-2" />
          <span>{event.location}</span>
        </div>
      )}

      {/* Assignee */}
      {event.assignee && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-2">
          <User className="w-3 h-3 mr-2" />
          <span>Responsável: {event.assignee.name}</span>
        </div>
      )}

      {/* Priority */}
      <div className="flex items-center justify-between">
        <Badge className={`text-xs px-2 py-1 ${getPriorityColor(event.priority)}`}>
          <Flag className="w-3 h-3 mr-1" />
          {event.priority === 'urgent' ? 'Urgente' : 
           event.priority === 'high' ? 'Alta' :
           event.priority === 'medium' ? 'Média' : 'Baixa'}
        </Badge>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 2).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-1"
              >
                {tag}
              </Badge>
            ))}
            {event.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                +{event.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarEvent;
