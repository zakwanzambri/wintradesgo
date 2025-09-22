import React, { useState } from 'react';
import { WinTradesAPI } from '../services/api';

const APITestPanel = () => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);

  const api = new WinTradesAPI();

  const runTest = async (testName, testFunction) => {
    setTesting(true);
    setTestResults(prev => ({
      ...prev,
      [testName]: { status: 'testing', data: null, error: null, time: null }
    }));

    const startTime = Date.now();
    try {
      const result = await testFunction();
      const endTime = Date.now();
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: 'success',
          data: result,
          error: null,
          time: endTime - startTime
        }
      }));
    } catch (error) {
      const endTime = Date.now();
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: 'error',
          data: null,
          error: error.message,
          time: endTime - startTime
        }
      }));
    }
    setTesting(false);
  };

  const tests = [
    {
      name: 'portfolio',
      label: 'Portfolio Status',
      function: () => api.getPortfolioStatus()
    },
    {
      name: 'signals',
      label: 'AI Signals',
      function: () => api.getAISignals()
    },
    {
      name: 'patterns',
      label: 'Pattern Recognition',
      function: () => api.getPatternRecognition()
    },
    {
      name: 'risk',
      label: 'Risk Assessment',
      function: () => api.getRiskAssessment()
    }
  ];

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.name, test.function);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'testing': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">API Integration Test</h3>
        <button
          onClick={runAllTests}
          disabled={testing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run All Tests'}
        </button>
      </div>

      <div className="space-y-3">
        {tests.map(test => {
          const result = testResults[test.name];
          return (
            <div key={test.name} className="border rounded p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span>{getStatusIcon(result?.status)}</span>
                  <span className="font-medium">{test.label}</span>
                  {result?.time && (
                    <span className="text-sm text-gray-500">({result.time}ms)</span>
                  )}
                </div>
                <button
                  onClick={() => runTest(test.name, test.function)}
                  disabled={testing}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                >
                  Test
                </button>
              </div>
              
              {result && (
                <div className="mt-2">
                  <div className={`text-sm ${getStatusColor(result.status)}`}>
                    Status: {result.status.toUpperCase()}
                  </div>
                  
                  {result.error && (
                    <div className="text-red-600 text-sm mt-1">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600">
                        View Response Data
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div>API Base URL: {api.baseURL}</div>
        <div>Environment: {process.env.NODE_ENV || 'development'}</div>
      </div>
    </div>
  );
};

export default APITestPanel;