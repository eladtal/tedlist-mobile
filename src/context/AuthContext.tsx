import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../api';
import { Alert } from 'react-native';

// Auth token keys
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  bio?: string;
  stats?: {
    trades: number;
    listings: number;
    xp: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Types for Auth Context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Helper method to handle logout
  const handleLogout = async () => {
    try {
      // Clear user data first to avoid UI issues
      setUser(null);
      setIsAuthenticated(false);
      
      // Then try to call logout API to invalidate token on server
      // Wrapped in try/catch so even if this fails, the local logout succeeds
      try {
        await authService.logout();
      } catch (logoutError) {
        console.log('Non-critical: Error calling logout API:', logoutError);
        // This is non-critical - we still want to clear local storage even if API fails
      }
      
      // Clear storage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, we should try to clean up the state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Check for authentication on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        
        if (token) {
          // Fetch user profile
          try {
            // Safely handle potential user service loading issues
            let userService;
            try {
              userService = (await import('../api/userService')).default;
            } catch (importError) {
              console.error('Error importing userService:', importError);
              await handleLogout();
              return;
            }
            
            // Try to get the profile if userService loaded successfully
            if (userService && userService.getProfile) {
              const userData = await userService.getProfile();
              if (userData) {
                setUser(userData as User);
                setIsAuthenticated(true);
              } else {
                console.log('No user data returned, logging out');
                await handleLogout();
              }
            } else {
              console.error('UserService or getProfile method not found');
              await handleLogout();
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Don't show an error alert to the user - just log them out silently
            await handleLogout();
          }
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      
      // Store user data in state
      setUser(response.user as User);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        message = error.message;
      }
      
      Alert.alert('Authentication Error', message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      
      // Store user data in state
      setUser(response.user as User);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Registration failed. Please try again.';
      
      if (error instanceof Error) {
        message = error.message;
      }
      
      Alert.alert('Registration Error', message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await handleLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data in context
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Context value
  const authContextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
