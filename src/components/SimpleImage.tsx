import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constant for a reliable placeholder image
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?w=800&auto=format&fit=crop';

interface SimpleImageProps {
  uri?: string;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  itemStorageKey?: string; // Add support for direct storage key
}

/**
 * A simple, reliable image component that handles loading and error states
 * without any complex caching or transformation logic.
 */
const SimpleImage: React.FC<SimpleImageProps> = ({ 
  uri, 
  style, 
  resizeMode = 'cover',
  itemStorageKey
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  
  // Try to find a cached image for this URI
  useEffect(() => {
    const lookupLocalImage = async () => {
      try {
        // Prioritize direct storage key if available (new method)
        if (itemStorageKey) {
          console.log(`Looking up images with storage key: ${itemStorageKey}`);
          const storedImages = await AsyncStorage.getItem(itemStorageKey);
          
          if (storedImages) {
            const parsedImages = JSON.parse(storedImages);
            if (parsedImages && parsedImages.length > 0) {
              const firstImage = parsedImages[0];
              console.log(`Found local image via storage key: ${firstImage}`);
              setDebugInfo(`Using local image: ${firstImage.substring(0, 20)}...`);
              setImageUri(firstImage);
              return;
            }
          }
        }
        
        // Fall back to URI mapping if direct storage key doesn't work
        if (uri) {
          // Try to find a local URI mapping for this server URL
          console.log(`Looking up local URI for server URL: ${uri}`);
          const localUri = await AsyncStorage.getItem(`image_${uri}`);
          
          if (localUri) {
            console.log(`Found cached local URI: ${localUri}`);
            setDebugInfo(`Using local URI: ${localUri.substring(0, 20)}...`);
            setImageUri(localUri);
          } else {
            console.log(`No cached local URI found, using server URL: ${uri}`);
            setDebugInfo(`Using server URL: ${uri.substring(0, 20)}...`);
            setImageUri(uri);
          }
        } else {
          setDebugInfo('No image URI provided');
        }
      } catch (error) {
        console.error('Error looking up local image:', error);
        setImageUri(uri);
      }
    };
    
    lookupLocalImage();
  }, [uri, itemStorageKey]);
  
  // Use a fallback if no URI is provided or if there's an error
  const displayUri = (!hasError && imageUri) ? imageUri : FALLBACK_IMAGE;
  
  // Add preloading for remote images
  useEffect(() => {
    if (uri && uri.startsWith('http')) {
      FastImage.preload([{ uri }]);
    }
  }, [uri]);
  
  return (
    <View style={[styles.container, style]}>
      <FastImage
        source={{ 
          uri: displayUri,
          priority: FastImage.priority.high
        }}
        style={styles.image}
        resizeMode={
          resizeMode === 'cover' ? FastImage.resizeMode.cover :
          resizeMode === 'contain' ? FastImage.resizeMode.contain :
          resizeMode === 'stretch' ? FastImage.resizeMode.stretch :
          FastImage.resizeMode.center
        }
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          console.log(`Image failed to load: ${displayUri}`);
          setHasError(true);
          setIsLoading(false);
        }}
      />
      
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#7950f2" />
        </View>
      )}
      
      {__DEV__ && (
        <Text style={styles.debugText}>{debugInfo}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
  },
  debugText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    fontSize: 10,
    padding: 2,
    textAlign: 'center',
  }
});

export default SimpleImage;
