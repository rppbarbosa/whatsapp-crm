import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Shield,
  Smartphone,
  Bell,
  HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {/* Avatar do Usuário */}
        <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {getInitials(user.name)}
        </div>
        
        {/* Informações do Usuário */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        
        {/* Ícone de dropdown */}
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Header do Dropdown */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu de Opções */}
          <div className="py-1">
            {/* Ver Perfil */}
            <button
              onClick={() => {
                // TODO: Navegar para página de perfil
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <User className="h-4 w-4 mr-3 text-gray-400" />
              Ver Perfil
            </button>

            {/* Configurações */}
            <button
              onClick={() => {
                // TODO: Navegar para configurações
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <Settings className="h-4 w-4 mr-3 text-gray-400" />
              Configurações
            </button>

            {/* Notificações */}
            <button
              onClick={() => {
                // TODO: Abrir configurações de notificação
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <Bell className="h-4 w-4 mr-3 text-gray-400" />
              Notificações
            </button>

            {/* Segurança */}
            <button
              onClick={() => {
                // TODO: Abrir configurações de segurança
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <Shield className="h-4 w-4 mr-3 text-gray-400" />
              Segurança
            </button>

            {/* Ajuda */}
            <button
              onClick={() => {
                // TODO: Abrir página de ajuda
                setIsOpen(false);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <HelpCircle className="h-4 w-4 mr-3 text-gray-400" />
              Ajuda e Suporte
            </button>

            {/* Separador */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Informações da Conta */}
            <div className="px-4 py-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Membro desde</span>
                <span>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>ID da Conta</span>
                <span className="font-mono">{user.id.slice(0, 8)}...</span>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair da Conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;

