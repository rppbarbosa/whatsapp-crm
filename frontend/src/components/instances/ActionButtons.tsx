import React from 'react';
import {
  Play,
  Pause,
  Trash2
} from 'lucide-react';

interface ActionButtonsProps {
  instanceStatus: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  instanceStatus,
  onConnect,
  onDisconnect,
  onDelete
}) => {
  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={onConnect}
        disabled={instanceStatus === 'active'}
        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
      >
        <Play className="w-4 h-4" />
        <span>Conectar</span>
      </button>
      
      <button
        onClick={onDisconnect}
        disabled={instanceStatus !== 'active'}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
      >
        <Pause className="w-4 h-4" />
        <span>Desconectar</span>
      </button>
      
      <button
        onClick={onDelete}
        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
      >
        <Trash2 className="w-4 h-4" />
        <span>Excluir</span>
      </button>
    </div>
  );
};

export default ActionButtons;
