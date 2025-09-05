import React, { useState } from 'react';
import { X, Calendar, Clock, User, MessageCircle, Phone, Mail } from 'lucide-react';
import { Lead } from './LeadCard';

interface ScheduleContactModalProps {
  lead: Lead;
  onClose: () => void;
  onSchedule: (scheduleData: ScheduleData) => void;
}

interface ScheduleData {
  date: string;
  time: string;
  method: 'phone' | 'email' | 'whatsapp' | 'meeting';
  notes: string;
  reminder: boolean;
  reminderTime: string;
}

const ScheduleContactModal: React.FC<ScheduleContactModalProps> = ({ 
  lead, 
  onClose, 
  onSchedule 
}) => {
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    date: '',
    time: '',
    method: 'phone',
    notes: '',
    reminder: true,
    reminderTime: '15'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule(scheduleData);
    onClose();
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agendar Contato
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Agende um contato com {lead.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações do Lead */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{lead.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.company}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">{lead.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">{lead.email}</span>
              </div>
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data
              </label>
              <input
                type="date"
                required
                value={scheduleData.date}
                onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Hora
              </label>
              <input
                type="time"
                required
                value={scheduleData.time}
                onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Método de Contato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Método de Contato
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['phone', 'email', 'whatsapp', 'meeting'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setScheduleData(prev => ({ ...prev, method }))}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                    scheduleData.method === method
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {getMethodIcon(method)}
                  <span className="text-sm font-medium">{getMethodLabel(method)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              rows={3}
              value={scheduleData.notes}
              onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Detalhes sobre o contato, objetivos, etc..."
            />
          </div>

          {/* Lembrete */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="reminder"
                checked={scheduleData.reminder}
                onChange={(e) => setScheduleData(prev => ({ ...prev, reminder: e.target.checked }))}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="reminder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Definir lembrete
              </label>
            </div>
            {scheduleData.reminder && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Lembrar</span>
                <select
                  value={scheduleData.reminderTime}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, reminderTime: e.target.value }))}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="5">5 min antes</option>
                  <option value="15">15 min antes</option>
                  <option value="30">30 min antes</option>
                  <option value="60">1 hora antes</option>
                  <option value="1440">1 dia antes</option>
                </select>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
            >
              Agendar Contato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleContactModal;
