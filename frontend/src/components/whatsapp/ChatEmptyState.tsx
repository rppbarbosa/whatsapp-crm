import React from 'react';
import { Phone, CheckCircle } from 'lucide-react';

interface ChatEmptyStateProps {
  title?: string;
  description?: string;
  features?: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  className?: string;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  title = "Selecione uma conversa",
  description = "Escolha um contato da lista para iniciar uma conversa e começar a trocar mensagens",
  features = [
    {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      text: "Mensagens criptografadas"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      text: "Sincronização automática"
    }
  ],
  className = ''
}) => {
  return (
    <div className={`flex-1 flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Phone className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h3>
        <p className="text-gray-600 mb-6">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              {feature.icon}
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
