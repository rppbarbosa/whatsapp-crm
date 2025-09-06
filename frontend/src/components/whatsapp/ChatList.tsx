import React from 'react';
import { Users } from 'lucide-react';

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessage?: {
    body: string;
    timestamp: number;
    from: string;
  };
  unreadCount: number;
}

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, selectedChat, onSelectChat }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Conversas
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedChat?.id === chat.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {chat.name}
                  </h4>
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage.body}
                    </p>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            Nenhuma conversa encontrada
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
