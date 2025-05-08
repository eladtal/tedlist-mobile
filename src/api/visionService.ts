import api from './apiService';
import { ENDPOINTS, API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnalysisResult {
  title: string;
  description: string;
  category: string;
  condition: string;
  analysis?: {
    labels: {
      description: string;
      score: number;
    }[];
    objects: {
      name: string;
      score: number;
    }[];
  }
}

/**
 * Analyze an image using Google Cloud Vision API
 * @param imageUri - Local URI of the image to analyze
 * @returns Analysis result with suggested item details
 */
export const analyzeImage = async (imageUri: string): Promise<AnalysisResult> => {
  try {
    console.log('Preparing to analyze image:', imageUri);
    
    // Create form data with the image
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg', // Assuming JPEG format, adjust if needed
      name: 'image.jpg',
    } as any);
    
    // Print config values to debug
    console.log('Vision endpoints in config:', ENDPOINTS.VISION);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Full endpoint path:', ENDPOINTS.VISION.ANALYZE_IMAGE);
    
    // Set endpoint for image analysis
    const endpoint = `${API_BASE_URL}${ENDPOINTS.VISION.ANALYZE_IMAGE}`;
    console.log('Final API endpoint being called:', endpoint);
    
    // Get auth token from storage
    const token = await AsyncStorage.getItem('auth_token');
    
    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Don't set Content-Type header, let it be set automatically for FormData
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error:', errorText);
      throw new Error(`Vision API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Vision API response:', data);
    
    if (!data.success || !data.data) {
      throw new Error('Invalid response from Vision API');
    }
    
    return data.data as AnalysisResult;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

/**
 * Analyze an image using its URL with Google Cloud Vision API
 * @param imageUrl - URL of the image to analyze
 * @returns Analysis result with suggested item details
 */
export const analyzeImageUrl = async (imageUrl: string): Promise<AnalysisResult> => {
  try {
    console.log('Preparing to analyze image URL:', imageUrl);
    
    // Make the API request
    const response = await api.post(ENDPOINTS.VISION.ANALYZE_URL, { imageUrl });
    
    if (!response.data || !response.data.success) {
      throw new Error('Invalid response from Vision API');
    }
    
    console.log('Vision API URL analysis response:', response.data);
    return response.data.data as AnalysisResult;
  } catch (error) {
    console.error('Error analyzing image URL:', error);
    throw error;
  }
};

// Export all methods
/**
 * Test the Vision API connectivity (no authentication required)
 * Should be used for troubleshooting only
 */
export const testVisionApi = async (): Promise<any> => {
  try {
    console.log('Testing Vision API connection');
    const response = await fetch(`${API_BASE_URL}/api/vision/test`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API test failed:', errorText);
      throw new Error(`Vision API test failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Vision API test response:', data);
    return data;
  } catch (error) {
    console.error('Error testing Vision API:', error);
    throw error;
  }
};

/**
 * Debug the Vision API connectivity and configuration
 */
export const debugVisionApi = async (): Promise<any> => {
  try {
    console.log('Debugging Vision API');
    const response = await fetch(`${API_BASE_URL}/api/vision/debug`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API debug failed:', errorText);
      throw new Error(`Vision API debug failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Vision API debug info:', data);
    return data;
  } catch (error) {
    console.error('Error debugging Vision API:', error);
    throw error;
  }
};

/**
 * Analyze an image using a test endpoint (no auth required)
 * Should be used for troubleshooting only
 */
export const analyzeImageTest = async (imageUri: string): Promise<AnalysisResult> => {
  try {
    console.log('Testing image analysis with:', imageUri);
    
    // TEMPORARY FLAG: Set to false to use the real API
    const useMockData = false;
    
    if (useMockData) {
      console.log('Using mock data instead of real API call due to backend 404 issues');
      
      // Wait 1 second to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock data
      const mockResult: AnalysisResult = {
        title: 'Test Item',
        description: 'This is a mock item generated while the backend API is being fixed. This would normally contain information extracted from the image.',
        category: 'Electronics',
        condition: 'Good',
        analysis: {
          labels: [
            { description: 'Electronic device', score: 0.95 },
            { description: 'Gadget', score: 0.92 },
            { description: 'Technology', score: 0.89 }
          ],
          objects: [
            { name: 'Device', score: 0.95 }
          ]
        }
      };
      
      console.log('Returning mock Vision API response:', mockResult);
      return mockResult;
    }
    
    // Create form data with the image
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg', // Assuming JPEG format, adjust if needed
      name: 'image.jpg',
    } as any);
    
    // Print config values to debug
    console.log('Vision endpoints in config:', ENDPOINTS.VISION);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Full endpoint path:', ENDPOINTS.VISION.ANALYZE_IMAGE);
    
    // Set endpoint for image analysis
    const endpoint = `${API_BASE_URL}${ENDPOINTS.VISION.ANALYZE_IMAGE}`;
    console.log('Final API endpoint being called:', endpoint);
    
    // Make the API request without auth token (test endpoint)
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error:', errorText);
      throw new Error(`Vision API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Vision API response:', data);
    
    if (!data.success || !data.data) {
      throw new Error('Invalid response from Vision API');
    }
    
    return data.data as AnalysisResult;
  } catch (error) {
    console.error('Error analyzing image with test endpoint:', error);
    throw error;
  }
};

const visionService = {
  analyzeImage,
  analyzeImageUrl,
  testVisionApi,
  debugVisionApi,
  analyzeImageTest
};

export default visionService;
