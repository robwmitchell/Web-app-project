import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center',
          margin: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 20px 0', opacity: 0.9 }}>
            We're sorry, but there was an error loading this component.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginTop: '20px', 
              textAlign: 'left',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '10px' }}>
                Error Details (Development Mode)
              </summary>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                fontSize: '0.75rem',
                lineHeight: '1.4',
                margin: 0,
                overflow: 'auto'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
