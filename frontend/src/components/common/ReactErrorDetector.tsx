import React, { useEffect, useState } from 'react';
import ErrorReporter from '@/utils/errorReporting';

interface ReactErrorDetectorProps {
  children: React.ReactNode;
  componentName?: string;
}

// Component to detect and report React-specific errors
const ReactErrorDetector: React.FC<ReactErrorDetectorProps> = ({ 
  children, 
  componentName = 'Unknown' 
}) => {
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // Monitor for React-specific error patterns
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      const message = args[0];
      
      // Detect common React errors
      if (typeof message === 'string') {
        if (message.includes('Warning:')) {
          // React warnings - convert to errors for better tracking
          const warning = new Error(`React Warning: ${message}`);
          warning.stack = new Error().stack;
          ErrorReporter.getInstance().reportError(warning);
        }
      }
      
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Detect potential infinite re-renders
  useEffect(() => {
    setErrorCount(prev => prev + 1);
    
    if (errorCount > 50) {
      const error = new Error(`Potential infinite re-render detected in ${componentName} (${errorCount} renders)`);
      ErrorReporter.getInstance().reportError(error);
    }
  });

  return <>{children}</>;
};

export default ReactErrorDetector;
