// Export API configuration
export * from './config';

// Export API services
export { default as authService } from './authService';
export { default as itemService } from './itemService';
export { default as tradeService } from './tradeService';
export { default as notificationService } from './notificationService';
export { default as userService } from './userService';

// Export types
export type { User, UpdateProfileRequest } from './userService';
export type { Item, CreateItemRequest, UpdateItemRequest } from './itemService';
export type { Trade, TradeMatch } from './tradeService';
export type { Notification } from './notificationService';
