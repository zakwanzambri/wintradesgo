import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AISignalDashboard from '../components/dashboard/AISignalDashboard';
import PortfolioTracker from '../components/dashboard/PortfolioTracker';
import PatternVisualization from '../components/dashboard/PatternVisualization';
import { useDashboardData, useConnectionStatus } from '../hooks/useAPI';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('overview');
  
  const {
    signals,
    portfolio,
    loading,
    error,
    lastUpdate,
    refresh
  } = useDashboardData();

  const { isOnline, apiStatus } = useConnectionStatus();
  const isConnected = isOnline && apiStatus === 'online';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'signals', label: 'AI Signals' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'patterns', label: 'Patterns' }
  ];

  if (viewMode === 'signals') {
    return <AISignalDashboard />;
  }

  if (viewMode === 'portfolio') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Portfolio Tracker</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <PortfolioTracker />
        </div>
      </div>
    );
  }

  if (viewMode === 'patterns') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Pattern Recognition</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <PatternVisualization />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <div className="mt-4 flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`px-4 py-2 rounded ${viewMode === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Portfolio Value</p>
            <p className="text-2xl font-bold">${portfolio?.total_value?.toLocaleString() || '125,420'}</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Active Signals</p>
            <p className="text-2xl font-bold">{signals?.signals?.length || '8'}</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold">87%</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Risk Level</p>
            <p className="text-2xl font-bold">Medium</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Recent AI Signals</h2>
          {signals?.signals?.length > 0 ? (
            <div className="space-y-4">
              {signals.signals.slice(0, 3).map((signal, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{signal.symbol} {signal.signal_type}</div>
                    <div className="text-sm text-gray-600">
                      Confidence: {signal.confidence}%
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-sm ${
                    signal.signal_type?.toLowerCase() === 'buy' ? 'bg-green-100 text-green-800' :
                    signal.signal_type?.toLowerCase() === 'sell' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {signal.signal_type?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No signals available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
