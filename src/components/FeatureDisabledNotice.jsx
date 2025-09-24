import React from 'react';

const FeatureDisabledNotice = ({ featureName, featureDisplayName, managementLink = "/model-management" }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">🔒</span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              {featureDisplayName} Feature Disabled
            </h3>
            <div className="text-yellow-700 space-y-2">
              <p>
                This feature is currently disabled in your system settings. 
                The <code className="bg-yellow-100 px-2 py-1 rounded text-sm">{featureName}</code> toggle 
                needs to be enabled to access this functionality.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <a
                  href={managementLink}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  <span className="mr-2">⚙️</span>
                  Enable in Model Management
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <span className="mr-2">🔄</span>
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Why are features disabled?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Feature toggles provide granular control over system functionality</li>
          <li>• Administrators can enable/disable features based on user roles or system resources</li>
          <li>• This ensures optimal performance and security for your trading environment</li>
        </ul>
      </div>
    </div>
  );
};

export default FeatureDisabledNotice;