# EmojiPicker Component

## Visão Geral

O componente `EmojiPicker` é uma implementação profissional de seleção de emojis baseada na biblioteca **Emoji Mart**, que oferece uma experiência similar ao WhatsApp Web.

## Funcionalidades

### ✅ Seleção de Emojis
- **+3000 emojis** disponíveis em todas as categorias
- **Interface moderna** e responsiva
- **Categorização inteligente** por tipo de emoji
- **Busca rápida** com placeholder em português

### ✅ Fechamento Automático (Padrão Profissional)
- **Clique fora**: Fecha automaticamente quando clica fora do picker
- **Tecla Escape**: Fecha ao pressionar a tecla ESC
- **Comportamento nativo**: Segue o padrão do WhatsApp e outras aplicações profissionais

### ✅ Categorias Disponíveis
- 🕒 **Recentes** - Emojis mais utilizados
- 😀 **Smileys** - Expressões faciais
- 👋 **Pessoas** - Gestos e pessoas
- 🌱 **Natureza** - Plantas e fenômenos naturais
- 🍔 **Comida** - Alimentos e bebidas
- ⚽ **Atividade** - Esportes e hobbies
- 🚗 **Lugares** - Transporte e locais
- 💡 **Objetos** - Itens e ferramentas
- 💕 **Símbolos** - Corações e símbolos
- 🏁 **Bandeiras** - Países e regiões

## Implementação Técnica

### Hook useEffect para Fechamento Automático

```typescript
useEffect(() => {
  // Detectar cliques fora do componente
  const handleClickOutside = (event: MouseEvent) => {
    if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  // Detectar tecla Escape
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  // Adicionar event listeners
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleEscapeKey);

  // Cleanup para evitar memory leaks
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleEscapeKey);
  };
}, [onClose]);
```

### Ref para Detectar Cliques Fora

```typescript
const pickerRef = useRef<HTMLDivElement>(null);

// Aplicar ref ao elemento raiz
<div ref={pickerRef} className={`${className}`}>
```

## Uso no ChatView

### Integração com MessageInput

```typescript
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
```

### Estados de Controle

```typescript
const [showEmojiPicker, setShowEmojiPicker] = useState(false);

// Abrir picker
const handleToggleEmojiPicker = () => {
  setShowEmojiPicker(!showEmojiPicker);
};

// Fechar picker
const handleCloseEmojiPicker = () => {
  setShowEmojiPicker(false);
};
```

## Configurações Personalizáveis

### EMOJI_PICKER_CONFIG

```typescript
export const EMOJI_PICKER_CONFIG = {
  theme: 'light',                    // Tema claro
  set: 'native',                     // Conjunto nativo de emojis
  locale: 'pt',                      // Localização em português
  previewPosition: 'none',           // Sem preview
  skinTonePosition: 'none',          // Sem seleção de tom de pele
  searchPosition: 'top',             // Busca no topo
  maxFrequentRows: 2,                // 2 linhas de emojis recentes
  perLine: 9,                        // 9 emojis por linha
  emojiSize: 22,                     // Tamanho do emoji
  emojiButtonSize: 32,               // Tamanho do botão
  emojiButtonRadius: '8px',          // Raio do botão
  showPreview: false,                // Sem preview
  showSkinTones: false,              // Sem tons de pele
  showCategoryIcons: true,           // Com ícones de categoria
  showSearch: true,                  // Com busca
  searchPlaceholder: 'Buscar emoji...', // Placeholder da busca
  noResultsText: 'Nenhum emoji encontrado', // Texto sem resultados
  noResultsEmoji: '😕',             // Emoji sem resultados
  autoFocus: true,                   // Foco automático
  width: '352px',                    // Largura fixa
  height: '400px'                    // Altura fixa
};
```

## Comportamento de Fechamento

### 1. Clique Fora
- **Evento**: `mousedown` no documento
- **Lógica**: Verifica se o clique foi fora do `pickerRef`
- **Ação**: Chama `onClose()` automaticamente

### 2. Tecla Escape
- **Evento**: `keydown` no documento
- **Lógica**: Verifica se a tecla pressionada é `Escape`
- **Ação**: Chama `onClose()` automaticamente

### 3. Seleção de Emoji
- **Evento**: `onEmojiSelect` do componente Emoji Mart
- **Lógica**: Adiciona emoji ao texto e fecha o picker
- **Ação**: Chama `onClose()` manualmente

## Vantagens da Implementação

### ✅ UX Profissional
- **Comportamento esperado** pelos usuários
- **Padrão consistente** com aplicações populares
- **Fechamento intuitivo** sem necessidade de botão específico

### ✅ Performance
- **Event listeners otimizados** com cleanup automático
- **Refs eficientes** para detecção de cliques
- **Sem re-renders desnecessários**

### ✅ Acessibilidade
- **Suporte a teclado** com tecla Escape
- **Foco automático** no campo de busca
- **Navegação por tab** entre categorias

### ✅ Manutenibilidade
- **Código limpo** e bem documentado
- **Configurações centralizadas** em arquivo separado
- **Reutilizável** em outros componentes

## Exemplo de Uso Completo

```typescript
import { EmojiPicker } from './EmojiPicker';

function ChatComponent() {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageText, setMessageText] = useState('');

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleCloseEmojiPicker = () => {
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      {/* Botão para abrir emoji picker */}
      <button onClick={() => setShowEmojiPicker(true)}>
        😊
      </button>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={handleCloseEmojiPicker}
          className="absolute bottom-full right-0 mb-2 z-50"
        />
      )}
    </div>
  );
}
```

## Troubleshooting

### Problema: Picker não fecha ao clicar fora
**Solução**: Verificar se o `pickerRef` está sendo aplicado corretamente ao elemento raiz

### Problema: Múltiplos event listeners
**Solução**: O cleanup automático no `useEffect` previne isso

### Problema: Z-index incorreto
**Solução**: Ajustar a classe `z-50` conforme necessário para o contexto

## Conclusão

O componente `EmojiPicker` implementa um padrão profissional de fechamento automático que melhora significativamente a experiência do usuário, seguindo as melhores práticas de UX e acessibilidade encontradas em aplicações como WhatsApp Web, Discord e Slack.
