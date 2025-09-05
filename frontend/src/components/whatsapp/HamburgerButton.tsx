import React from 'react';
import { Menu } from 'lucide-react';

interface HamburgerButtonProps {
  onClick: () => void;
  className?: string;
}

export const HamburgerButton: React.FC<HamburgerButtonProps> = ({
  onClick,
  className = ''
}) => {
  return (
    <div className={`fixed top-4 left-4 z-50 lg:hidden ${className}`}>
      <button
        onClick={onClick}
        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-200"
        title="Abrir menu de conversas"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>
    </div>
  );
};
