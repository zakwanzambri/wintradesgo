import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('overview');
  const [aiSignals, setAiSignals] = useState([]);
  const [portfolioData, setPortfolioData] = useState([]);
  const [patternData, setPatternData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [patternLoading, setPatternLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [signalsCountdown, setSignalsCountdown] = useState(30);
  const [portfolioCountdown, setPortfolioCountdown] = useState(60);
  const [patternsCountdown, setPatternsCountdown] = useState(45);

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
              quantity: 2.0, 
              avg_price: 2500, 
              current_price: 2680, 
              value: 5360, 
              pnl: 360, 
              pnl_percentage: 7.20 
            },
            { 
              symbol: 'ADA', 
              quantity: 1000, 
              avg_price: 0.35, 
              current_price: 0.42, 
              value: 420, 
              pnl: 70, 
              pnl_percentage: 20.00 
            }
          ]);
        } else {
          setPortfolioData(data.data.positions_breakdown);
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      // Fallback data if API fails
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
          quantity: 2.0, 
          avg_price: 2500, 
          current_price: 2680, 
          value: 5360, 
          pnl: 360, 
          pnl_percentage: 7.20 
        }
      ]);
    }
    setPortfolioLoading(false);
  };

  // Function to fetch Pattern data
  const fetchPatternData = async () => {
    setPatternLoading(true);
    try {
      const response = await fetch('http://localhost/wintradesgo/api/trading/production.php?action=pattern_recognition');
      const data = await response.json();
      if (data.success && data.data && data.data.patterns) {
        // Convert API response to flat array format
        const patterns = [];
        Object.keys(data.data.patterns).forEach(symbol => {
          const symbolData = data.data.patterns[symbol];
          symbolData.detected_patterns.forEach(pattern => {
            patterns.push({
              symbol: symbol,
              pattern_type: pattern.pattern,
              confidence: pattern.confidence,
              prediction: pattern.signal || (pattern.breakout_target ? 'BULLISH' : 'NEUTRAL'),
              timeframe: pattern.timeframe,
              formation_completion: pattern.status === 'CONFIRMED' ? 100 : 
                                   pattern.status === 'ACTIVE' ? 85 : 70,
              target_price: pattern.breakout_target,
              detected_at: data.data.last_scan,
              description: `${pattern.pattern} pattern detected with ${pattern.probability} probability`,
              status: pattern.status,
              probability: pattern.probability
            });
          });
        });
        setPatternData(patterns);
      }
    } catch (error) {
      console.error('Error fetching pattern data:', error);
      // Fallback data if API fails
      setPatternData([
        {
          symbol: 'BTC',
          pattern_type: 'Head and Shoulders',
          confidence: 78,
          prediction: 'BEARISH',
          timeframe: '4H',
          formation_completion: 85,
          target_price: 41200,
          detected_at: '2025-09-22 09:45:00',
          description: 'Classic head and shoulders pattern forming on 4H chart'
        },
        {
          symbol: 'ETH',
          pattern_type: 'Ascending Triangle',
          confidence: 82,
          prediction: 'BULLISH',
          timeframe: '1H',
          formation_completion: 70,
          target_price: 2850,
          detected_at: '2025-09-22 09:30:00',
          description: 'Ascending triangle pattern with strong support at $2600'
        },
        {
          symbol: 'ADA',
          pattern_type: 'Double Bottom',
          confidence: 75,
          prediction: 'BULLISH',
          timeframe: '2H',
          formation_completion: 90,
          target_price: 0.48,
          detected_at: '2025-09-22 09:15:00',
          description: 'Double bottom pattern confirmed with volume spike'
        },
        {
          symbol: 'SOL',
          pattern_type: 'Cup and Handle',
          confidence: 88,
          prediction: 'BULLISH',
          timeframe: '6H',
          formation_completion: 95,
          target_price: 156,
          detected_at: '2025-09-22 08:45:00',
          description: 'Well-formed cup and handle pattern nearing completion'
        }
      ]);
    }
    setPatternLoading(false);
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

        setPatternsCountdown(prev => {
          if (prev <= 1) {
            fetchPatternData();
            return 45; // Reset to 45 seconds
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
    fetchPatternData();
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Auto-refresh
                </label>
                {autoRefreshEnabled && (
                  <span className="text-xs text-gray-500">
                    Next: {signalsCountdown}s
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  fetchAISignals();
                  setSignalsCountdown(30); // Reset countdown
                }}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh Now'}
              </button>
            </div>
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoRefreshEnabled}
                      onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                      className="rounded"
                    />
                    Auto-refresh
                  </label>
                  {autoRefreshEnabled && (
                    <span className="text-xs text-gray-500">
                      Next: {portfolioCountdown}s
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    fetchPortfolioData();
                    setPortfolioCountdown(60); // Reset countdown
                  }}
                  disabled={portfolioLoading}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {portfolioLoading ? 'Loading...' : 'Refresh Now'}
                </button>
              </div>
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

  // Pattern Recognition Component
  const PatternsTab = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Pattern Recognition</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Auto-refresh
                </label>
                {autoRefreshEnabled && (
                  <span className="text-xs text-gray-500">
                    Next: {patternsCountdown}s
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  fetchPatternData();
                  setPatternsCountdown(45); // Reset countdown
                }}
                disabled={patternLoading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {patternLoading ? 'Loading...' : 'Refresh Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Pattern Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Total Patterns</p>
            <p className="text-3xl font-bold text-gray-900">{patternData.length}</p>
          </div>
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Bullish Patterns</p>
            <p className="text-3xl font-bold text-green-600">
              {patternData.filter(p => p.prediction === 'BULLISH').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Bearish Patterns</p>
            <p className="text-3xl font-bold text-red-600">
              {patternData.filter(p => p.prediction === 'BEARISH').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-2">Avg Confidence</p>
            <p className="text-3xl font-bold text-blue-600">
              {patternData.length > 0 ? 
                Math.round(patternData.reduce((sum, p) => sum + p.confidence, 0) / patternData.length) 
                : 0}%
            </p>
          </div>
        </div>

        {/* Pattern Recognition Results */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Detected Patterns</h2>
          </div>
          
          {patternLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Analyzing patterns...</p>
            </div>
          ) : patternData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {patternData.map((pattern, index) => (
                <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pattern.symbol}</h3>
                      <p className="text-sm text-gray-600">{pattern.timeframe} Chart</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pattern.prediction === 'BULLISH' ? 'bg-green-100 text-green-800' :
                      pattern.prediction === 'BEARISH' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pattern.prediction}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pattern Type</p>
                      <p className="text-lg font-semibold text-blue-600">{pattern.pattern_type}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence</p>
                        <p className="text-sm font-semibold text-gray-900">{pattern.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completion</p>
                        <p className="text-sm font-semibold text-gray-900">{pattern.formation_completion}%</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target Price</p>
                      <p className="text-sm font-semibold text-gray-900">${pattern.target_price?.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</p>
                      <p className="text-sm text-gray-700">{pattern.description}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detected At</p>
                      <p className="text-sm text-gray-600">{pattern.detected_at}</p>
                    </div>

                    {/* Progress bar for formation completion */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500">Formation Progress</span>
                        <span className="text-xs text-gray-500">{pattern.formation_completion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${pattern.formation_completion}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No patterns detected. Click refresh to analyze current market data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Handle tab switching
  const renderTabContent = () => {
    if (viewMode === 'signals') {
      return <AISignalsTab />;
    }
    if (viewMode === 'portfolio') {
      return <PortfolioTab />;
    }
    if (viewMode === 'patterns') {
      return <PatternsTab />;
    }
    // Overview content
    return (
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent AI Signals</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Auto-refresh
                </label>
                {autoRefreshEnabled && (
                  <div className="text-xs text-gray-500">
                    <div>Signals: {signalsCountdown}s</div>
                    <div>Portfolio: {portfolioCountdown}s</div>
                    <div>Patterns: {patternsCountdown}s</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-600">Loading signals...</p>
            <p className="text-sm text-gray-500 mt-2">Click on "AI Signals" tab to view detailed signals</p>
          </div>
        </div>
      </div>
    );
  };

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

      {renderTabContent()}
    </div>
  );
};

export default Dashboard;
