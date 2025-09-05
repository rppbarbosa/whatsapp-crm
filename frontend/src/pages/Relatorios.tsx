import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const Relatorios: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30dias');
  const [selectedMetric, setSelectedMetric] = useState('vendas');
  const [showFilters, setShowFilters] = useState(false);

  // Dados simulados para demonstração
  const metrics = {
    vendas: {
      total: 125000,
      change: 12.5,
      trend: 'up',
      data: [12000, 15000, 18000, 22000, 25000, 28000, 32000, 35000, 38000, 42000, 45000, 48000]
    },
    leads: {
      total: 156,
      change: -3.2,
      trend: 'down',
      data: [45, 52, 48, 61, 55, 58, 63, 59, 65, 68, 62, 70]
    },
    conversoes: {
      total: 23.4,
      change: 8.7,
      trend: 'up',
      data: [18, 20, 22, 25, 23, 26, 28, 27, 30, 32, 29, 33]
    },
    receita: {
      total: 89000,
      change: 15.3,
      trend: 'up',
      data: [8000, 9500, 11000, 12500, 14000, 15500, 17000, 18500, 20000, 21500, 23000, 24500]
    }
  };

  const periods = [
    { value: '7dias', label: 'Últimos 7 dias' },
    { value: '30dias', label: 'Últimos 30 dias' },
    { value: '90dias', label: 'Últimos 90 dias' },
    { value: '1ano', label: 'Último ano' }
  ];

  const metricOptions = [
    { value: 'vendas', label: 'Vendas', icon: DollarSign, color: 'text-green-600' },
    { value: 'leads', label: 'Leads', icon: Users, color: 'text-blue-600' },
    { value: 'conversoes', label: 'Conversões', icon: TrendingUp, color: 'text-purple-600' },
    { value: 'receita', label: 'Receita', icon: BarChart3, color: 'text-orange-600' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const currentMetric = metrics[selectedMetric as keyof typeof metrics];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-500">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Relatórios e Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Acompanhe o desempenho do seu negócio com métricas detalhadas
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-6 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {periods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Métrica Principal
                </label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {metricOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Equipe
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    <option>Todas as equipes</option>
                    <option>Vendas</option>
                    <option>Marketing</option>
                    <option>Suporte</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Região
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    <option>Todas as regiões</option>
                    <option>São Paulo</option>
                    <option>Rio de Janeiro</option>
                    <option>Minas Gerais</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Produto
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    <option>Todos os produtos</option>
                    <option>CRM Básico</option>
                    <option>CRM Profissional</option>
                    <option>CRM Enterprise</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricOptions.map((option) => {
            const metric = metrics[option.value as keyof typeof metrics];
            const Icon = option.icon;
            
            return (
              <div key={option.value} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-700`}>
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {option.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {option.value === 'vendas' || option.value === 'receita' 
                      ? formatCurrency(metric.total)
                      : option.value === 'conversoes'
                      ? `${metric.total}%`
                      : formatNumber(metric.total)
                    }
                  </p>
                </div>
                
                <div className="flex items-center">
                  {getTrendIcon(metric.trend)}
                  <span className={`ml-2 text-sm font-medium ${getTrendColor(metric.trend)}`}>
                    {formatPercentage(metric.change)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    vs período anterior
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="px-6 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Evolução de {metricOptions.find(opt => opt.value === selectedMetric)?.label}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Últimos 12 meses
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Gráfico Simulado */}
          <div className="h-80 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-end justify-center space-x-2 p-6">
            {currentMetric.data.map((value, index) => {
              const maxValue = Math.max(...currentMetric.data);
              const height = (value / maxValue) * 100;
              const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-green-500"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {months[index]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Relatórios Detalhados */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Performers
            </h3>
            <div className="space-y-4">
              {[
                { name: 'João Silva', sales: 45000, change: 15.2, avatar: 'JS' },
                { name: 'Maria Santos', sales: 38000, change: 12.8, avatar: 'MS' },
                { name: 'Carlos Oliveira', sales: 32000, change: 8.5, avatar: 'CO' },
                { name: 'Ana Costa', sales: 28000, change: 6.2, avatar: 'AC' },
                { name: 'Pedro Lima', sales: 25000, change: 4.1, avatar: 'PL' }
              ].map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {performer.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{performer.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(performer.sales)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">+{performer.change}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atividades Recentes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Atividades Recentes
            </h3>
            <div className="space-y-4">
              {[
                { action: 'Lead convertido', detail: 'João Silva fechou venda de R$ 15.000', time: '2 horas atrás', type: 'success' },
                { action: 'Nova proposta', detail: 'Maria Santos enviou proposta para TechCorp', time: '4 horas atrás', type: 'info' },
                { action: 'Follow-up agendado', detail: 'Carlos Oliveira agendou reunião para amanhã', time: '6 horas atrás', type: 'warning' },
                { action: 'Lead perdido', detail: 'Ana Costa não respondeu após 3 tentativas', time: '1 dia atrás', type: 'error' },
                { action: 'Novo lead', detail: 'Pedro Lima adicionado ao pipeline', time: '1 dia atrás', type: 'success' }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'info' ? 'bg-blue-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.detail}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights e Recomendações */}
      <div className="px-6 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Insights e Recomendações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Tendência Positiva</h4>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Suas vendas cresceram 12.5% este mês. Continue focando em leads de alta qualidade.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Atenção Necessária</h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                23% dos leads não receberam follow-up nos últimos 7 dias. Priorize o contato.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <h4 className="font-medium text-green-900 dark:text-green-100">Oportunidade</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Seus leads de alta prioridade têm 3x mais chances de conversão. Foque neles!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
