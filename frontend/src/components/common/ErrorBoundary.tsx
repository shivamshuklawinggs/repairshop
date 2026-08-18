import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorReporter from '@/utils/errorReporting';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  autoRefreshCountdown: number;
}

class ErrorBoundary extends Component<Props, State> {
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, autoRefreshCountdown: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError = error.message?.includes('chunk') || error.message?.includes('Loading chunk');
    return { 
      hasError: true, 
      error, 
      errorInfo: null, 
      autoRefreshCountdown: isChunkError ? 5 : 0 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const isChunkError = error.message?.includes('chunk') || error.message?.includes('Loading chunk');
    
    // Report error to enhanced error reporter
    ErrorReporter.getInstance().reportError(error, errorInfo);
    
    console.group('🛡️ ErrorBoundary Error Caught');
    console.warn("ErrorBoundary caught an error:", error, errorInfo);
    console.log('Is chunk error:', isChunkError);
    console.log('Error message:', error.message);
    console.log('Component stack:', errorInfo.componentStack);
    console.groupEnd();
    this.setState({ error, errorInfo });
  }

  componentDidMount(): void {
    this.startAutoRefresh();
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    if (this.state.autoRefreshCountdown > 0 && prevState.autoRefreshCountdown === 0) {
      this.startAutoRefresh();
    }
  }

  componentWillUnmount(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }

  private startAutoRefresh = (): void => {
    if (this.state.autoRefreshCountdown > 0) {
      this.refreshTimer = setTimeout(() => {
        this.setState(prevState => {
          const newCountdown = prevState.autoRefreshCountdown - 1;
          if (newCountdown <= 0) {
            window.location.reload();
          }
          return { autoRefreshCountdown: newCountdown };
        });
      }, 1000);
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('chunk') || 
                          this.state.error?.message?.includes('Loading chunk');
      
      if (isChunkError) {
        return (
          <div style={{ 
            padding: '40px 20px', 
            textAlign: 'center', 
            color: '#333',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <h2 style={{ color: '#2563eb', marginBottom: '16px' }}>
              🔄 Updating Application
            </h2>
            <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
              The application is updating with the latest changes. This happens automatically during development.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Refresh Now
            </button>
            <p style={{ 
              marginTop: '16px', 
              fontSize: '14px', 
              color: '#666',
              fontStyle: 'italic'
            }}>
              {this.state.autoRefreshCountdown > 0 
                ? `This page will automatically refresh in ${this.state.autoRefreshCountdown} seconds...`
                : 'This page will automatically refresh in a moment...'
              }
            </p>
          </div>
        );
      }

      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
          <h2>Something went wrong!</h2>
          <p>Please refresh the page or try again later.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Test helper - add this to window for testing in browser console
declare global {
  interface Window {
    testChunkError: () => void;
    testNormalError: () => void;
  }
}

// Add test methods to window for easy testing
if (typeof window !== 'undefined') {
  window.testChunkError = () => {
    const error = new Error('Failed to load dynamically imported module: ChunkLoadError: Loading chunk 123 failed.');
    throw error;
  };

  window.testNormalError = () => {
    const error = new Error('This is a normal error for testing');
    throw error;
  };
} 