/**
 * Authentication Hooks for WinTrades
 * React hooks for managing user authentication state and operations
 */

import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import authService from '../services/authService';

// Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await authService.verifyToken();
        if (result.success) {
          setUser(result.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed: ' + error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed: ' + error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    authService.setUser(userData);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Use Auth Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Login Hook
 */
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login(credentials);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      const errorMessage = 'Login failed: ' + error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return { login, loading, error };
}

/**
 * Registration Hook
 */
export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(userData);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      const errorMessage = 'Registration failed: ' + error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, loading, error };
}

/**
 * User Profile Hook
 */
export function useProfile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.getProfile();
      if (result.success) {
        updateUser(result.user);
      } else {
        setError(result.error);
      }
      return result;
    } catch (error) {
      const errorMessage = 'Failed to load profile: ' + error.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  return {
    user,
    loading,
    error,
    refreshProfile,
    displayName: authService.getUserDisplayName(),
    avatar: authService.getUserAvatar()
  };
}

/**
 * Protected Route Hook
 */
export function useProtectedRoute(requiredRole = null) {
  const { isAuthenticated, user, loading } = useAuth();
  
  const isAuthorized = useCallback(() => {
    if (!isAuthenticated) return false;
    if (!requiredRole) return true;
    return user && user.role === requiredRole;
  }, [isAuthenticated, user, requiredRole]);

  return {
    isAuthenticated,
    isAuthorized: isAuthorized(),
    loading,
    user
  };
}

/**
 * Auth Status Hook
 */
export function useAuthStatus() {
  const { isAuthenticated, user, loading } = useAuth();
  
  return {
    isAuthenticated,
    isGuest: !isAuthenticated,
    isUser: isAuthenticated && user?.role === 'user',
    isPremium: isAuthenticated && user?.role === 'premium',
    isAdmin: isAuthenticated && user?.role === 'admin',
    user,
    loading
  };
}