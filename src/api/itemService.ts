import api from './apiService';
import { ENDPOINTS, API_BASE_URL } from './config';

// Helper function to format image URLs
const formatImageUrl = (imageUrl: string, size?: 'thumbnail' | 'medium' | 'full'): string => {
  if (!imageUrl) {
    return 'https://via.placeholder.com/150';
  }

  // If it's already an absolute URL, handle size parameter if needed
  if (imageUrl.startsWith('http')) {
    // If no size specified or it's full size, return as is
    if (!size || size === 'full') {
      return imageUrl;
    }
    
    // Try to add size parameter if supported by backend
    try {
      const url = new URL(imageUrl);
      
      // Common size parameter formats (can be customized based on your backend)
      if (size === 'thumbnail') {
        url.searchParams.set('size', 'thumbnail');
        // Or url.searchParams.set('width', '150');
      } else if (size === 'medium') {
        url.searchParams.set('size', 'medium');
        // Or url.searchParams.set('width', '300');
      }
      
      return url.toString();
    } catch (e) {
      // If URL parsing fails, return original URL
      return imageUrl;
    }
  }
  
  // Handle relative URLs by prepending the API base URL
  const baseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.slice(0, -1) 
    : API_BASE_URL;
  
  const fullPath = imageUrl.startsWith('/') 
    ? `${baseUrl}${imageUrl}` 
    : `${baseUrl}/${imageUrl}`;
    
  // Add size parameter if needed and supported by backend
  if (!size || size === 'full') {
    return fullPath;
  }
  
  // Add size parameter to the URL
  const separator = fullPath.includes('?') ? '&' : '?';
  
  if (size === 'thumbnail') {
    return `${fullPath}${separator}size=thumbnail`;
    // Or return `${fullPath}${separator}width=150`;
  } else if (size === 'medium') {
    return `${fullPath}${separator}size=medium`;
    // Or return `${fullPath}${separator}width=300`;
  }
  
  return fullPath;
};

// Helper function specifically for thumbnails
const getThumbnailUrl = (imageUrl: string): string => {
  return formatImageUrl(imageUrl, 'thumbnail');
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
}

export interface CreateItemRequest {
  name: string;
  description: string;
  category: string;
  condition: string;
  images: string[];
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
    console.log(`Fetching user items from: ${ENDPOINTS.ITEMS.GET_USER_ITEMS}`);
    const response = await api.get(ENDPOINTS.ITEMS.GET_USER_ITEMS);
    console.log('User items API response:', JSON.stringify(response.data, null, 2));
    
    // Transform backend data to match expected mobile app format
    if (Array.isArray(response.data)) {
      console.log(`Found ${response.data.length} items for the user`);
      const transformedItems = response.data.map((item: any) => {
        // Process images to ensure proper URLs
        const processedImages = Array.isArray(item.images) 
          ? item.images.map((img: string) => formatImageUrl(img, 'full'))
          : (item.images ? [formatImageUrl(item.images, 'full')] : ['https://via.placeholder.com/150']);
        
        // Create thumbnails for better performance in list views
        const thumbnails = Array.isArray(item.images)
          ? item.images.map((img: string) => getThumbnailUrl(img))
          : (item.images ? [getThumbnailUrl(item.images)] : ['https://via.placeholder.com/150']);
        
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
          thumbnails: thumbnails,
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
      
      console.log('Transformed items:', JSON.stringify(transformedItems.slice(0, 1), null, 2)); // Log first item for debugging
      return transformedItems;
    } else if (response.data && typeof response.data === 'object' && response.data.items) {
      // Handle case where items are nested in an 'items' property
      console.log(`Found ${response.data.items.length} items in 'items' property`);
      const items = response.data.items;
      return items.map((item: any) => {
        // Process images to ensure proper URLs
        const processedImages = Array.isArray(item.images) 
          ? item.images.map((img: string) => formatImageUrl(img, 'full'))
          : (item.images ? [formatImageUrl(item.images, 'full')] : ['https://via.placeholder.com/150']);
          
        // Create thumbnails for better performance in list views
        const thumbnails = Array.isArray(item.images)
          ? item.images.map((img: string) => getThumbnailUrl(img))
          : (item.images ? [getThumbnailUrl(item.images)] : ['https://via.placeholder.com/150']);
        
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
          thumbnails: thumbnails,
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
    }
    
    // If response is not an array or doesn't have an items property, return empty array with a warning
    console.warn('API returned unexpected format for user items:', response.data);
    return [];
  } catch (error) {
    console.error('Error fetching user items:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
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
    const response = await api.post(ENDPOINTS.ITEMS.CREATE, item);
    return response.data;
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
 * Upload an item image
 * @param uri Local URI of the image to upload
 * @returns URL of the uploaded image
 */
const uploadItemImage = async (uri: string): Promise<string> => {
  try {
    // Create form data for the image
    const formData = new FormData();
    
    // Extract the file name from the URI
    const uriParts = uri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // Extract file extension
    const fileExtParts = fileName.split('.');
    const fileExt = fileExtParts[fileExtParts.length - 1];
    
    // Create a file object for the image
    const file = {
      uri,
      name: fileName,
      type: `image/${fileExt}`
    };
    
    // @ts-ignore - FormData expects a different type than what we have
    formData.append('image', file);
    
    // Send the request with the form data
    const response = await api.post(ENDPOINTS.ITEMS.UPLOAD_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Return the URL of the uploaded image
    return response.data.imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image. Please try again.');
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
