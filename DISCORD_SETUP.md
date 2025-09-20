# 🚨 Discord Alert Setup

## Quick Discord Webhook Setup

1. **Create Discord Webhook:**
   - Go to your Discord server
   - Right-click channel → Edit Channel
   - Integrations → Webhooks → New Webhook
   - Copy the webhook URL

2. **Set Environment Variable:**
   ```powershell
   # Replace with your actual webhook URL
   $env:DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR_WEBHOOK_HERE"
   ```

3. **Test Discord Alert:**
   ```bash
   php ai/test-discord.php
   ```

## Example Alert Message:
```
🚀 HIGH CONFIDENCE AI SIGNAL
BTC - BUY Signal
Confidence: 87.3%
Current Price: $115,635.00
Timeframe: 4h
Reason: Technical: RSI oversold | Sentiment: BULLISH
```

The system will automatically send Discord alerts when:
- Signal confidence ≥ 85%
- Strong BUY or SELL signals detected
- Technical and sentiment analysis align