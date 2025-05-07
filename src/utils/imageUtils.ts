/**
 * Image utilities for the Tedlist app
 * Provides a consistent way to handle image URLs and fallbacks
 */
import { FastImageProps } from 'react-native-fast-image';

// S3 bucket configuration
const S3_BUCKET_URL = 'https://tedlist-app-uploads.s3.amazonaws.com';

/**
 * Get a properly formatted S3 image URL
 * @param imageUrl The raw image URL or path
 * @returns A properly formatted URL
 */
export const getS3ImageUrl = (imageUrl: string | null | undefined): string | null => {
  console.log('🔎 [imageUtils] Processing URL:', imageUrl);
  if (!imageUrl) {
    console.log('❌ [imageUtils] Null or empty URL');
    return null;
  }
  
  // Already a complete URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('✅ [imageUtils] Already absolute URL:', imageUrl);
    return imageUrl;
  }
  
  // Handle uploads/ prefix
  if (imageUrl.startsWith('uploads/')) {
    const result = `${S3_BUCKET_URL}/${imageUrl}`;
    console.log('✅ [imageUtils] Converted uploads/ path:', result);
    return result;
  }
  
  // For images with timestamp-based names (from mobile uploads)
  if (imageUrl.includes('images-') && imageUrl.includes('.')) {
    const result = `${S3_BUCKET_URL}/uploads/${imageUrl}`;
    console.log('✅ [imageUtils] Converted timestamp image:', result);
    return result;
  }
  
  // Default case - assume it's a relative path in the bucket
  const result = `${S3_BUCKET_URL}/${imageUrl}`;
  console.log('✅ [imageUtils] Used default S3 conversion:', result);
  return result;
};

/**
 * Get FastImage props for an image URL with proper caching
 * @param imageUrl The image URL or path
 * @returns FastImage props object
 */
export const getFastImageProps = (imageUrl: string | null | undefined): FastImageProps => {
  // Get the properly formatted S3 URL
  const formattedUrl = getS3ImageUrl(imageUrl);
  
  // If we have a valid URL, return FastImage props
  if (formattedUrl) {
    return {
      source: {
        uri: formattedUrl,
        cache: 'immutable' // Use immutable for S3 images that don't change
      },
      resizeMode: 'cover'
    };
  }
  
  // Fallback to default image
  return {
    source: { uri: DEFAULT_IMAGES.ITEM_PLACEHOLDER },
    resizeMode: 'cover'
  };
};

/**
 * Process an array of image URLs to ensure they're properly formatted
 * @param images Array of image URLs or paths
 * @returns Array of properly formatted S3 URLs
 */
export const processImageArray = (images: any[] | null | undefined): string[] => {
  // Handle invalid input
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }
  
  // Process each image URL
  return images
    .filter(img => typeof img === 'string' && img.trim().length > 0)
    .map(img => getS3ImageUrl(img) || '')
    .filter(url => url.length > 0);
};

// A set of reliable, high-quality placeholder images that always work
export const getConditionBasedImage = (condition: string): string => {
  // Map conditions to specific high-quality images that are guaranteed to work
  switch(condition?.toLowerCase()) {
    case 'new':
      return 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800&auto=format&fit=crop';
    case 'like new':
      return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop';
    case 'excellent':
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop';
    case 'good':
      return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop';
    case 'fair':
      return 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&auto=format&fit=crop';
    case 'poor':
      return 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&auto=format&fit=crop';
    default:
      return 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop';
  }
};

// Get placeholder image based on item type
export const getTypeBasedImage = (type: string): string => {
  switch(type?.toLowerCase()) {
    case 'trade':
      return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop';
    case 'sell':
      return 'https://images.unsplash.com/photo-1580493113011-ad79f792a257?w=800&auto=format&fit=crop';
    default:
      return 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?w=800&auto=format&fit=crop';
  }
};

// A set of default images to ensure a consistent look
export const DEFAULT_IMAGES = {
  ITEM_PLACEHOLDER: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&auto=format&fit=crop',
  ERROR_PLACEHOLDER: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800&auto=format&fit=crop',
  USER_PLACEHOLDER: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop',
};
