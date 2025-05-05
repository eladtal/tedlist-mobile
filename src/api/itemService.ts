import api from './apiService';
import { ENDPOINTS } from './config';

// Item interfaces
export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  images: string[];
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
    const response = await api.get(ENDPOINTS.ITEMS.GET_USER_ITEMS);
    return response.data;
  } catch (error) {
    console.error('Error fetching user items:', error);
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
 * Delete an item
 */
const deleteItem = async (id: string): Promise<void> => {
  try {
    await api.delete(ENDPOINTS.ITEMS.DELETE(id));
  } catch (error) {
    console.error(`Error deleting item with ID ${id}:`, error);
    throw error;
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
