import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('overview');
  const [aiSignals, setAiSignals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch AI signals
  const fetchAISignals = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost/wintradesgo/api/trading/production.php?action=ml_signals');
      const data = await response.json();
      if (data.success && data.data && data.data.current_signals) {
        setAiSignals(data.data.current_signals);
      }
    } catch (error) {
      console.error('Error fetching AI signals:', error);
      // Fallback data if API fails
      setAiSignals([
        { symbol: 'BTC', signal_type: 'BUY', confidence: 85, generated_at: '2025-09-22 10:02:42' },
        { symbol: 'ETH', signal_type: 'SELL', confidence: 78, generated_at: '2025-09-22 10:02:42' },
        { symbol: 'ADA', signal_type: 'HOLD', confidence: 72, generated_at: '2025-09-22 10:02:42' }
      ]);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'signals', label: 'AI Signals' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'patterns', label: 'Patterns' }
  ];

  // AI Signals Component
  const AISignalsTab = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">AI Trading Signals</h1>
            <button
              onClick={fetchAISignals}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Signals'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Total Signals</p>
            <p className="text-2xl font-bold">{aiSignals.length}</p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Buy Signals</p>
            <p className="text-2xl font-bold text-green-600">
              {aiSignals.filter(s => s.signal_type === 'BUY').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Sell Signals</p>
            <p className="text-2xl font-bold text-red-600">
              {aiSignals.filter(s => s.signal_type === 'SELL').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Active AI Signals</h2>
          {loading ? (
            <p className="text-gray-600">Loading signals...</p>
          ) : aiSignals.length > 0 ? (
            <div className="space-y-4">
              {aiSignals.map((signal, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{signal.symbol} - {signal.signal_type}</div>
                    <div className="text-sm text-gray-600">
                      Confidence: {signal.confidence}% | Strength: {signal.strength || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Entry: ${signal.entry_price} | Target: ${signal.target_price} | Stop: ${signal.stop_loss}
                    </div>
                    <div className="text-xs text-gray-500">
                      {signal.generated_at || 'Now'} | Source: {signal.source || 'AI Model'}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-sm ${
                    signal.signal_type?.toLowerCase() === 'buy' ? 'bg-green-100 text-green-800' :
                    signal.signal_type?.toLowerCase() === 'sell' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {signal.signal_type?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No signals available. Click refresh to load.</p>
          )}
        </div>
      </div>
    </div>
  );

  // Handle tab switching
  if (viewMode === 'signals') {
    return <AISignalsTab />;
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
            <p className="text-2xl font-bold">$125,420</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-600">Active Signals</p>
            <p className="text-2xl font-bold">8</p>
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
          <p className="text-gray-600">Loading signals...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
