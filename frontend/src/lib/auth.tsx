import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axiosInstance from './api/axios';
import { getStoredToken, storeToken, clearTokens, needsTokenRefresh, isTokenExpired } from './jwt-utils';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Fetch user profile when token is available
  const fetchUserProfile = async () => {
    if (!token) {
      // Check if we have email-based authentication for admin/committee
      const adminEmail = localStorage.getItem('admin_email');
      const committeeEmail = localStorage.getItem('committee_email');
      
      if (adminEmail || committeeEmail) {
        console.log('No token but email auth available:', { adminEmail, committeeEmail });
        // Set a minimal user object for email-based auth
        setUser({
          email: adminEmail || committeeEmail,
          role: adminEmail ? 'admin' : 'committee'
        });
        setIsAuthenticated(true);
      }
      
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axiosInstance.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      
      // Check if we have email-based authentication as fallback
      const adminEmail = localStorage.getItem('admin_email');
      const committeeEmail = localStorage.getItem('committee_email');
      
      if (adminEmail || committeeEmail) {
        console.log('JWT auth failed but email auth available:', { adminEmail, committeeEmail });
        // Set a minimal user object for email-based auth
        setUser({
          email: adminEmail || committeeEmail,
          role: adminEmail ? 'admin' : 'committee'
        });
        setIsAuthenticated(true);
      } else {
        // No fallback auth available
        clearTokens();
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check token validity and refresh if needed
  const checkAndRefreshToken = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) return;

    if (needsTokenRefresh()) {
      try {
        const response = await axiosInstance.post('/auth/refresh');
        const { access_token, refresh_token } = response.data;
        storeToken(access_token);
        if (refresh_token) {
          storeToken(refresh_token, true);
        }
        setToken(access_token);
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearTokens();
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
      }
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    const initAuth = async () => {
      await checkAndRefreshToken();
      await fetchUserProfile();
    };
    initAuth();
  }, [checkAndRefreshToken]);

  // Set up periodic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(() => {
      checkAndRefreshToken();
    }, 4 * 60 * 1000); // Check every 4 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, checkAndRefreshToken]);

  const login = useCallback((accessToken: string, refreshToken?: string, userData?: any) => {
    storeToken(accessToken);
    if (refreshToken) {
      storeToken(refreshToken, true);
    }
    
    // Store user email for fallback authentication based on role
    if (userData && userData.email) {
      if (userData.role === 'admin') {
        localStorage.setItem('admin_email', userData.email);
      } else if (userData.role === 'committee') {
        localStorage.setItem('committee_email', userData.email);
      }
    }
    
    setToken(accessToken);
    setIsAuthenticated(true);
  }, []);

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      // Clear any fallback authentication methods
      localStorage.removeItem('admin_email');
      localStorage.removeItem('committee_email');
      localStorage.removeItem('temp_admin_token');
      localStorage.removeItem('temp_committee_token');
      
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshAuth = async () => {
    await checkAndRefreshToken();
    await fetchUserProfile();
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}