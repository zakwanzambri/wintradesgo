# 🔐 Authentication Setup Guide

## Development Mode (Auto-Login)
In development, the app automatically logs you in with a test user:
- **Username**: testuser
- **Email**: test@wintradesgo.com
- **Role**: user

This allows you to immediately access all protected routes including:
- `/dashboard`
- `/model-management` 
- `/portfolio`
- `/enhanced-dashboard`

## Production Mode
For production deployment, you'll need to:

1. **Set up proper authentication backend**
   - Configure `src/services/authService.js` baseURL
   - Set up JWT authentication API at `/wintradesgo/api/auth-simple.php`

2. **Remove auto-login**
   - The auto-login only works in development mode
   - Users will need to sign in through the normal flow

3. **Test authentication flow**
   - Register new users
   - Login/logout functionality
   - Token verification and refresh

## Accessing ML Models Page

### Method 1: Direct URL
Navigate to: `http://localhost:5174/model-management`

### Method 2: Header Navigation
1. Go to main page: `http://localhost:5174`
2. Click on "🧠 ML Models" in the header navigation
3. You'll be automatically authenticated in development

### Method 3: User Menu (when logged in)
1. Click on your username in the header
2. Select "🧠 ML Models" from the dropdown menu

## Features Available
- ✅ View trained ML models
- ✅ Model performance metrics
- ✅ Feature toggles (portfolio optimization, risk management, etc.)
- ✅ Model upload interface
- ✅ Real-time API integration

## API Endpoints Working
- `GET /model-api.php?action=list_models` - List all models
- `GET /model-api.php?action=get_features` - Get feature settings
- `GET /model-api.php?action=predict&symbol=BTC-USD` - ML predictions
- `GET /model-api.php?action=optimize_portfolio` - Portfolio optimization
- `GET /model-api.php?action=assess_risk` - Risk assessment