import React from 'react';

interface SidebarHeaderProps {
  title: string;
  onClose: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title,
  onClose,
  showCloseButton = true,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-200 lg:hidden ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {showCloseButton && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          title="Fechar menu"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
