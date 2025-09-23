/**
 * ALERT & NOTIFICATION SYSTEM V1.0
 * Real-time notifications for trading signals and portfolio events
 */

import EnhancedAITradingSignals from './EnhancedAITradingSignals.js';

export class AlertNotificationSystem {
  constructor() {
    this.aiEngine = new EnhancedAITradingSignals();
    this.isActive = false;
    this.subscribers = [];
    this.alertHistory = [];
    this.monitoringInterval = null;
    
    // Load settings from localStorage
    this.loadSettings();
    
    // Request notification permission on initialization
    this.requestNotificationPermission();
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const saved = localStorage.getItem('alertSettings');
      if (saved) {
        this.settings = JSON.parse(saved);
      } else {
        this.settings = this.getDefaultSettings();
        this.saveSettings();
      }
    } catch (error) {
      console.error('Error loading alert settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('alertSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving alert settings:', error);
    }
  }

  // Get default settings
  getDefaultSettings() {
    return {
      // Alert triggers
      minConfidence: 80,           // Minimum confidence for alerts
      enabledSymbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'],
      alertOnBuy: true,
      alertOnSell: true,
      alertOnHold: false,
      
      // Notification methods
      browserNotifications: true,
      emailNotifications: false,
      smsNotifications: false,
      desktopApp: false,
      
      // Alert frequency
      maxAlertsPerHour: 10,
      cooldownMinutes: 5,          // Cooldown between alerts for same symbol
      
      // Portfolio alerts
      portfolioAlerts: true,
      priceChangeAlert: 5,         // Alert on 5% price change
      stopLossAlert: true,
      takeProfitAlert: true,
      
      // Trading hours (UTC)
      alertDuringHours: {
        enabled: false,
        startHour: 9,              // 9 AM UTC
        endHour: 17                // 5 PM UTC
      },
      
      // Contact information
      email: '',
      phone: '',
      
      // Advanced settings
      webhookUrl: '',              // For custom integrations
      discordWebhook: '',          // Discord integration
      telegramBotToken: '',        // Telegram integration
      telegramChatId: ''
    };
  }

  // Request browser notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
    }
  }

  // Start monitoring for alerts
  async startMonitoring() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🔔 Alert monitoring started');
    
    // Monitor every 2 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.checkForAlerts();
    }, 120000); // 2 minutes
    
    // Initial check
    await this.checkForAlerts();
    
    return { success: true, message: 'Alert monitoring started' };
  }

  // Stop monitoring
  stopMonitoring() {
    this.isActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🔕 Alert monitoring stopped');
    return { success: true, message: 'Alert monitoring stopped' };
  }

  // Check for alerts
  async checkForAlerts() {
    if (!this.isActive) return;
    
    try {
      // Check if we're within trading hours
      if (!this.isWithinTradingHours()) return;
      
      // Check rate limiting
      if (!this.canSendAlert()) return;
      
      for (const symbol of this.settings.enabledSymbols) {
        await this.checkSymbolForAlert(symbol);
      }
      
    } catch (error) {
      console.error('Error checking for alerts:', error);
    }
  }

  // Check specific symbol for alert conditions
  async checkSymbolForAlert(symbol) {
    try {
      // Get AI signal
      const signal = await this.aiEngine.generateEnhancedSignal(symbol);
      
      if (!signal || signal.error) return;
      
      // Check if signal meets alert criteria
      if (this.shouldTriggerAlert(signal)) {
        await this.triggerAlert(signal);
      }
      
    } catch (error) {
      console.error(`Error checking ${symbol} for alerts:`, error);
    }
  }

  // Determine if signal should trigger alert
  shouldTriggerAlert(signal) {
    // Check confidence threshold
    if (signal.confidence < this.settings.minConfidence) return false;
    
    // Check signal type preferences
    if (signal.signal === 'BUY' && !this.settings.alertOnBuy) return false;
    if (signal.signal === 'SELL' && !this.settings.alertOnSell) return false;
    if (signal.signal === 'HOLD' && !this.settings.alertOnHold) return false;
    
    // Check cooldown for this symbol
    if (this.isInCooldown(signal.symbol)) return false;
    
    // Check for duplicate recent alerts
    if (this.isDuplicateAlert(signal)) return false;
    
    return true;
  }

  // Trigger alert
  async triggerAlert(signal) {
    const alert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      symbol: signal.symbol,
      signal: signal.signal,
      confidence: signal.confidence,
      currentPrice: signal.currentPrice,
      strength: signal.strength,
      message: this.generateAlertMessage(signal),
      sent: false,
      methods: []
    };
    
    // Send notifications
    if (this.settings.browserNotifications) {
      await this.sendBrowserNotification(alert);
      alert.methods.push('browser');
    }
    
    if (this.settings.emailNotifications && this.settings.email) {
      await this.sendEmailNotification(alert);
      alert.methods.push('email');
    }
    
    if (this.settings.discordWebhook) {
      await this.sendDiscordNotification(alert);
      alert.methods.push('discord');
    }
    
    if (this.settings.webhookUrl) {
      await this.sendWebhookNotification(alert);
      alert.methods.push('webhook');
    }
    
    alert.sent = alert.methods.length > 0;
    
    // Store alert in history
    this.alertHistory.push(alert);
    this.trimAlertHistory();
    
    // Notify subscribers
    this.notifySubscribers('alert_triggered', alert);
    
    console.log(`🚨 Alert sent for ${signal.symbol}: ${signal.signal} (${signal.confidence}%)`);
    
    return alert;
  }

  // Generate alert message
  generateAlertMessage(signal) {
    const emoji = signal.signal === 'BUY' ? '🟢' : signal.signal === 'SELL' ? '🔴' : '🟡';
    const strength = signal.strength === 'STRONG' ? '💪' : signal.strength === 'MODERATE' ? '👍' : '🤏';
    
    let message = `${emoji} ${strength} ${signal.signal} SIGNAL for ${signal.symbol}\n`;
    message += `Price: $${signal.currentPrice?.toLocaleString()}\n`;
    message += `Confidence: ${signal.confidence}%\n`;
    message += `Strength: ${signal.strength}\n`;
    
    if (signal.analysis?.bullishFactors?.length > 0) {
      message += `\n🟢 Bullish Factors:\n`;
      signal.analysis.bullishFactors.slice(0, 3).forEach(factor => {
        message += `• ${factor}\n`;
      });
    }
    
    if (signal.analysis?.bearishFactors?.length > 0) {
      message += `\n🔴 Bearish Factors:\n`;
      signal.analysis.bearishFactors.slice(0, 3).forEach(factor => {
        message += `• ${factor}\n`;
      });
    }
    
    if (signal.riskManagement) {
      message += `\n⚠️ Risk Management:\n`;
      message += `Stop Loss: $${signal.riskManagement.stopLoss?.[signal.signal.toLowerCase()]?.toFixed(2)}\n`;
      message += `Take Profit: $${signal.riskManagement.takeProfit?.[signal.signal.toLowerCase()]?.toFixed(2)}\n`;
    }
    
    message += `\n⏰ ${new Date().toLocaleString()}`;
    
    return message;
  }

  // Send browser notification
  async sendBrowserNotification(alert) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }
    
    try {
      const title = `WinTrades Alert: ${alert.signal} ${alert.symbol}`;
      const options = {
        body: `${alert.confidence}% confidence • $${alert.currentPrice?.toLocaleString()}`,
        icon: '/favicon.ico',
        tag: `trading-alert-${alert.symbol}`,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Details'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      };
      
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
      
      return true;
    } catch (error) {
      console.error('Error sending browser notification:', error);
      return false;
    }
  }

  // Send email notification (simplified - would need backend service)
  async sendEmailNotification(alert) {
    try {
      // This would typically call a backend service
      console.log('📧 Email notification would be sent:', {
        to: this.settings.email,
        subject: `WinTrades Alert: ${alert.signal} ${alert.symbol}`,
        body: alert.message
      });
      
      // Simulate email sending
      return new Promise(resolve => {
        setTimeout(() => resolve(true), 1000);
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  // Send Discord webhook notification
  async sendDiscordNotification(alert) {
    if (!this.settings.discordWebhook) return false;
    
    try {
      const embed = {
        title: `🚨 ${alert.signal} Signal - ${alert.symbol}`,
        description: alert.message,
        color: alert.signal === 'BUY' ? 0x00ff00 : alert.signal === 'SELL' ? 0xff0000 : 0xffff00,
        fields: [
          {
            name: 'Price',
            value: `$${alert.currentPrice?.toLocaleString()}`,
            inline: true
          },
          {
            name: 'Confidence',
            value: `${alert.confidence}%`,
            inline: true
          },
          {
            name: 'Strength',
            value: alert.strength,
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'WinTrades AI'
        }
      };
      
      const response = await fetch(this.settings.discordWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      return false;
    }
  }

  // Send custom webhook notification
  async sendWebhookNotification(alert) {
    if (!this.settings.webhookUrl) return false;
    
    try {
      const payload = {
        type: 'trading_alert',
        alert: alert,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(this.settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error sending webhook notification:', error);
      return false;
    }
  }

  // Check if within trading hours
  isWithinTradingHours() {
    if (!this.settings.alertDuringHours.enabled) return true;
    
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    return currentHour >= this.settings.alertDuringHours.startHour && 
           currentHour < this.settings.alertDuringHours.endHour;
  }

  // Check rate limiting
  canSendAlert() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAlerts = this.alertHistory.filter(alert => 
      new Date(alert.timestamp) > oneHourAgo
    );
    
    return recentAlerts.length < this.settings.maxAlertsPerHour;
  }

  // Check cooldown for symbol
  isInCooldown(symbol) {
    const cooldownMs = this.settings.cooldownMinutes * 60 * 1000;
    const cutoff = new Date(Date.now() - cooldownMs);
    
    return this.alertHistory.some(alert => 
      alert.symbol === symbol && 
      new Date(alert.timestamp) > cutoff
    );
  }

  // Check for duplicate alerts
  isDuplicateAlert(signal) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return this.alertHistory.some(alert => 
      alert.symbol === signal.symbol &&
      alert.signal === signal.signal &&
      new Date(alert.timestamp) > fiveMinutesAgo
    );
  }

  // Helper functions
  generateAlertId() {
    return 'AL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  trimAlertHistory() {
    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    console.log('✅ Alert settings updated');
    return { success: true };
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Get alert history
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit).reverse();
  }

  // Clear alert history
  clearAlertHistory() {
    this.alertHistory = [];
    console.log('🗑️ Alert history cleared');
    return { success: true };
  }

  // Test alert system
  async testAlert() {
    const testAlert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      symbol: 'BTC',
      signal: 'BUY',
      confidence: 85,
      currentPrice: 45000,
      strength: 'STRONG',
      message: '🟢 💪 BUY SIGNAL for BTC\nPrice: $45,000\nConfidence: 85%\nStrength: STRONG\n\nThis is a test alert.',
      sent: false,
      methods: []
    };
    
    if (this.settings.browserNotifications) {
      await this.sendBrowserNotification(testAlert);
      testAlert.methods.push('browser');
    }
    
    testAlert.sent = testAlert.methods.length > 0;
    
    console.log('🧪 Test alert sent');
    return { success: true, alert: testAlert };
  }

  // Subscribe to alerts
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify subscribers
  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Get status
  getStatus() {
    return {
      isActive: this.isActive,
      alertsToday: this.alertHistory.filter(alert => {
        const today = new Date();
        const alertDate = new Date(alert.timestamp);
        return alertDate.toDateString() === today.toDateString();
      }).length,
      totalAlerts: this.alertHistory.length,
      settings: this.settings
    };
  }
}

export default AlertNotificationSystem;