import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          fontFamily: 'monospace',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          minHeight: '100vh',
        }}>
          <h1 style={{ color: '#ff4444' }}>⚠️ Application Error</h1>
          <h2>Something went wrong</h2>
          
          <div style={{
            marginTop: '20px',
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            overflow: 'auto',
          }}>
            <h3>Error:</h3>
            <pre style={{ color: '#ff6b6b' }}>
              {this.state.error?.toString()}
            </pre>
            
            {this.state.errorInfo && (
              <>
                <h3 style={{ marginTop: '20px' }}>Stack Trace:</h3>
                <pre style={{ fontSize: '12px', color: '#aaa' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
