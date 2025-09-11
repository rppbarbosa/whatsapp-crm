import React, { useState, useEffect } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = '+55 11 99999-9999',
  className = '',
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Função para aplicar máscara de telefone brasileiro
  const applyPhoneMask = (input: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = input.replace(/\D/g, '');
    
    // Se começar com 55 (código do Brasil), remove para aplicar máscara
    let cleanNumbers = numbers;
    if (numbers.startsWith('55')) {
      cleanNumbers = numbers.substring(2);
    }
    
    // Aplica máscara baseada no tamanho
    if (cleanNumbers.length === 0) {
      return '';
    } else if (cleanNumbers.length <= 2) {
      return `+55 ${cleanNumbers}`;
    } else if (cleanNumbers.length <= 6) {
      return `+55 ${cleanNumbers.slice(0, 2)} ${cleanNumbers.slice(2)}`;
    } else if (cleanNumbers.length <= 10) {
      return `+55 ${cleanNumbers.slice(0, 2)} ${cleanNumbers.slice(2, 6)}-${cleanNumbers.slice(6)}`;
    } else {
      return `+55 ${cleanNumbers.slice(0, 2)} ${cleanNumbers.slice(2, 7)}-${cleanNumbers.slice(7, 11)}`;
    }
  };

  // Função para extrair apenas números do valor formatado
  const extractNumbers = (formattedValue: string): string => {
    const numbers = formattedValue.replace(/\D/g, '');
    return numbers.startsWith('55') ? numbers : `55${numbers}`;
  };

  // Atualizar displayValue quando value mudar
  useEffect(() => {
    if (value) {
      setDisplayValue(applyPhoneMask(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const maskedValue = applyPhoneMask(inputValue);
    const numbersOnly = extractNumbers(maskedValue);
    
    setDisplayValue(maskedValue);
    onChange(numbersOnly);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir apenas números, backspace, delete, tab, escape, enter
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Permitir apenas números
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:text-white ${className}`}
    />
  );
};

export default PhoneInput;
