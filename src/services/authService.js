/**
 * Authentication Service for WinTrades
 * Handles user authentication, JWT tokens, and session management
 */

class AuthService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/wintradesgo/api/auth-simple.php' 
      : 'http://localhost/wintradesgo/api/auth-simple.php';
    this.tokenKey = 'wintradesgo_token';
    this.refreshTokenKey = 'wintradesgo_refresh_token';
    this.userKey = 'wintradesgo_user';
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}?action=register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        this.setToken(data.data.token);
        this.setUser(data.data.user);
        return { success: true, user: data.data.user, message: data.message };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  /**
   * Login user
   */
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        this.setToken(data.data.token);
        this.setUser(data.data.user);
        return { success: true, user: data.data.user, message: data.message };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const token = this.getToken();
      
      if (token) {
        await fetch(`${this.baseURL}?action=logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Verify current token
   */
  async verifyToken() {
    const token = this.getToken();
    
    if (!token) {
      return { success: false, error: 'No token found' };
    }

    try {
      const response = await fetch(`${this.baseURL}?action=verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        this.setUser(data.data.user);
        return { success: true, user: data.data.user };
      } else {
        this.clearAuth();
        return { success: false, error: data.message };
      }
    } catch (error) {
      this.clearAuth();
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  /**
   * Get user profile
   */
  async getProfile() {
    const token = this.getToken();
    
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${this.baseURL}/auth.php?action=profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        this.setUser(data.data.user);
        return { success: true, user: data.data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  /**
   * Make authenticated API request
   */
  async authenticatedRequest(url, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Check if token is expired
      if (response.status === 401) {
        this.clearAuth();
        throw new Error('Token expired');
      }

      return response;
    } catch (error) {
      if (error.message === 'Token expired') {
        // Trigger logout or refresh
        this.clearAuth();
      }
      throw error;
    }
  }

  /**
   * Set single token in localStorage
   */
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Set tokens in localStorage
   */
  setTokens(tokens) {
    localStorage.setItem(this.tokenKey, tokens.access_token);
    localStorage.setItem(this.refreshTokenKey, tokens.refresh_token);
  }

  /**
   * Get access token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Set user data
   */
  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Get user data
   */
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Format user display name
   */
  getUserDisplayName() {
    const user = this.getUser();
    if (!user) return 'Unknown User';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else {
      return user.username;
    }
  }

  /**
   * Get user avatar URL
   */
  getUserAvatar() {
    const user = this.getUser();
    if (user?.avatar_url) {
      return user.avatar_url;
    }
    
    // Generate a default avatar URL based on username
    const username = user?.username || 'user';
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}`;
  }
}

// Create and export singleton instance
const authService = new AuthService();

export default authService;