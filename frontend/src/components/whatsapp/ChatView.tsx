import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Paperclip, 
  Image as ImageIcon, 
  Camera, 
  ArrowLeft
} from 'lucide-react';
import { MessageInput } from './MessageInput';
import { MediaPreviewModal } from './MediaPreviewModal';
import { EmojiPicker } from './EmojiPicker';
import { MediaMessage } from './MediaMessage';
import { SecureMediaDownload } from './SecureMediaDownload';

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
  isArchived?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  memberCount?: number;
  timestamp?: number;
}

interface MediaInfo {
  type: string;
  hasMedia: boolean;
  filename?: string;
  mimetype?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
  url?: string;
  error?: string;
}

interface WhatsAppMessage {
  id: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  mediaDuration?: number;
  mediaInfo?: MediaInfo;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  isFromMe: boolean;
}

interface ChatViewProps {
  contact: WhatsAppContact;
  messages: WhatsAppMessage[];
  loading: boolean;
  loadingHistory?: boolean;
  hasMoreHistory?: boolean;
  totalMessages?: number;
  isUserScrolling?: boolean;
  shouldAutoScroll?: boolean;
  onSendMessage: (message: string) => void;
  onSendMedia: (file: File, type: 'image' | 'video' | 'audio' | 'document', message?: string) => void;
  onBackToConversations: () => void;
  onLoadEarlierMessages?: () => void;
  onUserScrollChange?: (isScrolling: boolean) => void;
  onAutoScrollChange?: (shouldScroll: boolean) => void;
  onContactUpdate?: (contactId: string, updates: Partial<WhatsAppContact>) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  contact,
  messages,
  loading,
  loadingHistory = false,
  hasMoreHistory = false,
  totalMessages = 0,
  isUserScrolling = false,
  shouldAutoScroll = true,
  onSendMessage,
  onSendMedia,
  onBackToConversations,
  onLoadEarlierMessages,
  onUserScrollChange,
  onAutoScrollChange,
  onContactUpdate
}) => {
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handler para scroll infinito e detecção de navegação do usuário
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollThreshold = 100;

    // Detectar se usuário está navegando no histórico (não está no final)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    const userIsScrolling = !isNearBottom;

    // Notificar mudança de estado de scroll
    if (onUserScrollChange && userIsScrolling !== isUserScrolling) {
      onUserScrollChange(userIsScrolling);
    }

    // Auto scroll apenas quando próximo do final
    if (onAutoScrollChange) {
      onAutoScrollChange(isNearBottom);
    }

    // Carregar mensagens anteriores apenas no topo
    if (scrollTop <= scrollThreshold && onLoadEarlierMessages && !loadingHistory && hasMoreHistory) {
      console.log('📜 Scroll no topo detectado, carregando mensagens anteriores...');
      onLoadEarlierMessages();
    }
  }, [onLoadEarlierMessages, loadingHistory, hasMoreHistory, onUserScrollChange, onAutoScrollChange, isUserScrolling]);

  useEffect(() => {
    // Só faz scroll automático se o usuário não estiver navegando no histórico
    if (shouldAutoScroll && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, isUserScrolling]);

  // Adicionar event listener para scroll infinito
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  // Funções para manipular arquivos e mídia
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'document') => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowMediaPreview(true);
      
      if (type === 'image' || type === 'video') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSendMedia = (message: string = '') => {
    if (selectedFile) {
      const type = selectedFile.type.startsWith('image/') ? 'image' :
                   selectedFile.type.startsWith('video/') ? 'video' :
                   selectedFile.type.startsWith('audio/') ? 'audio' : 'document';
      
      onSendMedia(selectedFile, type, message);
      setSelectedFile(null);
      setMediaPreview('');
      setShowMediaPreview(false);
    }
  };

  const handleCancelMedia = () => {
    setSelectedFile(null);
    setMediaPreview('');
    setShowMediaPreview(false);
  };

  const handleTakePhoto = () => {
    // Simular captura de foto (em produção, usaríamos a API de câmera)
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#333';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Foto Capturada', 320, 240);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'foto.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          setShowMediaPreview(true);
          setMediaPreview(canvas.toDataURL());
        }
      }, 'image/jpeg');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  // Função para detectar se o texto é uma mídia base64
  const isBase64Media = (text: string) => {
    if (!text || typeof text !== 'string') return false;
    
    // Verificar se é uma string base64 longa (provavelmente mídia)
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    const isLongBase64 = text.length > 100 && base64Regex.test(text);
    
    // Verificar assinaturas de mídia conhecidas
    const isImage = text.startsWith('/9j/') || text.startsWith('iVBORw0KGgo') || text.startsWith('R0lGOD');
    const isAudio = text.startsWith('UklGR') || text.startsWith('SUQz');
    const isPdf = text.startsWith('JVBERi0');
    
    return isLongBase64 && (isImage || isAudio || isPdf);
  };

  // Detectar tipo MIME a partir de dados base64
  const getMimeTypeFromBase64 = (base64String: string): string => {
    if (!base64String || typeof base64String !== 'string') return 'application/octet-stream';
    
    // Verificar assinaturas de arquivos conhecidas
    if (base64String.startsWith('/9j/')) {
      return 'image/jpeg';
    }
    if (base64String.startsWith('iVBORw0KGgo')) {
      return 'image/png';
    }
    if (base64String.startsWith('R0lGOD')) {
      return 'image/gif';
    }
    if (base64String.startsWith('UklGR')) {
      return 'audio/wav';
    }
    if (base64String.startsWith('SUQz')) {
      return 'audio/mpeg';
    }
    if (base64String.startsWith('JVBERi0')) {
      return 'application/pdf';
    }
    
    return 'application/octet-stream';
  };

  // Detectar tipo de mídia baseado no conteúdo base64
  const detectMediaTypeFromBase64 = (base64String: string): string => {
    if (!base64String || typeof base64String !== 'string') return 'document';
    
    // Imagens
    if (base64String.startsWith('/9j/') || base64String.startsWith('iVBORw0KGgo') || base64String.startsWith('R0lGOD')) {
      return 'image';
    }
    
    // Áudios
    if (base64String.startsWith('UklGR') || base64String.startsWith('SUQz')) {
      return 'audio';
    }
    
    // PDFs
    if (base64String.startsWith('JVBERi0')) {
      return 'document';
    }
    
    return 'document';
  };

  // Obter extensão de arquivo baseada no MIME type
  const getFileExtensionFromBase64 = (base64String: string): string => {
    const mimetype = getMimeTypeFromBase64(base64String);
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt'
    };
    
    return mimeMap[mimetype] || 'bin';
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <div className="w-4 h-4 text-gray-400">✓</div>;
      case 'delivered':
        return <div className="w-4 h-4 text-blue-400">✓✓</div>;
      case 'read':
        return <div className="w-4 h-4 text-blue-500">✓✓</div>;
      case 'failed':
        return <div className="w-4 h-4 text-red-500">✗</div>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900">
      {/* Header do Chat */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 relative z-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          {/* Botão Voltar */}
          <button
            onClick={onBackToConversations}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            title="Voltar para conversas"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Avatar do Contato */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-lg">
              {contact.avatarUrl ? (
                <img 
                  src={contact.avatarUrl} 
                  alt={contact.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                contact.name.charAt(0).toUpperCase()
              )}
            </div>
            {contact.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            )}
          </div>

          {/* Informações do Contato */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {contact.name}
              </h3>
              {contact.isArchived && (
                <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                  Arquivada
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {contact.isOnline ? 'online' : 'offline'}
              {contact.isGroup && ` • ${contact.memberCount} membros`}
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {onContactUpdate && (
              <button
                onClick={() => onContactUpdate(contact.id, { isArchived: !contact.isArchived })}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                title={contact.isArchived ? "Desarquivar conversa" : "Arquivar conversa"}
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </button>
            )}
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
      >
        {/* Indicador de carregamento de histórico */}
        {loadingHistory && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              <span className="text-sm">Carregando mensagens antigas...</span>
            </div>
          </div>
        )}

        {/* Indicador de mais histórico disponível */}
        {hasMoreHistory && !loadingHistory && (
          <div className="flex justify-center py-2">
            <button 
              onClick={onLoadEarlierMessages}
              className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
            >
              📜 Carregar mensagens anteriores
            </button>
          </div>
        )}

        {/* Badge com total de mensagens */}
        {totalMessages > 0 && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              📚 {totalMessages} mensagens no histórico
            </span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-6">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Inicie a conversa enviando uma mensagem!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);

            return (
              <div key={`${message.id}_${index}`}>
                {/* Separador de Data */}
                {showDate && (
                  <div className="flex justify-center mb-2">
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}

                {/* Mensagem */}
                <div className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.isFromMe 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {/* Conteúdo da Mensagem */}
                    {message.type === 'text' && !isBase64Media(message.text) && (
                      <p className="text-sm">{message.text}</p>
                    )}
                    
       {/* Detectar mídia base64 não processada */}
       {message.type === 'text' && isBase64Media(message.text) && (
         <div className="mb-2">
           <SecureMediaDownload
             mediaInfo={{
               type: detectMediaTypeFromBase64(message.text),
               hasMedia: true,
               filename: `media_${message.id}.${getFileExtensionFromBase64(message.text)}`,
               mimetype: getMimeTypeFromBase64(message.text),
               url: message.text,
               size: message.text.length
             }}
             isFromMe={message.isFromMe}
             caption="Mídia não processada - clique em baixar para visualizar"
           />
         </div>
       )}
                    
       {/* Mídia usando o componente seguro */}
       {message.type !== 'text' && message.mediaInfo && (
         <div className="mb-2">
           <SecureMediaDownload
             mediaInfo={message.mediaInfo}
             isFromMe={message.isFromMe}
             caption={message.text}
           />
         </div>
       )}
                    
                    {/* Fallback para mídias antigas sem mediaInfo */}
                    {message.type === 'image' && message.mediaUrl && !message.mediaInfo && (
                      <div className="mb-2">
                        <img 
                          src={message.mediaUrl} 
                          alt="Imagem" 
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.mediaUrl, '_blank')}
                        />
                      </div>
                    )}
                    
                    {message.type === 'video' && message.mediaUrl && !message.mediaInfo && (
                      <div className="mb-2 relative">
                        <video 
                          ref={videoRef}
                          src={message.mediaUrl} 
                          className="max-w-full rounded-lg"
                          controls
                          preload="metadata"
                        />
                        {message.mediaDuration && (
                          <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {Math.floor(message.mediaDuration / 60)}:{(message.mediaDuration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {message.type === 'audio' && message.mediaUrl && !message.mediaInfo && (
                      <div className="mb-2">
                        <audio 
                          ref={audioRef}
                          src={message.mediaUrl} 
                          controls 
                          className="w-full"
                          preload="metadata"
                        />
                      </div>
                    )}
                    
                    {message.type === 'document' && message.mediaUrl && !message.mediaInfo && (
                      <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">DOC</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{message.mediaName || 'Documento'}</p>
                            {message.mediaSize && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round(message.mediaSize / 1024)} KB
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => window.open(message.mediaUrl, '_blank')}
                            className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            <span className="text-xs">📥</span>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Texto da mensagem (se houver e não for base64) */}
                    {message.text && message.type !== 'text' && !isBase64Media(message.text) && (
                      <p className="text-sm mt-1">{message.text}</p>
                    )}
                    
                    {/* Timestamp e Status */}
                    <div className={`flex items-center justify-end mt-1 space-x-1 ${
                      message.isFromMe ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span className="text-xs">{formatTime(message.timestamp)}</span>
                      {message.isFromMe && getMessageStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0 relative">
        <div className="flex items-center space-x-2 w-full">
          {/* Botões de Anexo */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 flex-shrink-0"
            title="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 flex-shrink-0"
            title="Anexar imagem"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleTakePhoto}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 flex-shrink-0"
            title="Tirar foto"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Campo de Texto */}
          <div className="flex-1 min-w-0">
            <MessageInput
              value={messageText}
              onChange={setMessageText}
              onSend={handleSendMessage}
              onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
              showEmojiPicker={showEmojiPicker}
              className="w-full"
            />
          </div>
        </div>

        {/* Picker de Emoji */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-50">
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setMessageText(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* Modal de Preview de Mídia */}
        <MediaPreviewModal
          isOpen={showMediaPreview}
          onClose={handleCancelMedia}
          file={selectedFile}
          mediaPreview={mediaPreview}
          onSend={handleSendMedia}
          onCancel={handleCancelMedia}
        />

        {/* Inputs de Arquivo (ocultos) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
          onChange={(e) => handleFileSelect(e, 'document')}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e, 'image')}
          className="hidden"
        />
      </div>
    </div>
  );
};
