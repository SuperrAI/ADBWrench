'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/design-system/components/Button';
import { textStyles } from '@/design-system/foundations/typography';
import { Red, Neutral } from '@/design-system/foundations/colors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Alert triangle icon
const AlertIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.58 20.73C2.9 20.91 3.27 21 3.64 21H20.36C20.73 21 21.1 20.91 21.42 20.73C21.74 20.56 22 20.3 22.18 20C22.36 19.7 22.45 19.36 22.45 19C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.95 3.15C12.63 2.98 12.27 2.89 11.9 2.89C11.53 2.89 11.17 2.98 10.85 3.15C10.53 3.32 10.27 3.56 10.09 3.86H10.29Z"
      stroke={Red.R500}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Home icon
const HomeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 6L8 1.33333L14 6V13.3333C14 13.687 13.8595 14.0261 13.6095 14.2761C13.3594 14.5262 13.0203 14.6667 12.6667 14.6667H3.33333C2.97971 14.6667 2.64057 14.5262 2.39052 14.2761C2.14048 14.0261 2 13.687 2 13.3333V6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 14.6667V8H10V14.6667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Refresh icon
const RefreshIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.33333 6.66667C1.33333 6.66667 2.66667 4 5.33333 2.66667C8 1.33333 11.3333 2 13.3333 4.66667M14.6667 9.33333C14.6667 9.33333 13.3333 12 10.6667 13.3333C8 14.6667 4.66667 14 2.66667 11.3333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.6667 2V6.66667H10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.33333 14V9.33333H6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

    // Log error to console (could be extended to send to error tracking service)
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
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertIcon />
          <h2
            className="mt-4 mb-2"
            style={{ ...textStyles.h3, color: Neutral.N900 }}
          >
            Something went wrong
          </h2>
          <p
            className="text-center max-w-md mb-6"
            style={{ ...textStyles.body2Med, color: Neutral.N500 }}
          >
            An unexpected error occurred. You can try again or go back to the home page.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-6 max-w-lg w-full">
              <summary
                className="cursor-pointer mb-2"
                style={{ ...textStyles.labelSansMed, color: Neutral.N500 }}
              >
                Error details
              </summary>
              <pre
                className="p-4 rounded-lg overflow-auto text-xs"
                style={{
                  backgroundColor: Neutral.N100,
                  color: Red.R700,
                  maxHeight: '200px',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="medium"
              icon={<HomeIcon />}
              onClick={this.handleGoHome}
            >
              Go Home
            </Button>
            <Button
              variant="primary"
              size="medium"
              icon={<RefreshIcon />}
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
