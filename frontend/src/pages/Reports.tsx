import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600">Análises e métricas do seu WhatsApp CRM</p>
      </div>

      {/* Placeholder */}
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Relatórios em Desenvolvimento</h3>
        <p className="text-gray-500">
          Esta funcionalidade será implementada em breve. Aqui você poderá visualizar relatórios detalhados sobre leads, conversas e performance.
        </p>
      </div>
    </div>
  );
} 