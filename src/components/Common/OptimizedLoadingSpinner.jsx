import React from 'react';

const OptimizedLoadingSpinner = ({ size = 'medium', text = 'Chargement en cours...' }) => {
  const sizeClass = {
    small: 'h-6 w-6',
    medium: 'h-10 w-10',
    large: 'h-16 w-16',
  }[size] || 'h-10 w-10';

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-secondary ${sizeClass}`}></div>
      {text && <p className="mt-2 text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

export default OptimizedLoadingSpinner;
