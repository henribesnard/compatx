import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 à 1
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'info' | 'warning';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  status, 
  size = 'md',
  variant = 'default'
}) => {
  // Hauteur en fonction de la taille
  const heightClass = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2'
  }[size];
  
  // Couleur en fonction de la variante
  const colorClass = {
    default: 'bg-primary',
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[variant];
  
  return (
    <div className="w-full">
      {status && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500">{status}</span>
          <span className="text-xs text-gray-500">{Math.round(progress * 100)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClass}`}>
        <div 
          className={`${colorClass} ${heightClass} rounded-full transition-all duration-300 ease-in-out`} 
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        >
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;