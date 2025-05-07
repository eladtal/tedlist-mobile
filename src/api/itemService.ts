import api from './apiService';
import { ENDPOINTS, API_BASE_URL } from './config';
import { Platform } from 'react-native';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Image access constants
const SERVER_URL = 'https://tedlist-backend.onrender.com';
const IMAGE_PROXY_URL = `${SERVER_URL}/api/images`;
const S3_BUCKET_NAME = 'tedlist-app-uploads';
const S3_BASE_URL = `https://${S3_BUCKET_NAME}.s3.amazonaws.com`;

// Helper function to ensure image URLs are properly formatted
const ensureAbsoluteImageUrl = (imageUrl: string): string => {
  // Return empty string for null/undefined/empty values
  if (!imageUrl) return '';
  console.log(`[itemService] Processing imageUrl: ${imageUrl}`);
  
  // If it already contains S3 domain, ensure it has https:// prefix
  if (imageUrl.includes('s3.amazonaws.com')) {
    return imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl.replace(/^[/]+/, '')}`;
  }
  
  // If it's already a complete URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Extract the filename from any path
  const getFilename = (path: string): string => {
    // Remove all path prefixes, just keep the filename
    const cleaned = path.replace(/^.*[\/\\]/, '');
    console.log(`[itemService] Extracted filename: ${cleaned}`);
    return cleaned;
  };
  
  // Extract just the filename - this is key to avoiding path duplication
  const filename = getFilename(imageUrl);

  // TEMPORARY SOLUTION: Use placeholder images while server endpoint is being set up
  const categoryMap: Record<string, string> = {
    'electronics': 'https://via.placeholder.com/300/2196F3/FFFFFF?text=Electronics',
    'furniture': 'https://via.placeholder.com/300/4CAF50/FFFFFF?text=Furniture',
    'clothing': 'https://via.placeholder.com/300/FFC107/FFFFFF?text=Clothing',
    'books': 'https://via.placeholder.com/300/9C27B0/FFFFFF?text=Books',
    'toys': 'https://via.placeholder.com/300/E91E63/FFFFFF?text=Toys',
    'other': 'https://via.placeholder.com/300/607D8B/FFFFFF?text=Item'
  };
  
  // Check if the filename contains any category keywords for better placeholders
  let placeholderCategory = 'other';
  Object.keys(categoryMap).forEach(category => {
    if (filename.toLowerCase().includes(category)) {
      placeholderCategory = category;
    }
  });
  
  // Get a visually appealing placeholder based on the item category
  const placeholderUrl = categoryMap[placeholderCategory];
  
  console.log(`[itemService] Using placeholder: ${placeholderUrl}`);
  return placeholderUrl;
  
  // For other relative paths, use API base URL
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
    
  const imagePath = imageUrl.startsWith('/') 
    ? imageUrl 
    : `/${imageUrl}`;
    
  return `${baseUrl}${imagePath}`;
};

// Helper function specifically for thumbnails
const getThumbnailUrl = (imageUrl: string): string => {
  return ensureAbsoluteImageUrl(imageUrl);
};

// Item interfaces
export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  images: string[];
  thumbnails: string[];
  owner: {
    id: string;
    name: string;
  };
  status: 'available' | 'traded' | 'pending' | 'removed';
  createdAt: string;
  updatedAt: string;
  cacheKey?: string; // Add cacheKey to Item interface
}

export interface CreateItemRequest {
  name: string;
  description: string;
  category: string;
  condition: string;
  images: string[];
  cacheKey?: string; // Add cacheKey to CreateItemRequest interface
}

export interface UpdateItemRequest {
  name?: string;
  description?: string;
  category?: string;
  condition?: string;
  images?: string[];
  status?: 'available' | 'traded' | 'pending' | 'removed';
}

// Item filters
export interface ItemFilters {
  category?: string;
  condition?: string;
}

/**
 * Get all items with optional filters
 */
const getAllItems = async (filters?: ItemFilters): Promise<Item[]> => {
  try {
    let url = ENDPOINTS.ITEMS.GET_ALL;
    
    // Add query parameters if filters are provided
    if (filters) {
      const params = new URLSearchParams();
      
      if (filters.category) {
        params.append('category', filters.category);
      }
      
      if (filters.condition) {
        params.append('condition', filters.condition);
      }
      
      // Append query string to URL if any params exist
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

/**
 * Get items owned by the current user
 */
const getUserItems = async (): Promise<Item[]> => {
  try {
    console.log(`[ItemService] Fetching user items from: ${ENDPOINTS.ITEMS.GET_USER_ITEMS}`);
    
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response;
    try {
      response = await api.get(ENDPOINTS.ITEMS.GET_USER_ITEMS, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('[ItemService] User items API response received');
      console.log('[ItemService] Response type:', typeof response.data);
      console.log('[ItemService] Response is array:', Array.isArray(response.data));
      
      // Only log the structure, not the full content which could be huge
      if (Array.isArray(response.data)) {
        console.log(`[ItemService] Got ${response.data.length} items`);
        if (response.data.length > 0) {
          const sample = response.data[0];
          console.log('[ItemService] First item structure:', Object.keys(sample));
          console.log('[ItemService] First item has images?', !!sample.images);
          if (sample.images) {
            console.log('[ItemService] Images type:', typeof sample.images, 'length:', sample.images?.length);
          }
        }
      } else {
        console.log('[ItemService] Response data (non-array):', response.data);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[ItemService] Error fetching items:', err);
      throw err;
    }
    
    // Transform backend data to match expected mobile app format
    if (Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} items for the user`);
      const transformedItems = response.data.map((item: any) => {
        // Simple image processing - use ensureAbsoluteImageUrl for all images
        const processedImages = Array.isArray(item.images) && item.images.length > 0
          ? item.images.map((img: string) => ensureAbsoluteImageUrl(img))
          : ['https://picsum.photos/id/1/200/300']; // Default image if no images
        
        return {
          id: item._id || item.id || '',
          _id: item._id,
          name: item.title || item.name, // Support both formats
          title: item.title,
          description: item.description || '',
          condition: item.condition || 'Unknown',
          category: item.category,
          type: item.type,
          images: processedImages,
          thumbnails: processedImages,
          cacheKey: item.cacheKey, // Preserve cache key
          owner: item.owner || {
            id: item.userId || '',
            name: 'Owner'
          },
          status: item.status || 'available',
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
          userId: item.userId
        };
      });
      
      console.log('Transformed items count:', transformedItems.length);
      // Log first item for debugging
      if (transformedItems.length > 0) {
        console.log('First item images:', JSON.stringify(transformedItems[0].images));
      }
      
      return transformedItems;
    } else if (response.data && typeof response.data === 'object') {
      // Handle nested response formats
      if (response.data.items && Array.isArray(response.data.items)) {
        // Items nested in 'items' property
        console.log(`Found ${response.data.items.length} items in nested 'items' property`);
        return response.data.items.map((item: any) => {
          // Simple image processing - use ensureAbsoluteImageUrl for all images
          const processedImages = Array.isArray(item.images) && item.images.length > 0
            ? item.images.map((img: string) => ensureAbsoluteImageUrl(img))
            : ['https://picsum.photos/id/1/200/300']; // Default image if no images
            
          return {
            id: item._id || item.id || '',
            _id: item._id,
            name: item.title || item.name,
            title: item.title,
            description: item.description || '',
            condition: item.condition || 'Unknown',
            category: item.category,
            type: item.type,
            images: processedImages,
            thumbnails: processedImages,
            owner: item.owner || {
              id: item.userId || '',
              name: 'Owner'
            },
            status: item.status || 'available',
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString(),
            userId: item.userId
          };
        });
      } else {
        console.warn('Response data is an object but does not contain items array');
        return [];
      }
    }
    
    // If response is not an array or doesn't have an items property, return empty array with a warning
    console.warn('Unexpected response format from getUserItems:', response.data);
    return [];
  } catch (error) {
    console.error('Error getting user items:', error);
    throw error;
  }
};

/**
 * Get a single item by ID
 */
const getItemById = async (id: string): Promise<Item> => {
  try {
    const response = await api.get(ENDPOINTS.ITEMS.GET_ITEM(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new item
 */
const createItem = async (item: CreateItemRequest): Promise<Item> => {
  try {
    // Map the frontend field names to what the backend expects
    const backendItem = {
      title: item.name,          // Backend expects 'title' instead of 'name'
      description: item.description,
      type: 'trade',             // Backend only accepts 'trade' or 'sell' enum values
      condition: item.condition,
      images: item.images,       // These should be already uploaded image URLs
      cacheKey: item.cacheKey    // Pass through the cache key if present
    };
    
    console.log('Sending item to backend:', backendItem);
    
    const response = await api.post(ENDPOINTS.ITEMS.CREATE, backendItem);
    
    // Enhance response with additional fields
    const enhancedItem = {
      ...response.data,
      cacheKey: item.cacheKey,  // Preserve the cache key
      name: response.data.title || response.data.name  // Support both name formats
    };
    
    // Ensure the returned item has proper image URLs for the frontend
    if (enhancedItem && Array.isArray(enhancedItem.images)) {
      // Make sure image URLs are complete
      enhancedItem.images = enhancedItem.images.map((img: string) => ensureAbsoluteImageUrl(img));
      
      // Also create thumbnails array if not present
      if (!enhancedItem.thumbnails) {
        enhancedItem.thumbnails = enhancedItem.images;
      }
    }
    
    console.log('Enhanced item after creation:', enhancedItem);
    return enhancedItem;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

/**
 * Update an existing item
 */
const updateItem = async (id: string, item: UpdateItemRequest): Promise<Item> => {
  try {
    const response = await api.put(ENDPOINTS.ITEMS.UPDATE(id), item);
    return response.data;
  } catch (error) {
    console.error(`Error updating item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an item by ID
 */
const deleteItem = async (itemId: string): Promise<boolean> => {
  try {
    console.log(`Deleting item with ID: ${itemId}`);
    await api.delete(ENDPOINTS.ITEMS.DELETE(itemId));
    console.log('Item deleted successfully');
    return true;
  } catch (error) {
    console.error(`Error deleting item with ID ${itemId}:`, error);
    throw new Error(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Upload an image to S3 via the backend API
 * @param imageUri URI of the image to upload
 * @returns URL of the uploaded S3 image
 */
const uploadItemImage = async (imageUri: string): Promise<string> => {
  console.log('[UPLOAD] Starting S3 image upload...');
  console.log(`[UPLOAD] API_BASE_URL: ${API_BASE_URL}`);
  console.log(`[UPLOAD] Endpoint: ${ENDPOINTS.ITEMS.UPLOAD_IMAGE}`);
  console.log(`[UPLOAD] Full URL: ${API_BASE_URL}${ENDPOINTS.ITEMS.UPLOAD_IMAGE}`);
  
  try {
    // Create the form data with minimal manipulation
    const formData = new FormData();
    
    // Extract file name
    const fileName = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
    console.log(`[UPLOAD] File name: ${fileName}`);
    console.log(`[UPLOAD] Image URI: ${imageUri}`);
    
    // Add the image to form data with clean properties
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: 'image/jpeg',
    } as any);
    
    // Add auth token with proper format - using the same key as in apiService.ts
    const token = await AsyncStorage.getItem('auth_token');
    console.log(`[UPLOAD] Auth token available: ${!!token}`);
    
    if (!token) {
      console.error('[UPLOAD] No auth token found in AsyncStorage with key "auth_token"');
      throw new Error('Authentication required. Please log in.');
    }
    
    // Make sure to add 'Bearer ' prefix if not already included
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    console.log('[UPLOAD] Using token format:', formattedToken.substring(0, 15) + '...');
    
    const headers = { 
      'Content-Type': 'multipart/form-data',
      'Authorization': formattedToken
    };
    
    // Send request
    console.log(`[UPLOAD] Sending request to ${ENDPOINTS.ITEMS.UPLOAD_IMAGE}`);
    
    // Use direct axios call for more control
    try {
      const response = await axios.post(
        `${API_BASE_URL}${ENDPOINTS.ITEMS.UPLOAD_IMAGE}`, 
        formData, 
        { 
          headers,
          timeout: 30000, // Increase timeout to 30 seconds
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
            console.log(`[UPLOAD] Upload progress: ${percentCompleted}%`);
          }
        }
      );
      
      // Log the raw response for diagnosis
      console.log('[UPLOAD] Server response status:', response.status);
      console.log('[UPLOAD] Server response data:', JSON.stringify(response.data, null, 2));
      
      // Extract the S3 image URL from the response
      if (response.data?.success && response.data?.data?.imageUrl) {
        const s3ImageUrl = response.data.data.imageUrl;
        console.log(`[UPLOAD] Successfully uploaded to S3: ${s3ImageUrl}`);
        return s3ImageUrl;
      } else {
        console.error('[UPLOAD] Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (axiosError) {
      // Handle axios-specific errors
      if (axios.isAxiosError(axiosError)) {
        console.error('[UPLOAD] Axios error details:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message
        });
        
        if (axiosError.response?.data) {
          throw new Error(`Server error: ${JSON.stringify(axiosError.response.data)}`);
        }
      }
      throw axiosError;
    }
  } catch (error) {
    console.error('[UPLOAD] Error:', error);
    throw error;
  }
};

// Export all methods
const itemService = {
  getAllItems,
  getUserItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  uploadItemImage,
};

export default itemService;
