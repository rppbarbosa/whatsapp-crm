export class DataConverter {
  /**
   * Converte contatos do formato mockado para o formato esperado pelo ConversationList
   */
  static convertContactsForConversationList(contacts: any[]) {
    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      avatarUrl: contact.avatarUrl,
      isOnline: contact.online,
      isGroup: contact.isGroup,
      isBusiness: contact.isBusiness || false,
      isFavorite: contact.isFavorite || false,
      isBookmarked: contact.isBookmarked || false,
      isPinned: contact.isPinned || false,
      isMuted: contact.isMuted || false,
      isArchived: contact.isArchived || false,
      isBlocked: contact.isBlocked || false,
      unreadCount: contact.unreadCount,
      lastMessage: contact.lastMessage,
      memberCount: contact.memberCount,
      timestamp: new Date(contact.lastActivity || Date.now()).getTime()
    }));
  }

  /**
   * Converte mensagens do formato mockado para o formato esperado pelo ChatView
   */
  static convertMessagesForChatView(messages: any[]) {
    return messages.map(message => ({
      id: message.id,
      text: message.text,
      timestamp: new Date(),
      type: 'text' as const,
      mediaUrl: undefined,
      mediaName: undefined,
      mediaSize: undefined,
      mediaDuration: undefined,
      status: message.status,
      isFromMe: message.isFromMe
    }));
  }

  /**
   * Converte contato individual para o formato esperado pelo ChatView
   */
  static convertContactForChatView(contact: any) {
    return {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      avatarUrl: contact.avatarUrl,
      isOnline: contact.online,
      isGroup: contact.isGroup,
      isBusiness: contact.isBusiness || false,
      isFavorite: contact.isFavorite || false,
      isBookmarked: contact.isBookmarked || false,
      isArchived: contact.isArchived || false,
      unreadCount: contact.unreadCount,
      lastMessage: contact.lastMessage,
      memberCount: contact.memberCount,
      timestamp: new Date(contact.lastActivity || Date.now()).getTime()
    };
  }

  /**
   * Converte atualizações de contato para o formato esperado pelo hook
   */
  static convertContactUpdates(updates: any) {
    const convertedUpdates: any = {};
    
    if (updates.isArchived !== undefined) {
      convertedUpdates.isArchived = updates.isArchived;
    }
    
    if (updates.isPinned !== undefined) {
      convertedUpdates.isPinned = updates.isPinned;
    }
    
    if (updates.isMuted !== undefined) {
      convertedUpdates.isMuted = updates.isMuted;
    }
    
    if (updates.unreadCount !== undefined) {
      convertedUpdates.unreadCount = updates.unreadCount;
    }
    
    return convertedUpdates;
  }
}
