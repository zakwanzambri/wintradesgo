# MySQL Integration Guide for WinTrades

## Current vs Future Architecture

### Current (Frontend Only):
```
React App → Mock Data → Display in UI
```

### With MySQL:
```
React App → PHP API → MySQL Database → Real Data → Display in UI
```

## Integration Steps

### 1. Keep Current Frontend (No Changes Needed)
Your React components will work exactly the same:

```jsx
// This component stays exactly the same
const Portfolio = () => {
  const [portfolioData, setPortfolioData] = useState([])
  
  useEffect(() => {
    // Only this part changes - from mock data to API call
    fetchPortfolioData() // ← This will call your PHP API instead of using mock data
  }, [])
  
  return (
    // All your existing JSX stays identical
    <div className="portfolio-dashboard">
      {/* Existing UI components unchanged */}
    </div>
  )
}
```

### 2. Add PHP Backend (New Files)
Create new PHP files in your XAMPP:

```
c:\xampp\htdocs\wintradesgo\
├── api/                    ← New backend folder
│   ├── auth/
│   │   ├── login.php
│   │   ├── register.php
│   │   └── logout.php
│   ├── portfolio/
│   │   ├── get.php
│   │   └── update.php
│   ├── trades/
│   │   └── history.php
│   └── config/
│       └── database.php
├── database/               ← New database folder
│   └── schema.sql
└── src/                    ← Existing React app (unchanged)
    ├── components/
    ├── pages/
    └── ...
```

### 3. Database Schema
```sql
-- Create database
CREATE DATABASE wintradesgo;
USE wintradesgo;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    plan_type ENUM('starter', 'pro', 'enterprise') DEFAULT 'starter',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Portfolio holdings
CREATE TABLE portfolio_holdings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    avg_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_symbol (user_id, symbol)
);

-- Trade history
CREATE TABLE trades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    type ENUM('buy', 'sell') NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    total_value DECIMAL(20,8) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User settings
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    theme ENUM('light', 'dark') DEFAULT 'light',
    notifications BOOLEAN DEFAULT TRUE,
    email_alerts BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4. PHP API Examples

#### Database Configuration (api/config/database.php)
```php
<?php
class Database {
    private $host = "localhost";
    private $database_name = "wintradesgo";
    private $username = "root";
    private $password = "";
    public $conn;
    
    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->database_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
```

#### Portfolio API (api/portfolio/get.php)
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

include_once '../config/database.php';

// Get user ID from JWT token (simplified for example)
$user_id = 1; // In real implementation, extract from JWT

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM portfolio_holdings WHERE user_id = ?";
$stmt = $db->prepare($query);
$stmt->bindParam(1, $user_id);
$stmt->execute();

$holdings = array();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    array_push($holdings, $row);
}

echo json_encode($holdings);
?>
```

### 5. Frontend API Integration

#### Update your React components to use real API:

```jsx
// Before: Mock data
const portfolioData = [
  { name: 'Bitcoin', value: 45, amount: 1.2534, usdValue: 54238.67 }
]

// After: Real API call
useEffect(() => {
  const fetchPortfolio = async () => {
    try {
      const response = await fetch('http://localhost/wintradesgo/api/portfolio/get.php', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setPortfolioData(data)
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
      // Fallback to mock data if API fails
      setPortfolioData(mockData)
    }
  }
  
  fetchPortfolio()
}, [])
```

## Benefits of This Approach

### ✅ **Seamless Migration**
- Frontend keeps working during development
- Can test backend incrementally
- Users won't experience downtime

### ✅ **XAMPP Perfect Match**
- MySQL included in XAMPP
- PHP works out of the box
- No additional server setup needed

### ✅ **Gradual Implementation**
```
Phase 1: Add database (site still works with mock data)
Phase 2: Add authentication (optional, dashboard still accessible)
Phase 3: Connect portfolio data (enhanced with real data)
Phase 4: Add trade functionality (new features)
```

### ✅ **Fallback Safety**
```jsx
// Your components can handle both scenarios
const fetchData = async () => {
  try {
    const realData = await apiCall()
    setData(realData)
  } catch (error) {
    // Fallback to mock data if API fails
    setData(mockData)
  }
}
```

## File Structure After MySQL Integration

```
c:\xampp\htdocs\wintradesgo\
├── api/                           ← New PHP backend
│   ├── auth/
│   ├── portfolio/
│   └── config/
├── database/                      ← Database files
│   └── schema.sql
├── src/                           ← Existing React (unchanged)
│   ├── components/
│   ├── pages/
│   └── utils/
│       └── api.js                 ← New API helper functions
├── dist/                          ← React build output
├── package.json                   ← Unchanged
└── README.md                      ← Updated documentation
```

## Development Workflow

1. **Keep developing frontend** as normal with `npm run dev`
2. **Add PHP APIs** one by one in the `/api` folder  
3. **Test APIs** using tools like Postman
4. **Update React components** to use real APIs when ready
5. **Site continues working** throughout the entire process

The beauty of this approach is that your website will work perfectly at every step of the integration process!