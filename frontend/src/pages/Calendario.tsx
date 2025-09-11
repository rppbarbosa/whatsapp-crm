import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-dark.css';
import { useDarkMode } from '../hooks/useDarkMode';
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  BarChart3,
  Eye,
  EyeOff,
  XCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import EventModal from '../components/calendar/EventModal';
import { CalendarEvent as CalendarEventType } from '../components/calendar/CalendarEvent';
import { isSameDay } from 'date-fns';
import { eventsService, EventStats } from '../services/eventsService';
import { leadsService, Lead as ApiLead } from '../services/leadsService';

// Configurar moment para português
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const Calendario: React.FC = () => {
  const isDarkMode = useDarkMode();
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEventType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [priorityFilter, setPriorityFilter] = useState('todas');
  const [assigneeFilter, setAssigneeFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<any>('month');
  const [showCompleted, setShowCompleted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);

  // Dados reais da API
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [assignees] = useState([
    { id: '1', name: 'Ana Costa', avatar: '' },
    { id: '2', name: 'Pedro Lima', avatar: '' },
    { id: '3', name: 'Sofia Alves', avatar: '' },
  ]);

  // Carregar dados reais da API
  useEffect(() => {
    loadEvents();
    loadLeads();
    loadStats();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const apiEvents = await eventsService.getEvents();
      
      // Converter eventos da API para o formato do frontend
      const convertedEvents: CalendarEventType[] = apiEvents.map(apiEvent => ({
        id: apiEvent.id,
        title: apiEvent.title,
        description: apiEvent.description || '',
        type: apiEvent.type,
        priority: apiEvent.priority,
        status: apiEvent.status,
        start: apiEvent.start,
        end: apiEvent.end,
        isAllDay: apiEvent.isAllDay,
        leadId: apiEvent.leadId,
        leadName: apiEvent.leadName || '',
        leadPhone: apiEvent.leadPhone || '',
        leadEmail: apiEvent.leadEmail || '',
        location: apiEvent.location || '',
        reminder: apiEvent.reminder,
        tags: apiEvent.tags || []
      }));
      
      setEvents(convertedEvents);
    } catch (err) {
      setError('Erro ao carregar eventos');
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const apiLeads = await leadsService.getLeads();
      setLeads(apiLeads);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await eventsService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  // Mock events para fallback
  useEffect(() => {
    const mockEvents: CalendarEventType[] = [
      {
        id: '1',
        title: 'Reunião com João Silva',
        description: 'Apresentação da proposta comercial',
        start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // amanhã
        end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // amanhã + 1h
        type: 'meeting',
        priority: 'high',
        status: 'scheduled',
        leadId: '1',
        leadName: 'João Silva',
        leadPhone: '(11) 99999-9999',
        leadEmail: 'joao@email.com',
        location: 'Escritório - Sala 1',
        assignee: assignees[0],
        reminder: { minutes: 15, sent: false },
        tags: ['reunião', 'vendas']
      },
      {
        id: '2',
        title: 'Ligação para Maria Santos',
        description: 'Follow-up da proposta enviada',
        start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // depois de amanhã
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // depois de amanhã + 30min
        type: 'call',
        priority: 'urgent',
        status: 'scheduled',
        leadId: '2',
        leadName: 'Maria Santos',
        leadPhone: '(11) 88888-8888',
        leadEmail: 'maria@email.com',
        assignee: assignees[1],
        reminder: { minutes: 30, sent: false },
        tags: ['follow-up', 'urgente']
      },
      {
        id: '3',
        title: 'Tarefa: Atualizar CRM',
        description: 'Inserir dados da última reunião',
        start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // em 3 dias
        end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // em 3 dias + 2h
        type: 'task',
        priority: 'low',
        status: 'scheduled',
        assignee: assignees[2],
        reminder: { minutes: 60, sent: false },
        tags: ['admin', 'crm']
      },
      {
        id: '4',
        title: 'Reunião Concluída',
        description: 'Reunião com Carlos Oliveira - Concluída',
        start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // ontem
        end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // ontem + 1.5h
        type: 'meeting',
        priority: 'medium',
        status: 'completed',
        leadId: '3',
        leadName: 'Carlos Oliveira',
        leadPhone: '(11) 77777-7777',
        leadEmail: 'carlos@email.com',
        location: 'Escritório - Sala 2',
        assignee: assignees[0],
        reminder: { minutes: 15, sent: true },
        tags: ['reunião', 'concluída']
      }
    ];
    setEvents(mockEvents);
  }, [assignees]);

  // Filtrar eventos
  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.leadName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'todos') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    if (priorityFilter !== 'todas') {
      filtered = filtered.filter(event => event.priority === priorityFilter);
    }

    if (assigneeFilter !== 'todos') {
      filtered = filtered.filter(event => event.assignee?.id === assigneeFilter);
    }

    if (!showCompleted) {
      filtered = filtered.filter(event => event.status !== 'completed');
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, typeFilter, priorityFilter, assigneeFilter, showCompleted]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedDate(start);
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleSelectEvent = (event: CalendarEventType) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEventType, 'id'>) => {
    try {
      const created = await eventsService.createEvent(eventData as any);
      setEvents(prev => [...prev, created as any]);
    } catch (err) {
      console.error('Erro ao criar evento:', err);
      setError('Erro ao criar evento');
    }
  };

  const handleUpdateEvent = async (updatedEvent: CalendarEventType) => {
    try {
      const saved = await eventsService.updateEvent(updatedEvent.id, updatedEvent as any);
      setEvents(prev => prev.map(event => (event.id === saved.id ? (saved as any) : event)));
    } catch (err) {
      console.error('Erro ao atualizar evento:', err);
      setError('Erro ao atualizar evento');
    }
  };


  const getStats = () => {
    const total = events.length;
    const completed = events.filter(e => e.status === 'completed').length;
    const scheduled = events.filter(e => e.status === 'scheduled').length;
    const today = events.filter(e => isSameDay(e.start, new Date())).length;

    return { total, completed, scheduled, today };
  };

  const currentStats = stats || getStats();

  const eventStyleGetter = (event: CalendarEventType) => {
    let backgroundColor = '#3174ad';
    
    // Priorizar status sobre tipo para cores
    if (event.status === 'completed') {
      backgroundColor = '#10b981'; // green for completed
    } else if (event.status === 'cancelled') {
      backgroundColor = '#ef4444'; // red for cancelled
    } else {
      // Usar cores baseadas no tipo se não há status específico
      switch (event.type) {
        case 'meeting':
          backgroundColor = '#3b82f6'; // blue
          break;
        case 'call':
          backgroundColor = '#10b981'; // green
          break;
        case 'task':
          backgroundColor = '#8b5cf6'; // purple
          break;
        case 'follow_up':
          backgroundColor = '#f59e0b'; // orange
          break;
        default:
          backgroundColor = '#6b7280'; // gray
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontWeight: '500',
        fontSize: '12px',
        padding: '2px 6px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
      },
      'data-event-type': event.type,
      'data-event-status': event.status
    };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando eventos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <XCircle className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadEvents}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendário</h1>
          <p className="text-gray-600 dark:text-gray-300">Gerencie seus eventos e compromissos</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center space-x-2"
          >
            {showCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showCompleted ? 'Ocultar Concluídos' : 'Mostrar Concluídos'}</span>
          </Button>
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Concluídos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Agendados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats.scheduled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Hoje</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStats.today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="meeting">Reunião</option>
            <option value="call">Ligação</option>
            <option value="task">Tarefa</option>
            <option value="follow_up">Follow-up</option>
            <option value="other">Outro</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="todas">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="todos">Todos os Responsáveis</option>
            {assignees.map(assignee => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>

          <div className="flex space-x-2">
            <Button
              variant={view === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Mês
            </Button>
            <Button
              variant={view === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Semana
            </Button>
            <Button
              variant={view === 'day' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              Dia
            </Button>
            <Button
              variant={view === 'agenda' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('agenda')}
            >
              Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className={isDarkMode ? 'rbc-calendar-dark' : ''}>
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={setView}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            selectable
            messages={{
            next: 'Próximo',
            previous: 'Anterior',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Lista',
            date: 'Data',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'Nenhum evento neste período',
            showMore: (total: number) => `+ Ver mais ${total}`
          }}
          />
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEvent(null);
          setSelectedDate(null);
        }}
        onSave={handleSaveEvent}
        onUpdate={handleUpdateEvent}
        event={editingEvent}
        leads={leads}
        assignees={assignees}
        selectedDate={selectedDate || undefined}
      />
    </div>
  );
};

export default Calendario;
