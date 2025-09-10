/**
 * Utilitários para sanitizar e formatar dados vindos do WhatsApp
 */

/**
 * Remove caracteres especiais e formata o nome
 */
export const sanitizeName = (name: string): string => {
  if (!name) return '';
  
  return name
    .trim()
    .replace(/[^\w\sÀ-ÿ]/g, '') // Remove caracteres especiais exceto letras e espaços
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Formata e sanitiza número de telefone do WhatsApp
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove @c.us e outros sufixos do WhatsApp
  let cleanPhone = phone.replace(/@c\.us$/, '').replace(/@g\.us$/, '');
  
  // Remove todos os caracteres não numéricos
  cleanPhone = cleanPhone.replace(/\D/g, '');
  
  // Se começar com 55 (Brasil), formata como telefone brasileiro
  if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
    const ddd = cleanPhone.substring(2, 4);
    const number = cleanPhone.substring(4);
    
    if (number.length === 9) {
      // Celular: (XX) 9XXXX-XXXX
      return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (number.length === 8) {
      // Fixo: (XX) XXXX-XXXX
      return `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
    }
  }
  
  // Se não conseguir formatar, retorna apenas os números
  return cleanPhone;
};

/**
 * Sanitiza email removendo caracteres inválidos
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, '') // Remove caracteres inválidos para email
    .substring(0, 100); // Limita tamanho
};

/**
 * Sanitiza texto genérico
 */
export const sanitizeText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres que podem causar problemas
    .substring(0, maxLength);
};

/**
 * Extrai nome limpo de uma string que pode conter dados misturados
 */
export const extractCleanName = (input: string): string => {
  if (!input) return '';
  
  // Se contém @, pega apenas a parte antes do @
  if (input.includes('@')) {
    input = input.split('@')[0];
  }
  
  // Se contém apenas números, retorna "Contato"
  if (/^\d+$/.test(input)) {
    return 'Contato';
  }
  
  return sanitizeName(input);
};

/**
 * Valida se um email tem formato válido
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se um telefone tem formato válido
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

