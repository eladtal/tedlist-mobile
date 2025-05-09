/**
 * API Configuration
 */

// Development API URLs for different scenarios:

// Your production backend on render.com
const PRODUCTION_API_URL = 'https://tedlist-backend.onrender.com';

// For Android Emulator local testing (if needed)
const EMULATOR_LOCAL_API_URL = 'http://10.0.2.2:8000';

// For Physical Device local testing (if needed)
const PHYSICAL_DEVICE_LOCAL_API_URL = 'http://192.168.1.100:8000';

// Choose which URL to use based on your testing needs
// For connecting to your deployed render.com backend:
export const DEV_API_URL = PRODUCTION_API_URL;

// For local testing with emulator (uncomment if needed):
// export const DEV_API_URL = EMULATOR_LOCAL_API_URL;

// For local testing with physical device (uncomment if needed):
// export const DEV_API_URL = PHYSICAL_DEVICE_LOCAL_API_URL;

// Production API URL (same as dev for now since we're using the deployed version)
export const PROD_API_URL = PRODUCTION_API_URL;

// Current environment
export const IS_DEV = __DEV__; // React Native provides this global

// Export the appropriate API URL based on environment
export const API_BASE_URL = IS_DEV ? DEV_API_URL : PROD_API_URL;

// API Endpoints - Using the endpoint that returned 401 (correct structure)
export const ENDPOINTS = {
  // Auth endpoints - using the confirmed working endpoint
  AUTH: {
    // Using the endpoint that returned 401 status
    LOGIN: '/api/auth/login',  // Assuming this is the one that worked, update if different
    REGISTER: '/api/auth/register',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
  },
  
  // User endpoints
  USER: {
    // Use auth/validate endpoint instead of non-existent users/profile
    PROFILE: '/api/auth/validate',
    UPDATE_PROFILE: '/api/auth/update', // This will need to be implemented on backend
  },
  
  // Item endpoints
  ITEMS: {
    GET_ALL: '/api/items',
    GET_USER_ITEMS: '/api/items/user',
    GET_ITEM: (id: string) => `/api/items/${id}`,
    CREATE: '/api/items',
    UPDATE: (id: string) => `/api/items/${id}`,
    DELETE: (id: string) => `/api/items/${id}`,
    UPLOAD_IMAGE: '/api/items/upload-image',
  },
  
  // Trade endpoints
  TRADES: {
    GET_ALL: '/api/trades',
    GET_USER_TRADES: '/api/trades/user',
    GET_POTENTIAL_MATCHES: '/api/trades/matches',
    CREATE: '/api/trades',
    ACCEPT: (id: string) => `/api/trades/${id}/accept`,
    REJECT: (id: string) => `/api/trades/${id}/reject`,
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    GET_ALL: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
  },
  
  // Vision API endpoints
  VISION: {
    ANALYZE_IMAGE: '/api/vision/analyze-test', // Using test endpoint for now
    ANALYZE_URL: '/api/vision/analyze-url-test', // Using test endpoint for now
  }
};

// Request timeouts
export const DEFAULT_TIMEOUT = 10000; // 10 seconds
