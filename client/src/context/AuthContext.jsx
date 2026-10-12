import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMeApi, loginApi, registerApi, logoutApi, updateProfileApi } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Authoritative session check from server on mount
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await getMeApi();
      if (response && response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 or network error is treated as unauthenticated session
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Log in user
   */
  const login = async ({ email, password }) => {
    const response = await loginApi({ email, password });
    if (response && response.success && response.data?.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Login failed');
  };

  /**
   * Register user (automatically sets session via HttpOnly cookie)
   */
  const register = async ({ name, email, password, confirmPassword }) => {
    const response = await registerApi({ name, email, password, confirmPassword });
    if (response && response.success && response.data?.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Registration failed');
  };

  /**
   * Log out user
   */
  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn('Logout API call notice:', err.message);
    } finally {
      setUser(null);
    }
  };

  /**
   * Update profile name
   */
  const updateProfile = async ({ name }) => {
    const response = await updateProfileApi({ name });
    if (response && response.success && response.data?.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.message || 'Failed to update profile');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
