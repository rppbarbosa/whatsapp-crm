import React, { useState, useEffect } from 'react';
import { X, Smartphone, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instanceName: string) => Promise<void>;
  loading?: boolean;
}

const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [instanceName, setInstanceName] = useState('');

  // Limpar nome da instância quando modal abrir
  useEffect(() => {
    if (isOpen) {
         setInstanceName('');
    }
  }, [isOpen]);

  // Função para criar instância
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instanceName.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }

    try {
      await onSubmit(instanceName.trim());
    } catch (error) {
      console.error('Erro ao criar instância:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-6 w-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Criar Nova Instância
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  id="instanceName"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Ex: minha-instancia"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
                />
              </div>
              
          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
              <button
              type="submit"
              disabled={loading || !instanceName.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar
                  </>
                )}
              </button>
            </div>
        </form>

        {/* Info */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Após criar a instância, o QR Code aparecerá no terminal do backend.
              Escaneie-o com seu WhatsApp para conectar!
                </p>
              </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInstanceModal; 