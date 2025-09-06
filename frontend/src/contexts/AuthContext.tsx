import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Chave para localStorage
const AUTH_STORAGE_KEY = 'whatsapp_crm_auth';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar se há usuário salvo no localStorage
  useEffect(() => {
    const checkStoredAuth = async () => {
      try {
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          
          if (authData.token && authData.user) {
            // Verificar se o token ainda é válido no backend
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'whatsapp-crm-evolution-key-2024-secure',
                'Authorization': `Bearer ${authData.token}`
              }
            });
            
            if (response.ok) {
              setUser(authData.user);
              setIsAuthenticated(true);
            } else {
              // Token inválido, limpar localStorage
              localStorage.removeItem(AUTH_STORAGE_KEY);
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // Dados inválidos, limpar localStorage
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação salva:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email e senha são obrigatórios' };
      }

      // Fazer requisição para o backend para verificar credenciais
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'whatsapp-crm-evolution-key-2024-secure'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Salvar token no localStorage
        const token = data.token || `token_${Date.now()}`;
        const userData: User = {
          id: data.user?.id || Date.now().toString(),
          name: data.user?.name || email.split('@')[0],
          email: email,
          createdAt: data.user?.createdAt || new Date().toISOString()
        };

        // Salvar token e dados do usuário
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user: userData }));
        setUser(userData);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Credenciais inválidas' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validação básica
      if (!name || !email || !password) {
        return { success: false, error: 'Todos os campos são obrigatórios' };
      }

      if (!email.includes('@')) {
        return { success: false, error: 'Email inválido' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
      }

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar se já existe usuário com este email
      const existingAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (existingAuth) {
        const existingUser = JSON.parse(existingAuth);
        if (existingUser.email === email) {
          return { success: false, error: 'Usuário já existe com este email' };
        }
      }

      const userData: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      };

      // Salvar no localStorage
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const logout = async () => {
    try {
      // Notificar o backend sobre o logout (opcional)
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        if (authData.token) {
          try {
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'whatsapp-crm-evolution-key-2024-secure',
                'Authorization': `Bearer ${authData.token}`
              }
            });
          } catch (error) {
            console.error('Erro ao notificar logout no backend:', error);
          }
        }
      }

      // Limpar localStorage e estado
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, limpar dados locais
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Email inválido' };
      }

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Em um sistema real, aqui enviaríamos um email
      return { success: true };
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    resetPassword
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