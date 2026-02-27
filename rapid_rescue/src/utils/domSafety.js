// DOM Safety utilities to prevent external script errors

// Override addEventListener to handle null elements gracefully
const originalAddEventListener = Element.prototype.addEventListener;
Element.prototype.addEventListener = function(type, listener, options) {
  // Check if element is null or undefined
  if (!this || this === null) {
    console.warn('⚠️ Attempted to add event listener to null element:', {
      type,
      listener: listener?.name || 'anonymous'
    });
    return;
  }
  
  try {
    return originalAddEventListener.call(this, type, listener, options);
  } catch (error) {
    console.warn('⚠️ Error adding event listener:', {
      type,
      element: this.tagName || 'unknown',
      error: error.message
    });
  }
};

// Override querySelector to handle errors gracefully
const originalQuerySelector = Document.prototype.querySelector;
Document.prototype.querySelector = function(selector) {
  try {
    return originalQuerySelector.call(this, selector);
  } catch (error) {
    console.warn('⚠️ Error querying selector:', {
      selector,
      error: error.message
    });
    return null;
  }
};

// Override querySelectorAll to handle errors gracefully
const originalQuerySelectorAll = Document.prototype.querySelectorAll;
Document.prototype.querySelectorAll = function(selector) {
  try {
    return originalQuerySelectorAll.call(this, selector);
  } catch (error) {
    console.warn('⚠️ Error querying selectors:', {
      selector,
      error: error.message
    });
    return [];
  }
};

// Safe DOM manipulation wrapper
export const safeDOM = {
  // Safe element selection
  select: (selector) => {
    try {
      const element = document.querySelector(selector);
      return element;
    } catch (error) {
      console.warn('⚠️ DOM selection error:', error);
      return null;
    }
  },
  
  // Safe event listener addition
  on: (element, event, handler, options) => {
    if (!element) {
      console.warn('⚠️ Cannot add event listener to null element');
      return false;
    }
    
    try {
      element.addEventListener(event, handler, options);
      return true;
    } catch (error) {
      console.warn('⚠️ Event listener error:', error);
      return false;
    }
  },
  
  // Safe element creation
  create: (tagName, attributes = {}) => {
    try {
      const element = document.createElement(tagName);
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      return element;
    } catch (error) {
      console.warn('⚠️ Element creation error:', error);
      return null;
    }
  }
};

// Initialize DOM safety measures
export const initializeDOMSafety = () => {
  console.log('🛡️ DOM safety measures initialized');
};
