import { useEffect } from 'react';

/**
 * Global numeric input prevention utility
 * @param {Object} options - Configuration options
 */
export const useGlobalNumericInputPrevention = (options: { allowNegative?: boolean; preventArrows?: boolean } = {}) => {
  const {
    allowNegative = false,
    preventArrows = true
  } = options;

  useEffect(() => {
    /**
     * Sanitize numeric input
     * @param {string} value - Input value to sanitize
     * @returns {string} - Sanitized value
     */
    const sanitizeNumericInput = (value: string | number): string => {
      // Remove non-numeric characters except decimal and minus
      let sanitizedValue = String(value)
        .replace(/[^0-9.-]/g, '')
        // .replace(/^0+/, '');

      // Handle negative number restriction
      if (!allowNegative) {
        sanitizedValue = sanitizedValue.replace(/-/g, '');
      }

      // Ensure only one decimal point
      const decimalParts = sanitizedValue.split('.');
      if (decimalParts.length > 2) {
        sanitizedValue = `${decimalParts[0]}.${decimalParts[1]}`;
      }

      return sanitizedValue;
    };

    /**
     * Global input prevention handler
     * @param {KeyboardEvent} event - Input event
     */
    const preventInvalidNumericInput = (event: KeyboardEvent) => {
      const input = event.target as HTMLInputElement;
      
      // Apply only to number inputs and inputs with numeric class
      if (
        input.type === 'number' || 
        input.classList.contains('numeric-input')
      ) {
        const key = event.key;
        const value = input.value;

        // Allowed keys
        const allowedKeys = [
          'Backspace', 
          'Delete', 
          'Tab',
          '.',
          'ArrowLeft', 
          'ArrowRight'
        ];

        // Prevent arrow up/down if configured
        if (preventArrows && (key === 'ArrowUp' || key === 'ArrowDown')) {
          event.preventDefault();
          return;
        }

        // Allow negative sign only if negative numbers are permitted
        if (allowNegative && key === '-' && value === '') {
          return;
        }

        // Check if key is a number or allowed special key
        const isNumber = /^[0-9]$/.test(key);
        const isAllowedKey = allowedKeys.includes(key);

        // Prevent default if not a number or allowed key
        if (!isNumber && !isAllowedKey) {
          event.preventDefault();
        }
      }
    };

    /**
     * Sanitize input on change
     * @param {InputEvent} event - Input change event
     */
    const sanitizeInput = (event: InputEvent) => {
      const input = event.target as HTMLInputElement;
      
      // Apply only to number inputs and inputs with numeric class
      if (
        input.type === 'number' || 
        input.classList.contains('numeric-input')
      ) {
        const sanitizedValue = sanitizeNumericInput(input.value);
        
        // Update input value if sanitized
        if (sanitizedValue !== input.value) {
          input.value = sanitizedValue;
        }
      }
    };

    // Add global event listeners
    document.addEventListener('keydown', preventInvalidNumericInput, true);
    document.addEventListener('input', sanitizeInput as EventListener, true);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('keydown', preventInvalidNumericInput, true);
      document.removeEventListener('input', sanitizeInput as EventListener, true);
    };
  }, [allowNegative, preventArrows]);
   useEffect(() => {
    const disableWheel = (event: WheelEvent) => {
      if ((event.target as HTMLInputElement).type === "number") {
        event.preventDefault();
      }
    };

    document.addEventListener("wheel", disableWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", disableWheel);
    };
  }, []);
};
