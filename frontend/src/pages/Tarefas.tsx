import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import TaskColumn from '../components/tasks/TaskColumn';
import TaskCard from '../components/tasks/TaskCard';
import UnifiedTaskModal from '../components/tasks/UnifiedTaskModal';
import { Task } from '../components/tasks/TaskCard';
import { useTasks } from '../contexts/TaskContext';

const Tarefas: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [assigneeFilter, setAssigneeFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Mock data - substituir por dados reais da API
  const [leads] = useState([
    { id: '1', name: 'João Silva', phone: '(11) 99999-9999', email: 'joao@email.com' },
    { id: '2', name: 'Maria Santos', phone: '(11) 88888-8888', email: 'maria@email.com' },
    { id: '3', name: 'Carlos Oliveira', phone: '(11) 77777-7777', email: 'carlos@email.com' },
  ]);

  const [assignees] = useState([
    { id: '1', name: 'Ana Costa', avatar: '' },
    { id: '2', name: 'Pedro Lima', avatar: '' },
    { id: '3', name: 'Sofia Alves', avatar: '' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filtrar tarefas
  useEffect(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.leadName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter !== 'todas') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (statusFilter !== 'todas') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (assigneeFilter !== 'todos') {
      filtered = filtered.filter(task => task.assignee?.id === assigneeFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, priorityFilter, statusFilter, assigneeFilter]);

  const columns = [
    {
      id: 'pending',
      title: 'Pendente',
      color: 'bg-gray-500',
      icon: Circle
    },
    {
      id: 'in_progress',
      title: 'Em Andamento',
      color: 'bg-blue-500',
      icon: Clock
    },
    {
      id: 'completed',
      title: 'Concluída',
      color: 'bg-green-500',
      icon: CheckCircle2
    },
    {
      id: 'cancelled',
      title: 'Cancelada',
      color: 'bg-red-500',
      icon: AlertCircle
    }
  ];

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const newStatus = over.id as string;
    
    if (activeTask.status !== newStatus) {
      await updateTask(active.id as string, { status: newStatus as Task['status'] });
    }

    setActiveTask(null);
  };

  const handleAddTask = (columnId: string) => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addTask(taskData);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    await updateTask(updatedTask.id, updatedTask);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => 
      t.dueDate && new Date() > t.dueDate && t.status !== 'completed'
    ).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getStats();

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Tarefas</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Gerencie suas tarefas e acompanhe o progresso</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Concluídas</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Em Andamento</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">Atrasadas</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="todas">Todas as Prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="todas">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="todos">Todos os Responsáveis</option>
              {assignees.map(assignee => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {columns.map(column => (
            <TaskColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              color={column.color}
              icon={column.icon}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-50">
              <TaskCard task={activeTask} showActions={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      <UnifiedTaskModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onUpdate={handleUpdateTask}
        task={editingTask}
        leads={leads}
        assignees={assignees}
        mode="create"
      />
    </div>
  );
};

export default Tarefas;
