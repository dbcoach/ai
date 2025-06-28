import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ChatErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service if available
    if (typeof window !== 'undefined' && 'reportError' in window) {
      const reportError = (window as { reportError?: (error: Error, context: Record<string, unknown>) => void }).reportError;
      if (reportError) {
        reportError(error, {
          context: 'chat_error_boundary',
          errorInfo
        });
      }
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full bg-slate-900/20 rounded-xl border border-slate-700/50">
          <div className="text-center space-y-6 p-8 max-w-md">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Chat Error
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Something went wrong with the chat interface. This might be a temporary issue.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 mt-4">
                  <summary className="text-xs text-slate-300 cursor-pointer mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="text-xs text-red-300 font-mono whitespace-pre-wrap">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-2 text-slate-400">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Reload Page
              </button>
            </div>

            <div className="text-xs text-slate-500">
              If this problem persists, try refreshing the page or clearing your browser cache.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage
export function withChatErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ChatErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ChatErrorBoundary>
    );
  };
}