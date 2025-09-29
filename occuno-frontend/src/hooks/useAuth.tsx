'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  full_name: string;
  profile_picture_url?: string;
  is_email_verified: boolean;
  level: number;
  experience_points: number;
  total_coupons_earned: number;
  current_streak_days: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Backend base URLs
// API_BASE_URL must end with /api/v1 for all app routes and auth endpoints (JWT/register/logout, Google OAuth).
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const RAW_TRIMMED = RAW_API_URL.replace(/\/+$/, '');
const API_BASE_URL = RAW_TRIMMED.endsWith('/api/v1') ? RAW_TRIMMED : `${RAW_TRIMMED}/api/v1`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cookie-based auth: JWTs are set as HttpOnly cookies by the backend

  // API call helper with auth
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    } as HeadersInit;

    const doFetch = () =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

    const response = await doFetch();
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return doFetch();
      }
      // Refresh failed, redirect to login
      logout();
      throw new Error('Authentication failed');
    }

    return response;
  };

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Direct check using cookies; avoid depending on apiCall to keep effect stable
        let res = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
        if (!res.ok) {
          // No explicit refresh endpoint; simply consider not authenticated
        }
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    // FastAPI-Users expects form data for login
    const formData = new FormData();
    formData.append('username', email); // FastAPI-Users uses 'username' field
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/jwt/login`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    // After successful login, get user data
    const userResponse = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      setUser(userData);
    }
    
    router.push('/dashboard');
  };

  const register = async (email: string, password: string, fullName: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        email, 
        password, 
        full_name: fullName 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    // After successful registration, get user data
    const userResponse = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      setUser(userData);
    }
    
    router.push('/dashboard');
  };

  const loginWithGoogle = async () => {
    try {
      // Same-tab flow: request an authorization_url with a frontend redirect target,
      // then navigate current window to Google's consent screen.
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const response = await fetch(
        `${API_BASE_URL}/auth/google/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to get Google OAuth URL');
      const data = await response.json();
      if (!data.authorization_url) throw new Error('No authorization URL received');
      // Navigate in the same tab
      window.location.assign(data.authorization_url);
    } catch (error) {
      console.error('Google OAuth failed:', error);
      throw error;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      // FastAPI-Users handles token refresh automatically
      // For now, we'll just try to get the current user to check if auth is still valid
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  };

  const logout = useCallback(() => {
    // Use FastAPI-Users logout endpoint
    fetch(`${API_BASE_URL}/auth/jwt/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setUser(null);
      router.push('/login');
    });
  }, [router]);

  // Global auto-logout listener when refresh token fails anywhere (e.g., axios interceptor)
  useEffect(() => {
    const handler = () => logout();
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:logout', handler);
      }
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
