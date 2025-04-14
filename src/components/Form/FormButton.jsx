import React from 'react';

/**
 * Reusable form button component with consistent styling and accessibility features
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {string} props.variant - Button variant (primary, secondary, outline, text)
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {function} props.onClick - Click handler function
 * @param {React.ReactNode} props.leftIcon - Optional icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Optional icon to display on the right
 */
const FormButton = ({
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  children,
  onClick,
  leftIcon,
  rightIcon,
  ...rest
}) => {
  // Define base styles for different variants
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'bg-transparent border border-secondary text-secondary hover:bg-secondary/10',
    text: 'bg-transparent text-secondary hover:bg-secondary/10',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        px-4 py-2 rounded-md font-medium transition-colors duration-200
        flex items-center justify-center gap-2
        ${variantStyles[variant] || variantStyles.primary}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...rest}
    >
      {isLoading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
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
      )}
      
      {!isLoading && leftIcon && <span>{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};

export default FormButton;
