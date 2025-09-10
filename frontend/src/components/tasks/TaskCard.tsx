import React from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Flag, 
  MoreVertical,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  leadId?: string;
  leadName?: string;
}

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onPriorityChange?: (taskId: string, priority: Task['priority']) => void;
  onAssign?: (taskId: string, assigneeId: string) => void;
  showActions?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onAssign,
  showActions = true
}) => {
  const getPriorityColor = (priority: Task['priority']) => {
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

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      case 'pending':
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const isOverdue = task.dueDate && new Date() > task.dueDate && task.status !== 'completed';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${
      isOverdue ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight mb-1">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit?.(task)}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs px-2 py-1"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Lead Reference */}
      {task.leadName && (
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-2">
          <User className="w-3 h-3 mr-1" />
          <span>Lead: {task.leadName}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Priority */}
          <Badge
            className={`text-xs px-2 py-1 ${getPriorityColor(task.priority)}`}
          >
            <Flag className="w-3 h-3 mr-1" />
            {task.priority === 'urgent' ? 'Urgente' : 
             task.priority === 'high' ? 'Alta' :
             task.priority === 'medium' ? 'Média' : 'Baixa'}
          </Badge>

          {/* Status */}
          <Badge
            className={`text-xs px-2 py-1 ${getStatusColor(task.status)}`}
          >
            {getStatusIcon(task.status)}
            <span className="ml-1">
              {task.status === 'completed' ? 'Concluída' :
               task.status === 'in_progress' ? 'Em Andamento' :
               task.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
            </span>
          </Badge>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div className={`flex items-center text-xs ${
            isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            <Calendar className="w-3 h-3 mr-1" />
            <span>
              {format(task.dueDate, 'dd/MM', { locale: ptBR })}
            </span>
          </div>
        )}
      </div>

      {/* Assignee */}
      {task.assignee && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
            <User className="w-3 h-3 mr-2" />
            <span>Responsável: {task.assignee.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
