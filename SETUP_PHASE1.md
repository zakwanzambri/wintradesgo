# Phase 1: Local MySQL Development Setup

## Prerequisites Checklist
- [x] XAMPP installed and running
- [x] Apache server started
- [x] MySQL server started
- [x] React development server working (`npm run dev`)

## Step-by-Step Setup

### 1. Database Setup

1. **Open phpMyAdmin**
   - Go to: http://localhost/phpmyadmin
   - Login with username: `root` (no password for XAMPP default)

2. **Create Database**
   ```sql
   -- Copy and paste the entire content of database/schema.sql
   -- This will create the database, tables, and sample data
   ```

3. **Verify Database Creation**
   - Check that `wintradesgo` database exists
   - Verify all tables are created:
     - users
     - portfolio_holdings
     - trades
     - user_settings
     - price_alerts
     - ai_signals
     - market_data
     - user_sessions

### 2. Test API Connection

1. **Test Database Connection**
   - Open: http://localhost/wintradesgo/api/test-connection.php
   - Should see: `{"success":true,"message":"Database connection successful"}`

2. **If Connection Fails**
   - Check XAMPP MySQL is running
   - Verify database name is correct in `api/config/database.php`
   - Check PHP error logs in XAMPP control panel

### 3. Test Authentication APIs

1. **Test User Registration**
   ```bash
   # Using curl (or Postman)
   curl -X POST http://localhost/wintradesgo/api/auth/register.php \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "first_name": "Test",
       "last_name": "User"
     }'
   ```

2. **Test User Login**
   ```bash
   curl -X POST http://localhost/wintradesgo/api/auth/login.php \
     -H "Content-Type: application/json" \
     -d '{
       "email": "demo@wintradesgo.com",
       "password": "password"
     }'
   ```

### 4. Test Portfolio API

1. **Get Portfolio Data**
   ```bash
   # First login to get a token, then:
   curl -X GET http://localhost/wintradesgo/api/portfolio/get.php \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### 5. Integrate with React Frontend

1. **Update Portfolio Component**
   ```jsx
   // In src/pages/Portfolio.jsx
   import { portfolioAPI } from '../utils/api';
   
   useEffect(() => {
     const fetchPortfolio = async () => {
       try {
         const data = await portfolioAPI.getPortfolio();
         setPortfolioData(data.holdings);
         setStats(data.summary);
       } catch (error) {
         console.error('Failed to fetch portfolio:', error);
         // Fallback to mock data
       }
     };
     
     fetchPortfolio();
   }, []);
   ```

2. **Update Dashboard Component**
   ```jsx
   // In src/pages/Dashboard.jsx
   import { marketAPI, portfolioAPI } from '../utils/api';
   
   useEffect(() => {
     const fetchDashboardData = async () => {
       try {
         const [marketData, portfolioData, signals] = await Promise.all([
           marketAPI.getMarketData(['BTC', 'ETH', 'ADA', 'SOL']),
           portfolioAPI.getPortfolio(),
           marketAPI.getAISignals()
         ]);
         
         setMarketData(marketData);
         setPortfolioStats(portfolioData.summary);
         setSignals(signals);
       } catch (error) {
         console.error('Failed to fetch dashboard data:', error);
         // Fallback to mock data
       }
     };
     
     fetchDashboardData();
   }, []);
   ```

### 6. Add Login/Signup Components

1. **Create Login Component**
   ```jsx
   // src/components/auth/Login.jsx
   import { useState } from 'react';
   import { authAPI } from '../../utils/api';
   
   const Login = () => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [loading, setLoading] = useState(false);
     
     const handleLogin = async (e) => {
       e.preventDefault();
       setLoading(true);
       
       try {
         await authAPI.login(email, password);
         window.location.href = '/dashboard';
       } catch (error) {
         alert('Login failed: ' + error.message);
       } finally {
         setLoading(false);
       }
     };
     
     return (
       <form onSubmit={handleLogin} className="max-w-md mx-auto">
         <input
           type="email"
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           placeholder="Email"
           required
           className="w-full p-3 border rounded-lg mb-4"
         />
         <input
           type="password"
           value={password}
           onChange={(e) => setPassword(e.target.value)}
           placeholder="Password"
           required
           className="w-full p-3 border rounded-lg mb-4"
         />
         <button
           type="submit"
           disabled={loading}
           className="w-full btn-primary"
         >
           {loading ? 'Logging in...' : 'Login'}
         </button>
       </form>
     );
   };
   ```

## File Structure After Setup

```
c:\xampp\htdocs\wintradesgo\
├── api/                           ← New PHP backend
│   ├── auth/
│   │   ├── login.php
│   │   └── register.php
│   ├── portfolio/
│   │   └── get.php
│   ├── config/
│   │   └── database.php
│   └── test-connection.php
├── database/
│   └── schema.sql                 ← Database setup
├── src/                           ← Existing React app
│   ├── utils/
│   │   └── api.js                 ← New API helper
│   ├── components/
│   ├── pages/
│   └── ...
└── ...existing files
```

## Testing Checklist

- [ ] XAMPP MySQL running
- [ ] Database created with sample data
- [ ] API connection test passes
- [ ] User registration works
- [ ] User login works
- [ ] Portfolio API returns data
- [ ] React app connects to API
- [ ] Fallback to mock data works

## Common Issues & Solutions

### CORS Errors
- Ensure `setupCORS()` is called in all PHP files
- Check that your React dev server URL is in `$allowed_origins`

### Database Connection Failed
- Verify MySQL is running in XAMPP
- Check database credentials in `config/database.php`
- Ensure database name matches

### PHP Errors
- Check XAMPP error logs
- Enable error reporting in PHP settings
- Verify file permissions

### API Not Found (404)
- Ensure files are in correct XAMPP htdocs folder
- Check file paths and URL structure
- Verify Apache is running

## Next Steps

Once Phase 1 is working:
1. Add more API endpoints (trades, settings, alerts)
2. Implement proper JWT authentication
3. Add real-time market data integration
4. Prepare for cloud migration (Phase 2)

## Demo Credentials

For testing, use these sample accounts:
- Email: `demo@wintradesgo.com`
- Password: `password`

Or register a new account through the API.