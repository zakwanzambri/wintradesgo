import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you could send error to logging service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          fallback={this.props.fallback}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error fallback component
 */
const ErrorFallback = ({ error, errorInfo, resetError, fallback }) => {
  if (fallback) {
    return fallback({ error, resetError });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        {/* Error Icon */}
        <div className="mb-4">
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Oops! Something went wrong
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We encountered an unexpected error. Don't worry, our team has been notified.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-auto max-h-32">
              <div className="text-red-600 dark:text-red-400 font-bold mb-1">
                {error.name}: {error.message}
              </div>
              {error.stack && (
                <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {error.stack}
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>

        {/* Support Contact */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Component-level error boundary for smaller sections
 */
export const ComponentErrorBoundary = ({ children, fallback, className = "" }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Component Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              This section failed to load properly.
            </p>
            <button
              onClick={resetError}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Network error component
 */
export const NetworkError = ({ onRetry, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}
  >
    <div className="flex items-start">
      <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Connection Issue
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          Unable to connect to the server. Please check your connection.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline mt-2"
          >
            Retry connection
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

export default ErrorBoundary;