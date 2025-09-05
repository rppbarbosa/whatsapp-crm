import React, { useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { EMOJI_PICKER_CONFIG, EMOJI_CATEGORIES } from '../../data/whatsappEmojis';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
  className = ''
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fechar o picker quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Adicionar listener para cliques fora
    document.addEventListener('mousedown', handleClickOutside);
    
    // Adicionar listener para tecla Escape
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
  };

  return (
    <div ref={pickerRef} className={`${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme={EMOJI_PICKER_CONFIG.theme}
          set={EMOJI_PICKER_CONFIG.set}
          locale={EMOJI_PICKER_CONFIG.locale}
          previewPosition={EMOJI_PICKER_CONFIG.previewPosition}
          skinTonePosition={EMOJI_PICKER_CONFIG.skinTonePosition}
          searchPosition={EMOJI_PICKER_CONFIG.searchPosition}
          maxFrequentRows={EMOJI_PICKER_CONFIG.maxFrequentRows}
          perLine={EMOJI_PICKER_CONFIG.perLine}
          emojiSize={EMOJI_PICKER_CONFIG.emojiSize}
          emojiButtonSize={EMOJI_PICKER_CONFIG.emojiButtonSize}
          emojiButtonRadius={EMOJI_PICKER_CONFIG.emojiButtonRadius}
          showPreview={EMOJI_PICKER_CONFIG.showPreview}
          showSkinTones={EMOJI_PICKER_CONFIG.showSkinTones}
          showCategoryIcons={EMOJI_PICKER_CONFIG.showCategoryIcons}
          showSearch={EMOJI_PICKER_CONFIG.showSearch}
          searchPlaceholder={EMOJI_PICKER_CONFIG.searchPlaceholder}
          noResultsText={EMOJI_PICKER_CONFIG.noResultsText}
          noResultsEmoji={EMOJI_PICKER_CONFIG.noResultsEmoji}
          autoFocus={EMOJI_PICKER_CONFIG.autoFocus}
          onClose={onClose}
          categoryIcons={EMOJI_CATEGORIES}
          categories={[
            'recent',
            'smileys',
            'people',
            'nature',
            'foods',
            'activity',
            'places',
            'objects',
            'symbols',
            'flags'
          ]}
          style={{
            width: EMOJI_PICKER_CONFIG.width,
            height: EMOJI_PICKER_CONFIG.height
          }}
        />
      </div>
    </div>
  );
};
