import React from 'react';

// Enhanced error reporting utility for React applications
export interface ErrorReport {
  error: Error;
  errorInfo?: any;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  reactVersion: string;
}

class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: ErrorReport[] = [];
  private maxErrors = 50; // Prevent memory leaks

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  reportError(error: Error, errorInfo?: any): void {
    const report: ErrorReport = {
      error,
      errorInfo,
      componentStack: errorInfo?.componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      reactVersion: React.version || 'unknown'
    };

    this.errors.push(report);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log detailed error information
    console.group('🚨 React Error Report');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.error('Timestamp:', new Date(report.timestamp).toISOString());
    console.error('URL:', report.url);
    console.groupEnd();

    // Check for common React error patterns
    this.analyzeError(error, errorInfo);
  }

  private analyzeError(error: Error, errorInfo?: any): void {
    const message = error.message.toLowerCase();
    
    // Common React error patterns
    if (message.includes('cannot read property') || message.includes('cannot access')) {
      console.warn('🔍 Likely cause: Undefined/null property access');
      this.suggestFix('Check if all required props are passed and handle null/undefined cases');
    }
    
    if (message.includes('invalid hook call')) {
      console.warn('🔍 Likely cause: Hook called outside component or in wrong order');
      this.suggestFix('Ensure hooks are called only in React components and in the same order every render');
    }
    
    if (message.includes('maximum depth') || message.includes('too many re-renders')) {
      console.warn('🔍 Likely cause: Infinite re-render loop');
      this.suggestFix('Check for state updates in render or missing dependencies in useEffect');
    }
    
    if (message.includes('objects are not valid as a react child')) {
      console.warn('🔍 Likely cause: Trying to render object directly');
      this.suggestFix('Convert objects to strings or render specific properties');
    }
  }

  private suggestFix(fix: string): void {
    console.log('💡 Suggested fix:', fix);
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  // Development helper to test error boundaries
  testError(type: 'chunk' | 'render' | 'hook' = 'render'): void {
    switch (type) {
      case 'chunk':
        throw new Error('Failed to load dynamically imported module: ChunkLoadError: Loading chunk 123 failed.');
      case 'render':
        throw new Error('Cannot read properties of undefined (reading "property")');
      case 'hook':
        throw new Error('Invalid hook call. Hooks can only be called inside the body of a function component.');
    }
  }
}

export default ErrorReporter;

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).errorReporter = ErrorReporter.getInstance();
}
