'use client';

import { Button } from '@workspace/ui/components/button';
import { AlertCircle, Bug, Home, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorCount: number;
}

/**
 * Error logging function
 * In production, this should send errors to a logging service like Sentry, LogRocket, etc.
 */
function logError(error: Error, errorInfo: React.ErrorInfo, errorCount: number) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    errorCount,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Error Boundary Caught an Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Data:', errorData);
    console.groupEnd();
  } else {
    // In production, send to logging service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    console.error('Error caught by boundary:', errorData);
  }

  // Store error in sessionStorage for debugging
  try {
    const errors = JSON.parse(sessionStorage.getItem('error-log') || '[]');
    errors.push(errorData);
    // Keep only last 10 errors
    if (errors.length > 10) errors.shift();
    sessionStorage.setItem('error-log', JSON.stringify(errors));
  } catch {
    // Ignore if sessionStorage is unavailable
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const newErrorCount = this.state.errorCount + 1;

    this.setState({
      errorInfo,
      errorCount: newErrorCount,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error
    logError(error, errorInfo, newErrorCount);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRecurringError = this.state.errorCount > 1;

      return (
        <div
          className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertCircle className="text-destructive h-16 w-16" aria-hidden="true" />

          <div className="max-w-md text-center">
            <h2 className="mb-2 text-2xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground mb-1">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {isRecurringError && (
              <p className="text-destructive mt-2 text-sm">
                This error has occurred {this.state.errorCount} times. Consider going back to the
                home page.
              </p>
            )}

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-left text-xs">
                <summary className="text-muted-foreground hover:text-foreground mb-2 cursor-pointer">
                  <Bug className="mr-1 inline h-3 w-3" />
                  View error details (dev only)
                </summary>
                <pre className="bg-muted max-h-48 overflow-auto rounded p-3 text-[10px]">
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={this.handleReset}
              variant="outline"
              aria-label="Try to recover from error"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>

            <Button onClick={this.handleReload} aria-label="Reload the page">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload page
            </Button>

            {isRecurringError && <ErrorBoundaryHomeButton />}
          </div>

          {/* Help text */}
          <p className="text-muted-foreground max-w-md text-center text-sm">
            If this problem persists, please try clearing your browser cache or contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Separate component to use hooks
function ErrorBoundaryHomeButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.push('/')} variant="default" aria-label="Go back to home page">
      <Home className="mr-2 h-4 w-4" />
      Go home
    </Button>
  );
}
