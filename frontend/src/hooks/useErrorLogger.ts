import React, { useEffect } from 'react';
import ErrorReporter from '@/utils/errorReporting';

// Hook to automatically log unhandled errors and promise rejections
export const useErrorLogger = () => {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(`Unhandled promise rejection: ${event.reason}`);
      ErrorReporter.getInstance().reportError(error);
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      const error = new Error(`Uncaught error: ${event.message}`);
      error.stack = event.error?.stack;
      ErrorReporter.getInstance().reportError(error);
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
};

// Hook to debug component renders and detect infinite loops
export const useRenderDebug = (componentName: string) => {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Warn if component renders too frequently (potential infinite loop)
    if (renderCount.current > 100 || timeSinceLastRender < 16) {
      console.warn(`⚠️ Component "${componentName}" has rendered ${renderCount.current} times. This might indicate an infinite re-render loop.`);
      
      if (renderCount.current > 200) {
        const error = new Error(`Infinite render loop detected in component "${componentName}"`);
        ErrorReporter.getInstance().reportError(error);
      }
    }
  });
};
