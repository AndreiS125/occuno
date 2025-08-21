'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
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

// Normalize API base URL so we don't double-append "/api/v1"
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = (() => {
  const trimmed = RAW_API_URL.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
})();

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
        let res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
        if (!res.ok) {
          const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (refreshed.ok) {
            res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
          }
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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    router.push('/dashboard');
  };

  const register = async (email: string, password: string, fullName: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    router.push('/dashboard');
  };

  const loginWithGoogle = async () => {
    // Get Google OAuth URL and set session cookie for CSRF state
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to initiate Google OAuth');
    }
    const data = await response.json();
    // Redirect to Google OAuth consent screen
    window.location.href = data.auth_url;
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      // No body needed; backend reads refresh token from HttpOnly cookie
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
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
    // Ask backend to clear auth cookies
    fetch(`${API_BASE_URL}/auth/logout`, {
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
