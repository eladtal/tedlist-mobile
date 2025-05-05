import { apiRequest } from './apiService';
import { ENDPOINTS } from './config';

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'admin';
  stats?: {
    trades: number;
    listings: number;
    xp: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  bio?: string;
}

// User service functions
export const userService = {
  // Get the user's profile
  getProfile: async (): Promise<User> => {
    try {
      console.log('Fetching user profile...');
      const response = await apiRequest<User>('GET', ENDPOINTS.USER.PROFILE);
      console.log('User profile fetched successfully');
      return response;
    } catch (error) {
      console.error('Error in getProfile:', error);
      // Transform the error to be more informative
      if (error instanceof Error) {
        throw new Error(`Failed to get user profile: ${error.message}`);
      } else {
        throw new Error('Failed to get user profile: Unknown error');
      }
    }
  },
  
  // Update user profile
  updateProfile: async (profileData: UpdateProfileRequest): Promise<User> => {
    // Handle profile with avatar upload
    if (profileData.avatar && profileData.avatar.startsWith('file://')) {
      // For avatar upload using form data
      const formData = new FormData();
      
      if (profileData.name) formData.append('name', profileData.name);
      if (profileData.bio) formData.append('bio', profileData.bio);
      
      // Add avatar image
      const uriParts = profileData.avatar.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('avatar', {
        uri: profileData.avatar,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`,
      } as any);
      
      return apiRequest<User>('PUT', ENDPOINTS.USER.UPDATE_PROFILE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    
    // For regular profile updates without file upload
    return apiRequest<User>('PUT', ENDPOINTS.USER.UPDATE_PROFILE, profileData);
  }
};

export default userService;
