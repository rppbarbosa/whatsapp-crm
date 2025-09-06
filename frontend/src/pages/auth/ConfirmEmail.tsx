import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const ConfirmEmail: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular confirmação de email (em um sistema real, isso seria feito no backend)
    const confirmEmailToken = async () => {
      try {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Para demonstração, sempre confirmar com sucesso
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (err) {
        setError('Erro interno do servidor');
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmailToken();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader className="w-16 h-16 text-green-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmando Email</h2>
          <p className="text-gray-600">Aguarde enquanto confirmamos seu email...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Confirmado!</h2>
          <p className="text-gray-600 mb-6">
            Seu email foi confirmado com sucesso. Você será redirecionado para o dashboard em alguns segundos.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro na Confirmação</h2>
        <p className="text-gray-600 mb-6">
          {error || 'Não foi possível confirmar seu email. Tente novamente.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
