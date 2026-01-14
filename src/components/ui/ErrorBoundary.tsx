'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 font-mono">
          <pre className="text-red-500 mb-4 text-xs">
{`  _______
 |  [!]  |
 | ERROR |
 |_______|`}
          </pre>
          <h2 className="text-sm uppercase tracking-wider mb-2">
            SOMETHING WENT WRONG
          </h2>
          <p className="text-xs text-muted-foreground text-center max-w-md mb-6">
            An unexpected error occurred. You can try again or go back to the home page.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-6 max-w-lg w-full border border-border">
              <summary className="cursor-pointer p-2 text-xs text-muted-foreground uppercase hover:bg-muted">
                [+] ERROR DETAILS
              </summary>
              <pre className="p-4 overflow-auto text-xs bg-zinc-950 text-red-500 max-h-[200px]">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-2 text-xs">
            <button
              onClick={this.handleGoHome}
              className="px-3 py-1 border border-border hover:bg-muted"
            >
              [ HOME ]
            </button>
            <button
              onClick={this.handleRetry}
              className="px-3 py-1 border border-orange-500 text-orange-500 hover:bg-orange-500/10"
            >
              [ RETRY ]
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
