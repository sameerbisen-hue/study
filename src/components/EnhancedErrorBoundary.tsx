import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
};

type State = {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

export default class EnhancedErrorBoundary extends React.Component<Props, State> {
  state: State = {
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Enhanced Error Boundary caught an error:", error, errorInfo);
    
    // Store error info for debugging
    this.setState({
      error,
      errorInfo,
    });

    // Try to recover from navigation-related errors
    if (error.message.includes('Navigation') || error.message.includes('Route')) {
      console.log("Navigation error detected, attempting recovery...");
      setTimeout(() => {
        this.setState({ error: null, errorInfo: null });
      }, 1000);
    }
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const { fallback: Fallback } = this.props;
    
    if (Fallback) {
      return <Fallback error={this.state.error} reset={this.handleReset} />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-destructive text-sm font-bold">!</span>
            </div>
            <h1 className="text-xl font-semibold">Something went wrong</h1>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              The app encountered an error. This might happen when navigating between pages or during file uploads.
            </p>
            
            {this.state.error.message.includes('Navigation') && (
              <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                Navigation Error: Try refreshing the page or going back to the dashboard.
              </p>
            )}
            
            {this.state.error.message.includes('Storage') && (
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                Upload Error: Check your internet connection and try again.
              </p>
            )}
          </div>

          <details className="space-y-2">
            <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
              Technical Details
            </summary>
            <div className="space-y-2">
              <pre className="overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
              {this.state.errorInfo && (
                <pre className="overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                  Component Stack: {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          </details>

          <div className="flex space-x-2">
            <button
              type="button"
              className="flex-1 h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              onClick={this.handleReset}
            >
              Try Again
            </button>
            <button
              type="button"
              className="flex-1 h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
