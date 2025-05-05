import { apiRequest, setAuthTokens } from './apiService';
import { ENDPOINTS } from './config';

// Types for auth requests
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Define more flexible response types to handle various backend response formats
interface AuthResponse {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  token?: string;        // Some backends only return a single token
  refresh_token?: string; // Alternative naming for refresh token
  access_token?: string;  // Alternative naming for access token
  auth_token?: string;    // Another common token name
  jwt?: string;          // Another possible token name
  success?: boolean;     // Some APIs include a success flag
  message?: string;      // Message from API
}

// Auth service functions
export const authService = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      // Use the standard format that returned 401 (which means the endpoint is correct)
      console.log('Sending login request to:', ENDPOINTS.AUTH.LOGIN);
      
      // For debugging - log the request format
      console.log('Login payload:', { 
        email: credentials.email, 
        password: '******' // mask password for security
      });
      
      const response = await apiRequest<AuthResponse>('POST', ENDPOINTS.AUTH.LOGIN, credentials);
      
      // For debugging - log success
      console.log('Login successful!', response);
      
      // Extract tokens, handling various possible response formats
      const accessToken = response.accessToken || response.access_token || response.token || response.auth_token || response.jwt;
      const refreshToken = response.refreshToken || response.refresh_token || response.token || ''; // Fallback to empty if no refresh token
      
      console.log('Extracted tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
      
      await setAuthTokens(accessToken, refreshToken);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  
  // Register new user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      // Use the standard format
      console.log('Sending registration request to:', ENDPOINTS.AUTH.REGISTER);
      console.log('Registration payload:', {
        name: userData.name,
        email: userData.email,
        password: '******' // mask password for security
      });
      
      const response = await apiRequest<AuthResponse>('POST', ENDPOINTS.AUTH.REGISTER, userData);
      
      console.log('Registration successful!', response);
      
      // Extract tokens, handling various possible response formats
      const accessToken = response.accessToken || response.access_token || response.token || response.auth_token || response.jwt;
      const refreshToken = response.refreshToken || response.refresh_token || response.token || ''; // Fallback to empty if no refresh token
      
      console.log('Extracted tokens from registration:', { accessToken: !!accessToken, refreshToken: !!refreshToken });
      
      if (accessToken) {
        await setAuthTokens(accessToken, refreshToken);
      } else {
        console.warn('No token returned from registration. User may need to login separately.');
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: async (): Promise<void> => {
    try {
      // Check if we have a token before trying to call the API
      // This is a best-effort approach - we'll try to tell the server about logout
      // But we won't fail the whole logout process if this fails
      try {
        await apiRequest<{ success: boolean }>('POST', ENDPOINTS.AUTH.LOGOUT);
        console.log('Successfully called logout API');
      } catch (apiError) {
        // Just log this error but don't rethrow - logout should still succeed locally
        console.log('Non-critical: Logout API call failed, proceeding with local logout');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // We don't rethrow here - logout should never fail from the user's perspective
    }
  }
};

export default authService;
