import { initializeDOMSafety } from './domSafety';

// Global error handler for external scripts and DOM issues
export const setupGlobalErrorHandling = () => {
  // Initialize DOM safety measures
  initializeDOMSafety();
  // Handle uncaught errors from external scripts
  window.addEventListener('error', (event) => {
    // Check if the error is from an external script (not our code)
    if (event.filename && event.filename.includes('share-modal.js')) {
      console.warn('⚠️ External script error (likely browser extension):', event.message);
      // Prevent the error from showing in console as uncaught
      event.preventDefault();
      return true;
    }
    
    // Handle specific addEventListener errors
    if (event.message && event.message.includes('addEventListener')) {
      console.warn('⚠️ addEventListener error (likely external script):', {
        message: event.message,
        filename: event.filename,
        line: event.lineno
      });
      event.preventDefault();
      return true;
    }
    
    // Log other errors for debugging
    if (event.filename && !event.filename.includes('webpack://')) {
      console.warn('⚠️ External script error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('⚠️ Unhandled promise rejection:', event.reason);
    // Don't prevent default for promise rejections as they might be important
  });

  // Handle DOM-related errors
  const originalAddEventListener = Element.prototype.addEventListener;
  Element.prototype.addEventListener = function(type, listener, options) {
    try {
      return originalAddEventListener.call(this, type, listener, options);
    } catch (error) {
      console.warn('⚠️ Error adding event listener:', {
        type,
        element: this,
        error: error.message
      });
      // Don't re-throw the error to prevent crashes
    }
  };
};

// Safe DOM element selector with null checking
export const safeQuerySelector = (selector) => {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`⚠️ Element not found: ${selector}`);
    }
    return element;
  } catch (error) {
    console.warn('⚠️ Error querying DOM element:', error);
    return null;
  }
};

// Safe event listener addition
export const safeAddEventListener = (element, event, handler, options) => {
  if (!element) {
    console.warn('⚠️ Cannot add event listener to null element');
    return false;
  }
  
  try {
    element.addEventListener(event, handler, options);
    return true;
  } catch (error) {
    console.warn('⚠️ Error adding event listener:', error);
    return false;
  }
};

// Safe DOM manipulation
export const safeDOMOperation = (operation, fallback = null) => {
  try {
    return operation();
  } catch (error) {
    console.warn('⚠️ DOM operation failed:', error);
    return fallback;
  }
};
