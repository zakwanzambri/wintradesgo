import React from 'react';
import { motion } from 'framer-motion';

/**
 * Skeleton loader for cards
 */
export const CardSkeleton = ({ className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
);

/**
 * Skeleton loader for charts
 */
export const ChartSkeleton = ({ height = "h-80", className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className={`${height} bg-gray-100 dark:bg-gray-700 rounded relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
        {/* Mock chart lines */}
        <svg className="w-full h-full p-4" viewBox="0 0 400 200">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-300 dark:text-gray-600"
            points="0,150 50,120 100,140 150,100 200,110 250,80 300,90 350,60 400,70"
          />
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400 dark:text-gray-500"
            points="0,180 50,160 100,170 150,140 200,150 250,120 300,130 350,100 400,110"
          />
        </svg>
      </div>
    </div>
  </div>
);

/**
 * Skeleton loader for tables
 */
export const TableSkeleton = ({ rows = 5, cols = 4, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
    <div className="p-6">
      <div className="animate-pulse">
        {/* Table header */}
        <div className="flex space-x-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 mb-3">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 ${
                  colIndex === 0 ? 'w-1/4' : colIndex === cols - 1 ? 'w-1/6' : ''
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Spinner component
 */
export const Spinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
    </div>
  );
};

/**
 * Full page loading state
 */
export const PageLoading = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <Spinner size="xl" className="mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-lg">{message}</p>
    </div>
  </div>
);

/**
 * Inline loading state for buttons
 */
export const ButtonLoading = ({ children, loading, ...props }) => (
  <button {...props} disabled={loading || props.disabled}>
    <div className="flex items-center justify-center space-x-2">
      {loading && <Spinner size="sm" />}
      <span>{children}</span>
    </div>
  </button>
);

/**
 * Data loading state with retry option
 */
export const DataLoading = ({ error, loading, onRetry, children, emptyMessage = "No data available" }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load data
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error.message || "An unexpected error occurred"}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!children || (Array.isArray(children) && children.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5v4m0 0l-3-3m3 3l3-3" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return children;
};

/**
 * Connection status indicator
 */
export const ConnectionStatus = ({ isConnected, lastUpdate, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`flex items-center space-x-2 ${className}`}
  >
    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
    <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
    {lastUpdate && (
      <span className="text-xs text-gray-500">
        • {lastUpdate.toLocaleTimeString()}
      </span>
    )}
  </motion.div>
);

/**
 * Animated counter for metrics
 */
export const AnimatedMetric = ({ value, format = (v) => v, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [value, duration]);

  return <span>{format(displayValue)}</span>;
};