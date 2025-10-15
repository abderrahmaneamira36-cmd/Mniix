
import React from 'react';

// Define the props for the TabButton component
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// Reusable button component for tab navigation
const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-6 text-sm sm:text-base font-bold transition-all duration-300 border-b-4 focus:outline-none
        ${
          isActive
            ? 'border-cyan-500 text-white' // Styles for the active tab
            : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600' // Styles for inactive tabs
        }`}
    >
      {label}
    </button>
  );
};

export default TabButton;
