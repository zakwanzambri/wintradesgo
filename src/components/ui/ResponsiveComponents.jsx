import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Responsive container with consistent padding
 */
export const ResponsiveContainer = ({ children, className = "" }) => (
  <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

/**
 * Responsive grid that adapts to screen size
 */
export const ResponsiveGrid = ({ children, className = "", cols = { xs: 1, sm: 2, lg: 3, xl: 4 } }) => {
  const gridClasses = [
    `grid`,
    `grid-cols-${cols.xs}`,
    cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    cols.md ? `md:grid-cols-${cols.md}` : '',
    cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    cols.xl ? `xl:grid-cols-${cols.xl}` : '',
    cols['2xl'] ? `2xl:grid-cols-${cols['2xl']}` : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`${gridClasses} gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Mobile-first navigation tabs
 */
export const MobileTabs = ({ tabs, activeTab, onTabChange, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Mobile dropdown for small screens */}
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop tabs for larger screens */}
      <div className="hidden sm:block">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-gray-600 rounded-md shadow-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Responsive card component
 */
export const ResponsiveCard = ({ children, className = "", padding = "p-4 md:p-6" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow ${padding} ${className}`}
  >
    {children}
  </motion.div>
);

/**
 * Mobile-optimized table
 */
export const ResponsiveTable = ({ headers, data, mobileKeyColumns = [], className = "" }) => (
  <div className={`overflow-hidden ${className}`}>
    {/* Desktop table */}
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Mobile cards */}
    <div className="md:hidden space-y-3">
      {data.map((row, rowIndex) => (
        <div key={rowIndex} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          {row.map((cell, cellIndex) => {
            if (mobileKeyColumns.length && !mobileKeyColumns.includes(cellIndex)) return null;
            return (
              <div key={cellIndex} className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {headers[cellIndex]}:
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {cell}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Responsive modal/drawer
 */
export const ResponsiveModal = ({ isOpen, onClose, title, children, className = "" }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
        />

        {/* Modal/Drawer */}
        <motion.div
          initial={{ 
            opacity: 0,
            y: '100%', // Slide from bottom on mobile
            x: 0 
          }}
          animate={{ 
            opacity: 1,
            y: 0,
            x: 0 
          }}
          exit={{ 
            opacity: 0,
            y: '100%',
            x: 0 
          }}
          className={`fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50 ${className}`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-lg md:rounded-lg shadow-xl w-full md:max-w-lg md:mx-4 max-h-[90vh] md:max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto">
              {children}
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

/**
 * Responsive stats grid
 */
export const ResponsiveStats = ({ stats, className = "" }) => (
  <ResponsiveGrid 
    cols={{ xs: 1, sm: 2, lg: 4 }}
    className={className}
  >
    {stats.map((stat, index) => (
      <ResponsiveCard key={index} className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {stat.value}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {stat.label}
        </div>
        {stat.change && (
          <div className={`text-sm mt-1 ${
            stat.change.startsWith('+') 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {stat.change}
          </div>
        )}
      </ResponsiveCard>
    ))}
  </ResponsiveGrid>
);

/**
 * Responsive chart container
 */
export const ResponsiveChart = ({ children, title, actions, className = "" }) => (
  <ResponsiveCard className={`${className}`}>
    {(title || actions) && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    )}
    <div className="w-full overflow-x-auto">
      {children}
    </div>
  </ResponsiveCard>
);

/**
 * Breakpoint detector hook
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState('xs');

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 640) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
};