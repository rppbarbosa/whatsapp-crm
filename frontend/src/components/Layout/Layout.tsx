import React from 'react';
import { Sidebar } from '../Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LogOut, 
  User, 
  Settings, 
  Smartphone,
  Search,
  Menu
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import UserProfileDropdown from '../UserProfileDropdown';
import NotificationBell from '../NotificationBell';
import Breadcrumbs from '../Breadcrumbs';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header Profissional */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo - Logo e Navegação */}
            <div className="flex items-center space-x-4">
              {/* Botão Mobile Menu (visível apenas em telas pequenas) */}
              <button className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Logo e Título */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    WhatsApp CRM
                  </h1>
                  <p className="text-xs text-gray-500">
                    Sistema de Gestão de Clientes
                  </p>
                </div>
              </div>
              
              {/* Separador */}
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              
              {/* Barra de Pesquisa */}
              <div className="hidden md:block relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar leads, conversas..."
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
            </div>
            
            {/* Lado Direito - Ações do Usuário */}
            <div className="flex items-center space-x-3">
              {/* Botão de Pesquisa Mobile */}
              <button className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <Search className="h-5 w-5" />
              </button>
              
              {/* Notificações */}
              <NotificationBell />
              
              {/* Separador */}
              <div className="h-6 w-px bg-gray-300"></div>
              
              {/* Dropdown do Perfil do Usuário */}
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Breadcrumbs */}
            <Breadcrumbs />
            
            {/* Conteúdo da página */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
} 