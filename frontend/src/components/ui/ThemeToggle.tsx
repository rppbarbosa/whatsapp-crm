import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center text-white hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group relative overflow-hidden"
      title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {/* Ícone do Sol */}
      <Sun 
        className={`w-7 h-7 transition-all duration-500 ${
          theme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-75'
        }`} 
      />
      
      {/* Ícone da Lua */}
      <Moon 
        className={`w-7 h-7 absolute transition-all duration-500 ${
          theme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-75'
        }`} 
      />
      
      {/* Efeito de brilho */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -skew-x-12 -translate-x-full group-hover:translate-x-full"></div>
      
      {/* Indicador de tema atual */}
      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full transition-all duration-300 ${
        theme === 'light' 
          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg' 
          : 'bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg'
      }`}>
        <div className={`w-2 h-2 rounded-full mx-auto mt-1 transition-all duration-300 ${
          theme === 'light' 
            ? 'bg-white' 
            : 'bg-white/80'
        }`}></div>
      </div>
    </button>
  );
};
