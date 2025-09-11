// Normaliza a base para sempre incluir "/api" (compatível com diferentes .env)
const RAW_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const API_BASE_URL = `${RAW_BASE_URL}/api`;

export interface TaskAssignee {
  id: string;
  name: string;
  avatar?: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: TaskAssignee;
  dueDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags?: string[];
  leadId?: string;
  leadName?: string;
}

class TasksService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/tasks${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    if (response.status === 204) return undefined as unknown as T;
    const data = await response.json();
    return data.data as T;
  }

  async getTasks(): Promise<TaskDTO[]> {
    const tasks = await this.request<TaskDTO[]>('');
    return tasks.map(t => ({
      ...t,
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    }));
  }

  async getTask(id: string): Promise<TaskDTO> {
    const t = await this.request<TaskDTO>(`/${id}`);
    return {
      ...t,
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    };
  }

  async createTask(task: Omit<TaskDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskDTO> {
    const created = await this.request<TaskDTO>('', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return {
      ...created,
      dueDate: created.dueDate ? new Date(created.dueDate) : undefined,
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
    };
  }

  async updateTask(id: string, task: Partial<TaskDTO>): Promise<TaskDTO> {
    const updated = await this.request<TaskDTO>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
    return {
      ...updated,
      dueDate: updated.dueDate ? new Date(updated.dueDate) : undefined,
      createdAt: new Date(updated.createdAt),
      updatedAt: new Date(updated.updatedAt),
    };
  }

  async deleteTask(id: string): Promise<void> {
    await this.request<void>(`/${id}`, { method: 'DELETE' });
  }
}

export const tasksService = new TasksService();


