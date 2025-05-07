import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface S3ImageProps {
  imageUrl: string | null | undefined;
  style?: any;
  category?: string;
}

/**
 * S3Image component that uses the existing server image proxy endpoint
 */
// Define styles first to avoid reference before declaration error
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 1,
  },
});

const S3Image = ({ imageUrl, style }: S3ImageProps) => {
  console.log('⭐ S3Image received imageUrl:', imageUrl);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Get auth token on mount
  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem('auth_token');
      setAuthToken(token);
    };
    getToken();
  }, []);
  
  // Function to get the appropriate image URL
  const getImageUrl = (url: string | null | undefined): string | null => {
    console.log('🔍 getImageUrl called with:', url);
    
    // Return null for empty URLs
    if (!url || url === '') {
      console.log(' No image URL provided');
      return null;
    }
    

    
    // Extract the filename from various URL formats
    let filename: string | null = null;
    
    // Case 1: Already a proxy URL
    if (url.startsWith(`${API_BASE_URL}/api/images/`)) {
      // Remove the images- prefix if it exists in the URL
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1].replace(/^images-/, '');
      const newUrl = `${API_BASE_URL}/api/images/${filename}`;
      console.log(' Modified proxy URL to remove prefix:', newUrl);
      return newUrl;
    }
    
    // Case 2: S3 URL with uploads path
    const uploadsMatch = url.match(/uploads[\/\\]([^\/\\]+)$/);
    if (uploadsMatch) {
      filename = uploadsMatch[1];
      console.log(' Extracted filename from uploads path:', filename);
    }
    
    // Case 3: Direct filename (with or without prefix)
    else if (url.match(/^([\w-]+-)?[\d-]+\.(jpg|jpeg|png|gif)$/i)) {
      filename = url.replace(/^[^0-9]+-/, '');
      console.log(' Using direct filename:', filename);
    }
    
    // Case 4: Full URL that's not our proxy
    else if (url.startsWith('http')) {
      const urlFilename = url.split('/').pop();
      if (urlFilename?.match(/^([\w-]+-)?[\d-]+\.(jpg|jpeg|png|gif)$/i)) {
        filename = urlFilename.replace(/^[^0-9]+-/, '');
        console.log(' Extracted filename from URL:', filename);
      } else {
        console.log(' Using external URL as is:', url);
        return url;
      }
    }
    
    if (!filename) {
      console.log(' Could not extract valid filename from:', url);
      return null;
    }
    
    // Return URL through the backend proxy
    const proxyUrl = `${API_BASE_URL}/api/images/${filename}`;
    console.log(' Using proxy URL:', proxyUrl);
    return proxyUrl;
  };
  
  // Get the appropriate URL for this image
  const finalUrl = getImageUrl(imageUrl);
  
  return (
    <View style={[styles.container, style]}>
      {loading && (
        <ActivityIndicator 
          style={styles.loader} 
          size="small" 
          color="#0066cc" 
        />
      )}
      
      {finalUrl && (
        <Image
          source={{
            uri: finalUrl,
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : undefined
          }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(e: { nativeEvent: any }) => {
            console.log('Image error:', e.nativeEvent);
            setError(true);
            setLoading(false);
          }}
          onLoad={() => {
            setError(false);
          }}
        />
      )}
    </View>
  );
};

export default S3Image;
