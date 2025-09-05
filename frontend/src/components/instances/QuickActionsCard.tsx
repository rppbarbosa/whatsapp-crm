import React from 'react';
import {
  Settings,
  Activity,
  RefreshCw
} from 'lucide-react';

interface QuickActionsCardProps {
  onRestartInstance: () => void;
  isGeneratingQR: boolean;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ 
  onRestartInstance, 
  isGeneratingQR 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-gray-400 mr-3" />
            <span>Configurações</span>
          </div>
          <span className="text-gray-400">→</span>
        </button>
        
        <button className="w-full flex items-center justify-between p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-gray-400 mr-3" />
            <span>Logs de Sistema</span>
          </div>
          <span className="text-gray-400">→</span>
        </button>
        
        <button 
          onClick={onRestartInstance}
          disabled={isGeneratingQR}
          className="w-full flex items-center justify-between p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <div className="flex items-center">
            <RefreshCw className={`w-5 h-5 text-gray-400 mr-3 ${isGeneratingQR ? 'animate-spin' : ''}`} />
            <span>{isGeneratingQR ? 'Gerando...' : 'Reiniciar Instância'}</span>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActionsCard;
