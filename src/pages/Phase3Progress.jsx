import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Cpu,
  Brain,
  BarChart3,
  Settings,
  Rocket,
  Terminal
} from 'lucide-react';

const Phase3Progress = () => {
  const [completedItems, setCompletedItems] = useState(0);
  
  const phase3Achievements = [
    {
      id: 1,
      title: "Real LSTM Training Implementation",
      description: "Replaced simulated LSTM with actual TensorFlow/Keras implementation for real market predictions",
      icon: Brain,
      files: ["enhanced_lstm_bridge.php", "lstm_trainer.py", "model_trainer.py"],
      features: [
        "Real TensorFlow/Keras LSTM models",
        "Time-series data preprocessing",
        "Automatic model retraining",
        "Performance monitoring"
      ],
      status: "completed",
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "Enhanced PHP-Python Bridge",
      description: "Improved communication between PHP and Python models with better error handling and data processing",
      icon: Settings,
      files: ["enhanced_lstm_bridge.php", "php_python_bridge.php"],
      features: [
        "Robust error handling",
        "Fallback mechanisms",
        "Health monitoring",
        "Performance optimization"
      ],
      status: "completed",
      color: "bg-green-500"
    },
    {
      id: 3,
      title: "Real Sentiment Analysis Integration",
      description: "Integrated real sentiment analysis from multiple sources (news, social media, Reddit) instead of simulated data",
      icon: BarChart3,
      files: ["real_sentiment_analysis.php"],
      features: [
        "News API integration",
        "Social media sentiment",
        "Reddit analysis",
        "Multi-source aggregation"
      ],
      status: "completed",
      color: "bg-purple-500"
    },
    {
      id: 4,
      title: "Advanced Backtesting Engine",
      description: "Implemented professional backtesting with transaction costs, slippage, and comprehensive performance metrics",
      icon: BarChart3,
      files: ["professional_backtest_engine.php"],
      features: [
        "Transaction costs simulation",
        "Slippage modeling",
        "Risk-adjusted returns",
        "Performance analytics"
      ],
      status: "completed",
      color: "bg-yellow-500"
    },
    {
      id: 5,
      title: "Model Retraining Pipeline",
      description: "Created automated pipeline for model retraining with performance monitoring and model versioning",
      icon: Cpu,
      files: ["scheduler.php", "model_trainer.py"],
      features: [
        "Automated retraining schedule",
        "Performance drift detection",
        "Model versioning",
        "Rollback capabilities"
      ],
      status: "completed",
      color: "bg-indigo-500"
    },
    {
      id: 6,
      title: "Ensemble Trading System",
      description: "Combined all ML components (LSTM, sentiment, technical analysis) into one unified ensemble prediction system with risk management",
      icon: Rocket,
      files: ["ensemble_strategy.php"],
      features: [
        "Multi-component integration",
        "Weighted ensemble predictions",
        "Risk management",
        "Confidence scoring"
      ],
      status: "completed",
      color: "bg-red-500"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCompletedItems(prev => {
        if (prev < phase3Achievements.length) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🚀 Phase 3: Real ML Upgrade
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Complete transformation from simulated to real machine learning components
          </p>
          
          {/* Progress Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <div className="text-3xl font-bold text-green-400">100%</div>
              <div className="text-gray-300">Components Complete</div>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <div className="text-3xl font-bold text-blue-400">6/6</div>
              <div className="text-gray-300">ML Systems Deployed</div>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <div className="text-3xl font-bold text-purple-400">Production</div>
              <div className="text-gray-300">Status Ready</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Achievements Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {phase3Achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            const isCompleted = index < completedItems;
            
            return (
              <motion.div
                key={achievement.id}
                variants={itemVariants}
                className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
                  isCompleted 
                    ? 'border-green-400 bg-white/10 backdrop-blur-sm' 
                    : 'border-gray-600 bg-gray-800/50'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.5 }}
                    >
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </motion.div>
                  ) : (
                    <div className="w-8 h-8 border-2 border-gray-500 rounded-full" />
                  )}
                </div>

                <div className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${achievement.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
                      <p className="text-gray-300 text-sm">{achievement.description}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Features:</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {achievement.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Files */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Implementation Files:</h4>
                    <div className="flex flex-wrap gap-2">
                      {achievement.files.map((file, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs font-mono"
                        >
                          <Terminal className="w-3 h-3" />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Completion Animation */}
                {isCompleted && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: index * 0.5 }}
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-400"
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-8 border border-green-400/30">
            <h2 className="text-3xl font-bold mb-4">🎉 Phase 3 Complete!</h2>
            <p className="text-lg text-gray-300 mb-6">
              WinTradesGo now features a complete AI-powered trading platform with real machine learning capabilities:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="text-center">
                <Brain className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="font-semibold">Neural Networks</div>
                <div className="text-sm text-gray-400">LSTM Predictions</div>
              </div>
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="font-semibold">Sentiment Analysis</div>
                <div className="text-sm text-gray-400">Multi-source Data</div>
              </div>
              <div className="text-center">
                <Settings className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="font-semibold">Risk Management</div>
                <div className="text-sm text-gray-400">Professional Grade</div>
              </div>
              <div className="text-center">
                <Rocket className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="font-semibold">Ensemble System</div>
                <div className="text-sm text-gray-400">Unified Intelligence</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Phase3Progress;