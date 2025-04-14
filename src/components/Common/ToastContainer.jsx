import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';

/**
 * Container for managing multiple toast notifications
 * @param {Object} props - Component props
 * @param {Array} props.toasts - Array of toast objects
 * @param {Function} props.removeToast - Function to remove a toast
 * @param {string} props.position - Position of the toast container
 */
const ToastContainer = ({ 
  toasts = [], 
  removeToast,
  position = 'top-right'
}) => {
  // Define position styles
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const positionStyle = positionStyles[position] || positionStyles['top-right'];

  return (
    <div className={`fixed ${positionStyle} z-50 w-full max-w-sm`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
            showProgress={toast.showProgress}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
