import React from 'react';

/**
 * Reusable form input component with consistent styling and accessibility features
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the input
 * @param {string} props.name - Name attribute for the input
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.label - Label text
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Current input value
 * @param {function} props.onChange - Change handler function
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.icon - Optional icon to display inside the input
 * @param {React.ReactNode} props.rightElement - Optional element to display on the right side
 * @param {string} props.helpText - Optional help text to display below the input
 */
const FormInput = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  className = '',
  icon,
  rightElement,
  helpText,
  ...rest
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={id} 
          className="form-label block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          className={`
            form-input w-full rounded-md border-gray-300 shadow-sm
            focus:border-secondary focus:ring focus:ring-secondary/20
            ${icon ? 'pl-10' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${error ? 'border-red-500' : ''}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            ${className}
          `}
          {...rest}
        />
        
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={`${id}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
