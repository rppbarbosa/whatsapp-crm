// Normaliza a base para sempre incluir "/api" (compatível com diferentes .env)
const RAW_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const API_BASE_URL = `${RAW_BASE_URL}/api`;

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'call' | 'task' | 'follow_up' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  start: Date;
  end: Date;
  isAllDay: boolean;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  location?: string;
  reminder: {
    minutes: number;
    sent: boolean;
  };
  tags: string[];
}

export interface EventStats {
  total: number;
  completed: number;
  scheduled: number;
  today: number;
}

class EventsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/events${endpoint}`;
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

    const data = await response.json();
    return data.data;
  }

  async getEvents(): Promise<CalendarEvent[]> {
    const events = await this.request<CalendarEvent[]>('');
    // Converter strings de data para objetos Date
    return events.map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }));
  }

  async getEvent(id: string): Promise<CalendarEvent> {
    const event = await this.request<CalendarEvent>(`/${id}`);
    return {
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    };
  }

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const newEvent = await this.request<CalendarEvent>('', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return {
      ...newEvent,
      start: new Date(newEvent.start),
      end: new Date(newEvent.end),
    };
  }

  async updateEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const updatedEvent = await this.request<CalendarEvent>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
    return {
      ...updatedEvent,
      start: new Date(updatedEvent.start),
      end: new Date(updatedEvent.end),
    };
  }

  async deleteEvent(id: string): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats(): Promise<EventStats> {
    return this.request<EventStats>('/stats/dashboard');
  }
}

export const eventsService = new EventsService();
