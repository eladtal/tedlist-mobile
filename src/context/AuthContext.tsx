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
      
      // Clear storage first - this is the most important part
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      
      // Then try to call logout API to invalidate token on server (if it exists)
      // The server call is optional - local cleanup is what matters
      try {
        // We'll skip the server call since we know the endpoint doesn't exist
        // This prevents unnecessary 404 errors in the console
        // await authService.logout();
        console.log('Skipping server logout call - endpoint not implemented');
      } catch (logoutError) {
        // Non-critical error - we've already cleared local state
        console.log('Non-critical: Error calling logout API:', logoutError);
      }
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
        // Clear any existing tokens to force login screen
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
        console.log('Cleared authentication tokens to force login screen');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
        
        // The code below will not execute due to the return above
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
              try {
                // Don't attempt profile fetch if we're not fully authenticated yet
                // This prevents the error from showing on initial app load
                if (!token) {
                  setIsAuthenticated(false);
                  setIsLoading(false);
                  return;
                }
                
                // Add timeout to prevent hanging on startup
                const profilePromise = userService.getProfile();
                const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Profile fetch timed out')), 5000);
                });
                
                // Race the profile fetch against the timeout
                const userData = await Promise.race([profilePromise, timeoutPromise])
                  .catch(error => {
                    // Check for 404 errors specifically
                    if (error?.message?.includes('404') || 
                        error?.response?.status === 404 || 
                        error?.toString().includes('404')) {
                      console.log('Profile endpoint returned 404, server might be initializing');
                      // Return null to continue without error
                      return null;
                    }
                        // For other errors, handle gracefully instead of throwing
                    console.error('Error fetching profile:', error);
                    // Return null to continue without error - this prevents red error screens
                    return null;
                  });
                  
                if (userData) {
                  setUser(userData as User);
                  setIsAuthenticated(true);
                } else {
                  console.log('No user data returned, assuming not logged in');
                  // Properly enforce logout - don't continue unauthenticated
                  setIsAuthenticated(false);
                  await handleLogout(); // Force logout to show login screen
                }
              } catch (profileError) {
                // Don't display errors during startup as red console errors
              console.log('Profile fetch issue:', profileError);
                // Silent failure - don't show error to user on startup
                setIsAuthenticated(false);
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
