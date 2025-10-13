"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string | Record<string, any>; // Can be string or populated object
  orgName: string;
  orgSlug?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, orgName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to build subdomain URL
function getSubdomainUrl(orgSlug: string): string {
  if (typeof window === 'undefined') return '/';
  
  const { protocol, hostname, port } = window.location;
  
  // Check if we're already on the correct subdomain
  const currentSubdomain = hostname.split('.')[0];
  if (currentSubdomain === orgSlug) {
    // Already on correct subdomain, just go to home
    return '/';
  }
  
  // In development, use subdomain.localhost
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.endsWith('.localhost')) {
    // For development: orgSlug.localhost:3000
    const portStr = port ? `:${port}` : '';
    return `${protocol}//${orgSlug}.localhost${portStr}/`;
  }
  
  // In production: orgSlug.yourdomain.com
  const baseDomain = hostname.split('.').slice(-2).join('.'); // Get base domain (e.g., yourdomain.com)
  return `${protocol}//${orgSlug}.${baseDomain}/`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        
        // Redirect to organization's subdomain if provided
        if (data.redirectTo) {
          const subdomainUrl = getSubdomainUrl(data.redirectTo);
          
          // Only do full page redirect if we need to change subdomain
          if (subdomainUrl !== '/') {
            window.location.href = subdomainUrl;
          } else {
            // Already on correct subdomain, just navigate
            router.replace('/');
            router.refresh();
          }
        } else {
          // Fallback to regular navigation
          router.replace('/');
          router.refresh();
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (name: string, orgName: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, orgName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        
        // Redirect to organization's subdomain if provided
        if (data.redirectTo) {
          const subdomainUrl = getSubdomainUrl(data.redirectTo);
          
          // Only do full page redirect if we need to change subdomain
          if (subdomainUrl !== '/') {
            window.location.href = subdomainUrl;
          } else {
            // Already on correct subdomain, just navigate
            router.replace('/');
            router.refresh();
          }
        } else {
          // Fallback to regular navigation
          router.replace('/');
          router.refresh();
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
