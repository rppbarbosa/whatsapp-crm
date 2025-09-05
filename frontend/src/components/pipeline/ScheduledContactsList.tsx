import React from 'react';
import { Calendar, Clock, Phone, Mail, MessageCircle, User } from 'lucide-react';

interface ScheduledContact {
  id: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  date: string;
  time: string;
  method: 'phone' | 'email' | 'whatsapp' | 'meeting';
  notes: string;
  reminder: boolean;
  reminderTime: string;
  createdAt: string;
}

interface ScheduledContactsListProps {
  scheduledContacts: ScheduledContact[];
  onClose: () => void;
}

const ScheduledContactsList: React.FC<ScheduledContactsListProps> = ({ 
  scheduledContacts, 
  onClose 
}) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      default: return <Phone className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'phone': return 'Telefone';
      case 'email': return 'Email';
      case 'whatsapp': return 'WhatsApp';
      case 'meeting': return 'Reunião';
      default: return 'Telefone';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Filtrar apenas agendamentos futuros
  const futureContacts = scheduledContacts
    .filter(contact => new Date(`${contact.date}T${contact.time}`) > new Date())
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  if (futureContacts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agendamentos Futuros
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          <div className="p-6 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum agendamento futuro encontrado
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agendamentos Futuros
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {futureContacts.length} agendamento(s) programado(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {futureContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {contact.leadName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {contact.leadCompany}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(contact.method)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getMethodLabel(contact.method)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(contact.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatTime(contact.time)}
                    </span>
                  </div>
                </div>

                {contact.notes && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Observações:</strong> {contact.notes}
                    </p>
                  </div>
                )}

                {contact.reminder && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Lembrete: {contact.reminderTime} min antes</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledContactsList;
