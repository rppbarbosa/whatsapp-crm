import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Star, 
  Archive,
  ChevronDown,
  MoreVertical,
  Eye,
  EyeOff,
  Bell,
  Pin,
  Trash2,
  Shield
} from 'lucide-react';

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  isBusiness?: boolean;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isBlocked?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  memberCount?: number;
  timestamp?: number;
}

interface ConversationListProps {
  contacts: WhatsAppContact[];
  selectedContact: WhatsAppContact | null;
  onContactSelect: (contact: WhatsAppContact) => void;
  onNewChat: () => void;
  loading: boolean;
  syncing: boolean;
  onSync: () => void;
  onContactUpdate?: (contactId: string, updates: Partial<WhatsAppContact>) => void;
  onContactDelete?: (contactId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  contacts,
  selectedContact,
  onContactSelect,
  onNewChat,
  loading,
  syncing,
  onSync,
  onContactUpdate,
  onContactDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'above' | 'below'>('below');

  const filters = [
    { id: 'all', label: 'Tudo' },
    { id: 'unread', label: 'Não lidas' },
    { id: 'favorites', label: 'Favoritas' },
    { id: 'groups', label: 'Grupos' }
  ];

  const filteredContacts = contacts.filter(contact => {
    // Filtrar conversas arquivadas e bloqueadas
    if (contact.isArchived || contact.isBlocked) return false;
    
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (activeFilter) {
      case 'unread':
        return (contact.unreadCount || 0) > 0;
      case 'favorites':
        return contact.isFavorite;
      case 'groups':
        return contact.isGroup;
      default:
        return true;
    }
  });

  // Separar conversas fixadas e normais
  const pinnedContacts = filteredContacts.filter(contact => contact.isPinned);
  const normalContacts = filteredContacts.filter(contact => !contact.isPinned);

  // Ordenar conversas fixadas por timestamp (mais recente primeiro)
  const sortedPinnedContacts = pinnedContacts.sort((a, b) => 
    (b.timestamp || 0) - (a.timestamp || 0)
  );

  // Ordenar conversas normais por timestamp (mais recente primeiro)
  const sortedNormalContacts = normalContacts.sort((a, b) => 
    (b.timestamp || 0) - (a.timestamp || 0)
  );

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const getContactInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Funções para as ações do dropdown
  const handleToggleReadStatus = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact && onContactUpdate) {
      const hasUnread = (contact.unreadCount || 0) > 0;
      if (hasUnread) {
        // Se tem mensagens não lidas, marcar como lida
        onContactUpdate(contactId, { unreadCount: 0 });
      } else {
        // Se não tem mensagens não lidas, marcar como não lida
        onContactUpdate(contactId, { unreadCount: 1 });
      }
    }
    setOpenDropdown(null);
  };

  const handleArchive = (contactId: string) => {
    if (onContactUpdate) {
      onContactUpdate(contactId, { isArchived: true });
    }
    setOpenDropdown(null);
  };

  const handleMute = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact && onContactUpdate) {
      onContactUpdate(contactId, { isMuted: !contact.isMuted });
    }
    setOpenDropdown(null);
  };

  const handlePin = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact && onContactUpdate) {
      onContactUpdate(contactId, { isPinned: !contact.isPinned });
    }
    setOpenDropdown(null);
  };

  const handleBlock = (contactId: string) => {
    if (onContactUpdate) {
      onContactUpdate(contactId, { isBlocked: true });
    }
    setOpenDropdown(null);
  };

  const handleDelete = (contactId: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta conversa? Esta ação não pode ser desfeita.')) {
      if (onContactDelete) {
        onContactDelete(contactId);
      }
    }
    setOpenDropdown(null);
  };

  // Função para calcular a posição do dropdown
  const calculateDropdownPosition = (contactId: string) => {
    const button = document.querySelector(`[data-contact-id="${contactId}"]`);
    if (button) {
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280; // Altura aproximada do dropdown
      
      // Se não há espaço suficiente abaixo, mostrar acima
      if (rect.bottom + dropdownHeight > viewportHeight) {
        setDropdownPosition('above');
      } else {
        setDropdownPosition('below');
      }
    }
  };



  // Fechar dropdown quando pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversas</h1>
          <button
            onClick={onNewChat}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200"
            title="Nova conversa"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar ou começar uma nova conversa"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-2 mt-3">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                activeFilter === filter.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Conversas */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ativa'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de pesquisa'
                : 'Sincronize seus dados do WhatsApp para ver as conversas'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={onSync}
                disabled={syncing}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2 mx-auto"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Sincronizando...' : 'Sincronizar dados'}</span>
              </button>
            )}
          </div>
                 ) : (
           <div className="space-y-1">
             {/* Seção de Conversas Fixadas */}
             {sortedPinnedContacts.length > 0 && (
               <>
                 <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                   <div className="flex items-center space-x-2">
                     <Pin className="w-4 h-4 text-blue-500" />
                     <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                       Conversas Fixadas
                     </span>
                   </div>
                 </div>
                 {sortedPinnedContacts.map((contact) => (
                             <div
                 key={contact.id}
                 onClick={(e) => {
                   // Se o dropdown estiver aberto, não abrir a conversa
                   if (openDropdown === contact.id) {
                     e.stopPropagation();
                     return;
                   }
                   
                   // Se outro dropdown estiver aberto, fechá-lo primeiro
                   if (openDropdown && openDropdown !== contact.id) {
                     setOpenDropdown(null);
                   }
                   
                   onContactSelect(contact);
                 }}
                 className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
                   selectedContact?.id === contact.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                 }`}
               >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-lg">
                      {contact.avatarUrl ? (
                        <img 
                          src={contact.avatarUrl} 
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        getContactInitial(contact.name)
                      )}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  {/* Informações do Contato */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {contact.name}
                      </h3>
                                             <div className="flex items-center space-x-2">
                         {contact.isPinned && (
                           <Pin className="w-4 h-4 text-blue-500" />
                         )}
                         {contact.isFavorite && (
                           <Star className="w-4 h-4 text-yellow-500 fill-current" />
                         )}
                         {contact.isMuted && (
                           <Bell className="w-4 h-4 text-gray-400" />
                         )}
                         <span className="text-xs text-gray-500 dark:text-gray-400">
                           {formatTime(contact.timestamp || Date.now())}
                         </span>
                       </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {contact.lastMessage || 'Nenhuma mensagem'}
                      </p>
                      {contact.isGroup && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {contact.memberCount} membros
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Indicadores */}
                  <div className="flex flex-col items-end space-y-1">
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                      </span>
                    )}
                    {contact.isBusiness && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                        Business
                      </span>
                    )}
                  </div>

                  {/* Botão de Ações */}
                  <div className="relative">
                                         <button
                       data-contact-id={contact.id}
                       onClick={(e) => {
                         e.stopPropagation();
                         if (openDropdown === contact.id) {
                           setOpenDropdown(null);
                         } else {
                           // Fechar outros dropdowns abertos
                           if (openDropdown) {
                             setOpenDropdown(null);
                           }
                           // Pequeno delay para garantir que o dropdown anterior seja fechado
                           setTimeout(() => {
                             calculateDropdownPosition(contact.id);
                             setOpenDropdown(contact.id);
                           }, 10);
                         }
                       }}
                       className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                     >
                       <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                     </button>

                                         {/* Dropdown de Ações */}
                     {openDropdown === contact.id && (
                       <>
                         {/* Overlay para fechar dropdown */}
                         <div 
                           className="fixed inset-0 z-40" 
                           onClick={(e) => {
                             e.stopPropagation();
                             setOpenDropdown(null);
                           }}
                         />
                                                  <div className={`absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 ${
                           dropdownPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
                         }`}>
                           {/* Seta indicativa */}
                           <div className={`absolute right-4 w-3 h-3 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform ${
                             dropdownPosition === 'above' 
                               ? 'bottom-0 translate-y-1/2 rotate-45' 
                               : 'top-0 -translate-y-1/2 rotate-45'
                           }`}></div>
                           <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReadStatus(contact.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                          >
                            {(contact.unreadCount || 0) > 0 ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                            <span>
                              {(contact.unreadCount || 0) > 0 
                                ? 'Marcar como lida' 
                                : 'Marcar como não lida'
                              }
                            </span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMute(contact.id);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                              contact.isMuted 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <Bell className="w-4 h-4" />
                            <span>{contact.isMuted ? 'Ativar notificações' : 'Silenciar notificações'}</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePin(contact.id);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                              contact.isPinned 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <Pin className="w-4 h-4" />
                            <span>{contact.isPinned ? 'Desafixar conversa' : 'Fixar conversa'}</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive(contact.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                          >
                            <Archive className="w-4 h-4" />
                            <span>Arquivar conversa</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlock(contact.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Bloquear</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(contact.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Apagar conversa</span>
                          </button>
                        </div>
                      </div>
                      </>
                    )}
                                     </div>
                 </div>
               </div>
                 ))}
               </>
             )}

             {/* Seção de Conversas Normais */}
             {sortedNormalContacts.length > 0 && (
               <>
                 {sortedPinnedContacts.length > 0 && (
                   <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-l-4 border-gray-300 dark:border-gray-600">
                     <div className="flex items-center space-x-2">
                       <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                         Outras Conversas
                       </span>
                     </div>
                   </div>
                 )}
                 {sortedNormalContacts.map((contact) => (
                   <div
                     key={contact.id}
                     onClick={(e) => {
                       // Se o dropdown estiver aberto, não abrir a conversa
                       if (openDropdown === contact.id) {
                         e.stopPropagation();
                         return;
                       }
                       
                       // Se outro dropdown estiver aberto, fechá-lo primeiro
                       if (openDropdown && openDropdown !== contact.id) {
                         setOpenDropdown(null);
                       }
                       
                       onContactSelect(contact);
                     }}
                     className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
                       selectedContact?.id === contact.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                     }`}
                   >
                     <div className="flex items-center space-x-3">
                       {/* Avatar */}
                       <div className="relative">
                         <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-lg">
                           {contact.avatarUrl ? (
                             <img 
                               src={contact.avatarUrl} 
                               alt={contact.name}
                               className="w-12 h-12 rounded-full object-cover"
                             />
                           ) : (
                             getContactInitial(contact.name)
                           )}
                         </div>
                         {contact.isOnline && (
                           <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                         )}
                       </div>

                       {/* Informações do Contato */}
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                           <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                             {contact.name}
                           </h3>
                           <div className="flex items-center space-x-2">
                             {contact.isPinned && (
                               <Pin className="w-4 h-4 text-blue-500" />
                             )}
                             {contact.isFavorite && (
                               <Star className="w-4 h-4 text-yellow-500 fill-current" />
                             )}
                             {contact.isMuted && (
                               <Bell className="w-4 h-4 text-gray-400" />
                             )}
                             <span className="text-xs text-gray-500 dark:text-gray-400">
                               {formatTime(contact.timestamp || Date.now())}
                             </span>
                           </div>
                         </div>
                         
                         <div className="flex items-center space-x-2">
                           <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                             {contact.lastMessage || 'Nenhuma mensagem'}
                           </p>
                           {contact.isGroup && (
                             <span className="text-xs text-gray-500 dark:text-gray-400">
                               {contact.memberCount} membros
                             </span>
                           )}
                         </div>
                       </div>

                       {/* Indicadores */}
                       <div className="flex flex-col items-end space-y-1">
                         {contact.unreadCount && contact.unreadCount > 0 && (
                           <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                             {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                           </span>
                         )}
                         {contact.isBusiness && (
                           <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                             Business
                           </span>
                         )}
                       </div>

                       {/* Botão de Ações */}
                       <div className="relative">
                         <button
                           data-contact-id={contact.id}
                           onClick={(e) => {
                             e.stopPropagation();
                             if (openDropdown === contact.id) {
                               setOpenDropdown(null);
                             } else {
                               // Fechar outros dropdowns abertos
                               if (openDropdown) {
                                 setOpenDropdown(null);
                               }
                               // Pequeno delay para garantir que o dropdown anterior seja fechado
                               setTimeout(() => {
                                 calculateDropdownPosition(contact.id);
                                 setOpenDropdown(contact.id);
                               }, 10);
                             }
                           }}
                           className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                         >
                           <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                         </button>

                         {/* Dropdown de Ações */}
                         {openDropdown === contact.id && (
                           <>
                             {/* Overlay para fechar dropdown */}
                             <div 
                               className="fixed inset-0 z-40" 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setOpenDropdown(null);
                               }}
                             />
                             <div className={`absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 ${
                               dropdownPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
                             }`}>
                               {/* Seta indicativa */}
                               <div className={`absolute right-4 w-3 h-3 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform ${
                                 dropdownPosition === 'above' 
                                   ? 'bottom-0 translate-y-1/2 rotate-45' 
                                   : 'top-0 -translate-y-1/2 rotate-45'
                               }`}></div>
                               <div className="py-1">
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleToggleReadStatus(contact.id);
                                   }}
                                   className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                                 >
                                   {(contact.unreadCount || 0) > 0 ? (
                                     <Eye className="w-4 h-4" />
                                   ) : (
                                     <EyeOff className="w-4 h-4" />
                                   )}
                                   <span>
                                     {(contact.unreadCount || 0) > 0 
                                       ? 'Marcar como lida' 
                                       : 'Marcar como não lida'
                                     }
                                   </span>
                                 </button>
                                 
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleMute(contact.id);
                                   }}
                                   className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                                     contact.isMuted 
                                       ? 'text-blue-600 dark:text-blue-400' 
                                       : 'text-gray-700 dark:text-gray-300'
                                   }`}
                                 >
                                   <Bell className="w-4 h-4" />
                                   <span>{contact.isMuted ? 'Ativar notificações' : 'Silenciar notificações'}</span>
                                 </button>
                                 
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handlePin(contact.id);
                                   }}
                                   className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                                     contact.isPinned 
                                       ? 'text-blue-600 dark:text-blue-400' 
                                       : 'text-gray-700 dark:text-gray-300'
                                   }`}
                                 >
                                   <Pin className="w-4 h-4" />
                                   <span>{contact.isPinned ? 'Desafixar conversa' : 'Fixar conversa'}</span>
                                 </button>
                                 
                                                                    <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleArchive(contact.id);
                                     }}
                                     className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                                   >
                                     <Archive className="w-4 h-4" />
                                     <span>Arquivar conversa</span>
                                   </button>
                                 
                                                                    <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleBlock(contact.id);
                                     }}
                                     className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                                   >
                                   <Shield className="w-4 h-4" />
                                   <span>Bloquear</span>
                                 </button>
                                 
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDelete(contact.id);
                                   }}
                                   className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                   <span>Apagar conversa</span>
                                 </button>
                               </div>
                             </div>
                           </>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </>
             )}
           </div>
        )}
      </div>

      {/* Seção Arquivadas */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center justify-between"
        >
          <span className="text-gray-600 dark:text-gray-400 font-medium">Arquivadas</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            showArchived ? 'rotate-180' : ''
          }`} />
        </button>
        
        {showArchived && (
          <div className="px-4 pb-4">
            {contacts.filter(c => c.isArchived).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                Nenhuma conversa arquivada
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.filter(c => c.isArchived).map((contact) => (
                                     <div
                     key={contact.id}
                     onClick={(e) => {
                       // Se algum dropdown estiver aberto, fechá-lo primeiro
                       if (openDropdown) {
                         setOpenDropdown(null);
                         return;
                       }
                       onContactSelect(contact);
                     }}
                     className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                   >
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                      {contact.avatarUrl ? (
                        <img 
                          src={contact.avatarUrl} 
                          alt={contact.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        getContactInitial(contact.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {contact.lastMessage || 'Nenhuma mensagem'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onContactUpdate) {
                            onContactUpdate(contact.id, { isArchived: false });
                          }
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onContactSelect(contact);
                        }}
                        className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
