import React from 'react';

/**
 * Reusable loading spinner component with different sizes and variants
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (small, medium, large)
 * @param {string} props.color - Color of the spinner (primary, secondary, white)
 * @param {string} props.text - Optional text to display below the spinner
 * @param {boolean} props.fullPage - Whether to display the spinner centered on the full page
 * @param {string} props.className - Additional CSS classes
 */
const LoadingSpinner = ({
  size = 'medium',
  color = 'secondary',
  text,
  fullPage = false,
  className = '',
}) => {
  // Define size classes
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  // Define color classes
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  // Spinner component
  const Spinner = () => (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <svg
        className={`animate-spin ${sizeClasses[size] || sizeClasses.medium} ${colorClasses[color] || colorClasses.secondary}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loading-spinner"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {text && (
        <p className={`mt-3 text-sm font-medium ${colorClasses[color] || colorClasses.secondary}`}>
          {text}
        </p>
      )}
    </div>
  );

  // If fullPage is true, center the spinner on the page
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  // Otherwise, return just the spinner
  return <Spinner />;
};

export default LoadingSpinner;
