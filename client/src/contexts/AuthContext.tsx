import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export type User = {
  id: number;
  username: string;
  email: string;
  balance: number;
  isAdmin: boolean;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<User>) => void;
  refreshBalance: () => Promise<void>;
  isRefreshingBalance: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      const userData = await response.json();
      setUser(userData);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.username}!`,
      });
      setLocation('/');
    } catch (error: any) {
      const message = error.message || 'Login failed';
      setError(message);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/auth/register', data);
      const userData = await response.json();
      setUser(userData);
      toast({
        title: "Registration Successful",
        description: `Welcome, ${userData.username}!`,
      });
      setLocation('/');
    } catch (error: any) {
      const message = error.message || 'Registration failed';
      setError(message);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "An error occurred during logout.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };
  
  const refreshBalance = async () => {
    if (!user) return;
    
    setIsRefreshingBalance(true);
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        toast({
          title: "Balance Updated",
          description: "Your balance has been refreshed.",
        });
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Failed to refresh your balance. Please try again.",
      });
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateUserData,
        refreshBalance,
        isRefreshingBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
