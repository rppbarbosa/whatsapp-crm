import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Verificar se a sessão expirou quando não está carregando
  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      // Verificar se há token no localStorage para saber se foi uma sessão expirada
      const storedAuth = localStorage.getItem('whatsapp_crm_auth');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          if (authData.token) {
            // Sessão expirou
            toast.error('Sessão expirada. Faça login novamente.', {
              duration: 4000,
              style: {
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500'
              },
              icon: '⚠️'
            });
          }
        } catch (error) {
          // Dados corrompidos no localStorage
          console.error('Erro ao verificar dados de autenticação:', error);
        }
      }
    }
  }, [isLoading, requireAuth, isAuthenticated]);

  // Mostrar loading apenas por um tempo muito curto
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se requer autenticação mas usuário não está logado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Se não requer autenticação mas usuário está logado (ex: página de login)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;