'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';
import { authService, getErrorMessage } from '@/services/api';
import { User } from '@/types';
import toast from 'react-hot-toast';
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('route53_token');
        const email = localStorage.getItem('route53_email');
        if (token && email) {
          setUser({ email });
        } else {
          setUser(null);
          // If we are not on the login page and not logged in, redirect
          if (pathname && !pathname.endsWith('/login') && pathname !== '/') {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error reading localStorage', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router]);
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('route53_token', data.access_token);
      localStorage.setItem('route53_email', data.email);
      setUser({ email: data.email });
      toast.success('Successfully logged in!');
      router.push('/dashboard');
      return true;
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'Invalid email or password');
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    localStorage.removeItem('route53_token');
    localStorage.removeItem('route53_email');
    setUser(null);
    toast.success('Logged out successfully.');
    router.push('/login');
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
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