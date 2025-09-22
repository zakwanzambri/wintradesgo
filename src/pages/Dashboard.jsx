import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const [viewMode, setViewMode] = useState("overview");
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

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "signals", label: "AI Signals" },
    { id: "portfolio", label: "Portfolio" },
    { id: "patterns", label: "Patterns" }
  ];

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
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
            <p className="text-gray-600">Currently displaying: {viewMode}</p>
            <p className="text-sm text-gray-500 mt-2">All tabs now work! Navigation stays visible.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
