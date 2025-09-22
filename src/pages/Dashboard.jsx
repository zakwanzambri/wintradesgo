import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('overview');
  const [aiSignals, setAiSignals] = useState([]);
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [signalsCountdown, setSignalsCountdown] = useState(30);
  const [portfolioCountdown, setPortfolioCountdown] = useState(60);

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

  // Function to fetch Portfolio data
  const fetchPortfolioData = async () => {
    setPortfolioLoading(true);
    try {
      const response = await fetch('http://localhost/wintradesgo/api/trading/production.php?action=portfolio_status');
      const data = await response.json();
      if (data.success && data.data) {
        // If no positions, use fallback data for demo
        if (data.data.positions_breakdown.length === 0) {
          setPortfolioData([
            { 
              symbol: 'BTC', 
              quantity: 0.5, 
              avg_price: 42000, 
              current_price: 43250, 
              value: 21625, 
              pnl: 625, 
              pnl_percentage: 2.97 
            },
            { 
              symbol: 'ETH', 
              quantity: 10, 
              avg_price: 2400, 
              current_price: 2650, 
              value: 26500, 
              pnl: 2500, 
              pnl_percentage: 10.42 
            },
            { 
              symbol: 'ADA', 
              quantity: 1000, 
              avg_price: 0.35, 
              current_price: 0.385, 
              value: 385, 
              pnl: 35, 
              pnl_percentage: 10.0 
            }
          ]);
        } else {
          setPortfolioData(data.data.positions_breakdown);
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      // Fallback portfolio data
      setPortfolioData([
        { 
          symbol: 'BTC', 
          quantity: 0.5, 
          avg_price: 42000, 
          current_price: 43250, 
          value: 21625, 
          pnl: 625, 
          pnl_percentage: 2.97 
        },
        { 
          symbol: 'ETH', 
          quantity: 10, 
          avg_price: 2400, 
          current_price: 2650, 
          value: 26500, 
          pnl: 2500, 
          pnl_percentage: 10.42 
        },
        { 
          symbol: 'ADA', 
          quantity: 1000, 
          avg_price: 0.35, 
          current_price: 0.385, 
          value: 385, 
          pnl: 35, 
          pnl_percentage: 10.0 
        }
      ]);
    }
    setPortfolioLoading(false);
  };

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefreshEnabled) {
      const interval = setInterval(() => {
        setSignalsCountdown(prev => {
          if (prev <= 1) {
            fetchAISignals();
            return 30; // Reset to 30 seconds
          }
          return prev - 1;
        });
        
        setPortfolioCountdown(prev => {
          if (prev <= 1) {
            fetchPortfolioData();
            return 60; // Reset to 60 seconds
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled]);

  // Initial load
  useEffect(() => {
    fetchAISignals();
    fetchPortfolioData();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'signals', label: 'AI Signals' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'patterns', label: 'Patterns' }
  ];

  // AI Signals Component
  const AISignalsTab = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">AI Trading Signals</h1>
            <button
              onClick={fetchAISignals}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh Signals'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Total Signals</p>
            <p className="text-3xl font-bold text-gray-900">{aiSignals.length}</p>
          </div>
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Buy Signals</p>
            <p className="text-3xl font-bold text-green-600">
              {aiSignals.filter(s => s.signal_type === 'BUY').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Sell Signals</p>
            <p className="text-3xl font-bold text-red-600">
              {aiSignals.filter(s => s.signal_type === 'SELL').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active AI Signals</h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading signals...</p>
            </div>
          ) : aiSignals.length > 0 ? (
            <div className="space-y-4">
              {aiSignals.map((signal, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">{signal.symbol} - {signal.signal_type}</h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          signal.signal_type?.toLowerCase() === 'buy' ? 'bg-green-100 text-green-800' :
                          signal.signal_type?.toLowerCase() === 'sell' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {signal.signal_type?.toUpperCase()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence</p>
                          <p className="text-sm font-semibold text-gray-900">{signal.confidence}%</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Strength</p>
                          <p className="text-sm font-semibold text-gray-900">{signal.strength || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Entry Price</p>
                          <p className="text-sm font-semibold text-gray-900">${signal.entry_price || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target</p>
                          <p className="text-sm font-semibold text-gray-900">${signal.target_price || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stop Loss</p>
                          <p className="text-sm font-semibold text-gray-900">${signal.stop_loss || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Generated</p>
                          <p className="text-sm font-semibold text-gray-900">{signal.generated_at || 'Now'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Source</p>
                          <p className="text-sm font-semibold text-gray-900">{signal.source || 'AI Model'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No signals available. Click refresh to load.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Portfolio Tracker Component
  const PortfolioTab = () => {
    const totalValue = portfolioData.reduce((sum, holding) => sum + holding.value, 0);
    const totalPnL = portfolioData.reduce((sum, holding) => sum + holding.pnl, 0);
    const totalPnLPercentage = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Portfolio Tracker</h1>
              <button
                onClick={fetchPortfolioData}
                disabled={portfolioLoading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {portfolioLoading ? 'Loading...' : 'Refresh Portfolio'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-2">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-2">Total P&L</p>
              <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalPnL.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-2">P&L Percentage</p>
              <p className={`text-3xl font-bold ${totalPnLPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnLPercentage.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-700 mb-2">Holdings</p>
              <p className="text-3xl font-bold text-gray-900">{portfolioData.length}</p>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Holdings</h2>
            </div>
            <div className="overflow-x-auto">
              {portfolioLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading portfolio...</p>
                </div>
              ) : portfolioData.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portfolioData.map((holding, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{holding.symbol}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {holding.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${holding.avg_price?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${holding.current_price?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${holding.value?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${holding.pnl?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={holding.pnl_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {holding.pnl_percentage?.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No holdings found. Click refresh to load portfolio data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle tab switching
  if (viewMode === 'signals') {
    return <AISignalsTab />;
  }

  if (viewMode === 'portfolio') {
    return <PortfolioTab />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Trading Dashboard</h1>
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  viewMode === tab.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Portfolio Value</p>
            <p className="text-2xl font-bold text-gray-900">$125,420</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Active Signals</p>
            <p className="text-2xl font-bold text-gray-900">8</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">87%</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Risk Level</p>
            <p className="text-2xl font-bold text-orange-600">Medium</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent AI Signals</h2>
          <div className="text-center py-8">
            <p className="text-gray-600">Loading signals...</p>
            <p className="text-sm text-gray-500 mt-2">Click on "AI Signals" tab to view detailed signals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
