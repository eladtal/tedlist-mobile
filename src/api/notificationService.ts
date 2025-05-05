import { apiRequest } from './apiService';
import { ENDPOINTS } from './config';

// Notification types
export interface Notification {
  id: string;
  type: 'match' | 'trade' | 'system' | 'admin';
  title: string;
  message: string;
  read: boolean;
  relatedItemId?: string;
  relatedTradeId?: string;
  createdAt: string;
}

// Notification service functions
export const notificationService = {
  // Get all notifications for the logged in user
  getNotifications: async (): Promise<Notification[]> => {
    return apiRequest<Notification[]>('GET', ENDPOINTS.NOTIFICATIONS.GET_ALL);
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>('POST', ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
  },
  
  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>('POST', ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  }
};

export default notificationService;
