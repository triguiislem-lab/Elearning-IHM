import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/Common/ToastContainer';

// Create context
const ToastContext = createContext();

/**
 * Provider component for toast notifications
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = useCallback((type, message, options = {}) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      type,
      message,
      duration: options.duration || 5000,
      showProgress: options.showProgress !== false
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Shorthand methods for different toast types
  const success = useCallback((message, options) => addToast('success', message, options), [addToast]);
  const error = useCallback((message, options) => addToast('error', message, options), [addToast]);
  const info = useCallback((message, options) => addToast('info', message, options), [addToast]);
  const warning = useCallback((message, options) => addToast('warning', message, options), [addToast]);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Context value
  const value = {
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
    clearToasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} position="top-right" />
    </ToastContext.Provider>
  );
};

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
