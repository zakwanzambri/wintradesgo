import React from "react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Trading Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Portfolio Value</h2>
          <p className="text-2xl font-bold text-blue-600">$125,420</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Active Signals</h2>
          <p className="text-2xl font-bold text-green-600">8</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Success Rate</h2>
          <p className="text-2xl font-bold text-purple-600">87%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Risk Level</h2>
          <p className="text-2xl font-bold text-orange-600">Medium</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
