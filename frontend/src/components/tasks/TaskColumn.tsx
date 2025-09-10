import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import TaskCard, { Task } from './TaskCard';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  icon: React.ComponentType<any>;
  onAddTask?: (columnId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onPriorityChange?: (taskId: string, priority: Task['priority']) => void;
  onAssign?: (taskId: string, assigneeId: string) => void;
  showAddButton?: boolean;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  id,
  title,
  tasks,
  color,
  icon: Icon,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onPriorityChange,
  onAssign,
  showAddButton = true
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`${color} rounded-t-lg p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5" />
            <h3 className="font-semibold text-sm">{title}</h3>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {tasks.length}
            </Badge>
          </div>
          
          {showAddButton && onAddTask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => onAddTask(id)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 bg-gray-50 dark:bg-gray-900 rounded-b-lg min-h-[400px] transition-colors duration-200 ${
          isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 border-dashed' : ''
        }`}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Icon className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">Nenhuma tarefa</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Arraste tarefas aqui</p>
            </div>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onAssign={onAssign}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
