import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, DEFAULT_TIMEOUT } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Add a request interceptor to include auth token in requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh on 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // If error is 401 Unauthorized and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
          // No refresh token available, user needs to login again
          await handleLogout();
          return Promise.reject(error);
        }
        
        // Call refresh token endpoint
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        
        // Update auth header and retry the original request
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, user needs to login again
        await handleLogout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle logout (clear tokens)
const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    // You could also use an event system here to notify the app that the user has been logged out
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
};

// Function to set auth tokens after login/register
export const setAuthTokens = async (accessToken: string | undefined | null, refreshToken: string | undefined | null) => {
  try {
    // Check if tokens are valid
    if (!accessToken) {
      console.error('No access token provided to setAuthTokens');
      return;
    }
    
    if (!refreshToken) {
      console.error('No refresh token provided to setAuthTokens');
      return;
    }
    
    // Store the valid tokens
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  } catch (error) {
    console.error('Error setting auth tokens:', error);
    throw error;
  }
};

// Generic API request function
export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    let response: AxiosResponse;
    
    switch (method) {
      case 'GET':
        response = await apiClient.get(url, config);
        break;
      case 'POST':
        response = await apiClient.post(url, data, config);
        break;
      case 'PUT':
        response = await apiClient.put(url, data, config);
        break;
      case 'DELETE':
        response = await apiClient.delete(url, config);
        break;
      case 'PATCH':
        response = await apiClient.patch(url, data, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Enhanced error logging for API errors
      console.error(`===== API ERROR DETAILS =====`);
      console.error(`Method: ${method}, URL: ${url}`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Data sent:`, data);
      
      // Log the full response for debugging
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response headers:`, error.response.headers);
        console.error(`Response data:`, error.response.data);
      }
      
      // Handle specific API errors here
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message;
      
      console.error(`Error message: ${errorMessage}`);
      
      throw new Error(errorMessage);
    }
    
    // For non-Axios errors
    console.error(`API ${method} request to ${url} failed with unexpected error:`, error);
    throw error;
  }
};

export default apiClient;
