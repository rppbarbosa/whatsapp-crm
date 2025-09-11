import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task } from '../components/tasks/TaskCard';
import { tasksService, TaskDTO } from '../services/tasksService';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getTasksByLead: (leadId: string) => Task[];
  getTasksByStatus: (status: Task['status']) => Task[];
  getTasksByAssignee: (assigneeId: string) => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Carregar tarefas da API na inicialização
  useEffect(() => {
    (async () => {
      try {
        const apiTasks = await tasksService.getTasks();
        const mapped: Task[] = apiTasks.map(mapDtoToTask);
        setTasks(mapped);
      } catch (error) {
        console.error('Erro ao carregar tarefas da API:', error);
      }
    })();
  }, []);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload: Omit<TaskDTO, 'id' | 'createdAt' | 'updatedAt'> = {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      assignee: taskData.assignee ? { id: taskData.assignee.id, name: taskData.assignee.name, avatar: taskData.assignee.avatar } : undefined,
      dueDate: taskData.dueDate,
      tags: taskData.tags,
      leadId: taskData.leadId,
      leadName: taskData.leadName,
    };
    const created = await tasksService.createTask(payload);
    const newTask = mapDtoToTask(created);
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const payload: Partial<TaskDTO> = {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      assignee: updates.assignee ? { id: updates.assignee.id, name: updates.assignee.name, avatar: updates.assignee.avatar } : undefined,
      dueDate: updates.dueDate,
      tags: updates.tags,
      leadId: updates.leadId,
      leadName: updates.leadName,
    };
    const updated = await tasksService.updateTask(taskId, payload);
    const mapped = mapDtoToTask(updated);
    setTasks(prev => prev.map(t => (t.id === taskId ? mapped : t)));
  };

  const deleteTask = async (taskId: string) => {
    await tasksService.deleteTask(taskId);
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const getTasksByLead = (leadId: string) => {
    return tasks.filter(task => task.leadId === leadId);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const getTasksByAssignee = (assigneeId: string) => {
    return tasks.filter(task => task.assignee?.id === assigneeId);
  };

  const value: TaskContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    getTasksByLead,
    getTasksByStatus,
    getTasksByAssignee,
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

function mapDtoToTask(dto: TaskDTO): Task {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    assignee: dto.assignee ? { id: dto.assignee.id, name: dto.assignee.name, avatar: dto.assignee.avatar } : undefined,
    dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    tags: dto.tags,
    leadId: dto.leadId,
    leadName: dto.leadName,
  };
}
