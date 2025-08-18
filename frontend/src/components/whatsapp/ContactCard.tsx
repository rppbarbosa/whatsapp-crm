import React from 'react';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { 
  CheckCircleIcon, 
  BuildingOfficeIcon,
  PhoneIcon 
} from '@heroicons/react/24/outline';

export interface ContactCardProps {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  lastMessage?: string;
  timestamp?: Date;
  unreadCount?: number;
  isOnline?: boolean;
  isBusiness?: boolean;
  isVerified?: boolean;
  status?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const formatTime = (date: Date) => {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (diffInHours < 48) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }
};

export const ContactCard: React.FC<ContactCardProps> = ({
  id,
  name,
  phone,
  avatarUrl,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isOnline = false,
  isBusiness = false,
  isVerified = false,
  status,
  isSelected = false,
  onClick,
}) => {
  return (
    <div
      className={cn(
        'flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100',
        isSelected && 'bg-primary-50 border-primary-200'
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mr-3">
        <Avatar
          src={avatarUrl}
          fallback={name}
          size="md"
          status={isOnline ? 'online' : 'offline'}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {name}
            </h3>
            
            {isBusiness && (
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
            )}
            
            {isVerified && (
              <CheckCircleIcon className="w-4 h-4 text-blue-500" />
            )}
          </div>

          <div className="flex items-center space-x-2">
            {timestamp && (
              <span className="text-xs text-gray-500">
                {formatTime(timestamp)}
              </span>
            )}
            
            {unreadCount > 0 && (
              <Badge
                variant="primary"
                size="sm"
                className="bg-primary-600 text-white"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center space-x-2 min-w-0">
            {lastMessage ? (
              <p className="text-sm text-gray-600 truncate">
                {lastMessage}
              </p>
            ) : (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <PhoneIcon className="w-3 h-3" />
                <span>{phone}</span>
              </div>
            )}
          </div>

          {status && (
            <Badge
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}; 