import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há token salvo ao inicializar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // TODO: Validar token com backend
          // Por enquanto, vamos simular um usuário
          const savedUser = localStorage.getItem('auth_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // TODO: Implementar chamada real para API
      // Por enquanto, vamos simular um login bem-sucedido
      const mockUser: User = {
        id: 'user-123',
        email,
        name: 'Usuário Teste',
        createdAt: new Date().toISOString(),
        isActive: true
      };

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Salvar dados de autenticação
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      return true;
      
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // TODO: Implementar chamada real para API
      // Por enquanto, vamos simular um cadastro bem-sucedido
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        name,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Salvar dados de autenticação
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      return true;
      
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // TODO: Implementar chamada real para API
        // Por enquanto, vamos manter o usuário atual
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
