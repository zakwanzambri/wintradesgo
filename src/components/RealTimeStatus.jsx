/**
 * Real-time Status Dashboard Component
 * Shows live connection status, data freshness, and update controls
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Bell,
  BellOff,
  Settings,
  Activity
} from 'lucide-react';
import { useRealTimeData, useNotifications } from '../hooks/useRealTime';

const RealTimeStatus = ({ className = "" }) => {
  const { 
    data, 
    isConnected, 
    lastUpdate, 
    errors, 
    forceRefresh, 
    updateConfig,
    status 
  } = useRealTimeData();

  const { 
    permission, 
    requestPermission, 
    isSupported 
  } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);
  const [refreshIntervals, setRefreshIntervals] = useState({
    portfolioRefreshInterval: 10000,
    signalsRefreshInterval: 5000,
    patternsRefreshInterval: 15000,
    pricesRefreshInterval: 3000
  });

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return timestamp.toLocaleTimeString();
  };

  const getConnectionStatus = () => {
    if (!isConnected) return { color: 'text-red-500', icon: WifiOff, text: 'Disconnected' };
    if (Object.keys(errors).length > 0) return { color: 'text-yellow-500', icon: Wifi, text: 'Connected (Errors)' };
    return { color: 'text-green-500', icon: Wifi, text: 'Connected' };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  const handleIntervalChange = (key, value) => {
    const newIntervals = { ...refreshIntervals, [key]: parseInt(value) * 1000 };
    setRefreshIntervals(newIntervals);
    updateConfig(newIntervals);
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ 
                scale: isConnected ? [1, 1.2, 1] : 1,
                rotate: isConnected ? [0, 360] : 0 
              }}
              transition={{ 
                duration: 2, 
                repeat: isConnected ? Infinity : 0,
                ease: "easeInOut" 
              }}
            >
              <ConnectionIcon className={`h-5 w-5 ${connectionStatus.color}`} />
            </motion.div>
            <div>
              <h3 className="font-medium text-gray-900">Real-time Status</h3>
              <p className={`text-sm ${connectionStatus.color}`}>
                {connectionStatus.text}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Notification Toggle */}
            {isSupported && (
              <button
                onClick={permission === 'granted' ? null : requestPermission}
                className={`p-2 rounded-md ${
                  permission === 'granted' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
              >
                {permission === 'granted' ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
            )}
            
            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Data Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['portfolio', 'signals', 'patterns', 'prices'].map((dataType) => {
            const hasData = data[dataType];
            const hasError = errors[dataType];
            
            return (
              <div key={dataType} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                  hasError ? 'bg-red-400' : hasData ? 'bg-green-400' : 'bg-gray-300'
                }`} />
                <div className="text-xs text-gray-600 capitalize">{dataType}</div>
                <button
                  onClick={() => forceRefresh(dataType)}
                  className="mt-1 p-1 rounded text-gray-400 hover:text-gray-600"
                  title={`Refresh ${dataType}`}
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Last update: {formatLastUpdate(lastUpdate)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="h-4 w-4" />
            <span>{status.intervalCount} active feeds</span>
          </div>
        </div>

        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="text-red-800 text-sm font-medium mb-1">Connection Issues:</div>
            {Object.entries(errors).map(([type, error]) => (
              <div key={type} className="text-red-600 text-xs">
                {type}: {error.message || error}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-gray-50"
          >
            <div className="p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Refresh Intervals</h4>
              
              {[
                { key: 'portfolioRefreshInterval', label: 'Portfolio', min: 5, max: 60 },
                { key: 'signalsRefreshInterval', label: 'Signals', min: 3, max: 30 },
                { key: 'patternsRefreshInterval', label: 'Patterns', min: 10, max: 120 },
                { key: 'pricesRefreshInterval', label: 'Prices', min: 1, max: 10 }
              ].map(({ key, label, min, max }) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">{label}:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={refreshIntervals[key] / 1000}
                      onChange={(e) => handleIntervalChange(key, e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500 w-8">
                      {refreshIntervals[key] / 1000}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealTimeStatus;