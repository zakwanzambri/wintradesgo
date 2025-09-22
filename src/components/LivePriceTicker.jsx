/**
 * Live Price Ticker Component
 * Displays real-time price updates with animations and change indicators
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLivePrices } from '../hooks/useRealTime';

const LivePriceTicker = ({ symbols = ['BTC', 'ETH', 'ADA'], className = "" }) => {
  const { prices, priceChanges } = useLivePrices(symbols);
  const [highlightedPrices, setHighlightedPrices] = useState(new Set());

  // Highlight price changes
  useEffect(() => {
    const changedSymbols = Object.keys(priceChanges);
    if (changedSymbols.length > 0) {
      setHighlightedPrices(new Set(changedSymbols));
      
      // Clear highlights after animation
      const timer = setTimeout(() => {
        setHighlightedPrices(new Set());
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [priceChanges]);

  const formatPrice = (price, symbol) => {
    if (!price) return '$0.00';
    
    if (symbol === 'BTC' && price > 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    } else if (symbol === 'ETH' && price > 100) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const formatChange = (change) => {
    if (!change) return { amount: '0.00', percentage: '0.00' };
    
    return {
      amount: Math.abs(change.amount).toFixed(2),
      percentage: Math.abs(change.percentage).toFixed(2)
    };
  };

  const getChangeColor = (change) => {
    if (!change) return 'text-gray-500';
    return change.amount > 0 ? 'text-green-500' : change.amount < 0 ? 'text-red-500' : 'text-gray-500';
  };

  const getChangeIcon = (change) => {
    if (!change) return Minus;
    return change.amount > 0 ? TrendingUp : change.amount < 0 ? TrendingDown : Minus;
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="p-4 border-b">
        <h3 className="font-medium text-gray-900">Live Prices</h3>
        <p className="text-sm text-gray-500">Real-time cryptocurrency prices</p>
      </div>
      
      <div className="p-4">
        <div className="grid gap-4">
          {symbols.map((symbol) => {
            const price = prices[symbol];
            const change = priceChanges[symbol];
            const isHighlighted = highlightedPrices.has(symbol);
            const ChangeIcon = getChangeIcon(change);
            const changeColor = getChangeColor(change);
            const formattedChange = formatChange(change);
            
            return (
              <motion.div
                key={symbol}
                layout
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors duration-300 ${
                  isHighlighted ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Symbol */}
                  <div className="font-medium text-gray-900">
                    {symbol}
                  </div>
                  
                  {/* Price with animation */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={price?.current_price || 0}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 10, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-lg font-semibold text-gray-900"
                    >
                      {formatPrice(price?.current_price, symbol)}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Prediction Info */}
                  {price?.predicted_1h && (
                    <div className="text-right text-sm">
                      <div className="text-gray-500">1h Target</div>
                      <div className="font-medium">
                        {formatPrice(price.predicted_1h, symbol)}
                      </div>
                    </div>
                  )}
                  
                  {/* Change Indicator */}
                  <div className={`flex items-center space-x-1 ${changeColor}`}>
                    <ChangeIcon className="h-4 w-4" />
                    <div className="text-right">
                      <div className="font-medium">
                        {change?.amount >= 0 ? '+' : '-'}${formattedChange.amount}
                      </div>
                      <div className="text-sm">
                        {change?.percentage >= 0 ? '+' : '-'}{formattedChange.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Last Update */}
        <div className="mt-4 pt-3 border-t text-center text-xs text-gray-500">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Live updates every 3 seconds
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LivePriceTicker;