import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, GitBranch, MessageCircle, Settings, BarChart3, Wrench } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/pipeline-vendas', label: 'Pipeline de Vendas', icon: GitBranch },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { path: '/gerenciar-instancias', label: 'Gerenciar Instâncias', icon: Wrench },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 dark:from-gray-950 dark:to-gray-900 text-white shadow-xl transition-all duration-500">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 dark:border-gray-600">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
          WhatsApp CRM
        </h1>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer com Toggle de Tema */}
      <div className="mt-auto p-4 border-t border-gray-700 dark:border-gray-600">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
