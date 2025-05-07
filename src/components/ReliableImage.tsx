import React, { useState, useEffect } from 'react';
import { 
  Image, 
  ImageProps, 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  Text 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define reliable fallback images that we know work
const FALLBACK_IMAGES: string[] = [
  // No fallback images - we only want to show real S3 images or nothing
];

interface ReliableImageProps extends ImageProps {
  localImageKey?: string; // Optional key for AsyncStorage
}

const ReliableImage: React.FC<ReliableImageProps> = ({ 
  source, 
  style, 
  localImageKey,
  ...props 
}) => {
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSource, setImageSource] = useState(source);
  const [fallbackIndex, setFallbackIndex] = useState(-1); // -1 means use original source

  useEffect(() => {
    // First try to get cached local URI if we have a localImageKey
    if (localImageKey) {
      AsyncStorage.getItem(`@image_uri_${localImageKey}`)
        .then(localUri => {
          if (localUri) {
            console.log('Using cached local image:', localUri);
            setImageSource({ uri: localUri });
          }
        })
        .catch(err => {
          console.error('Error retrieving cached image URI:', err);
        });
    }
  }, [localImageKey]);

  const handleError = () => {
    setError(true);
    setLoading(false);
    
    // Try the next fallback image
    const nextIndex = fallbackIndex + 1;
    
    if (nextIndex < FALLBACK_IMAGES.length) {
      console.log('Using fallback image:', FALLBACK_IMAGES[nextIndex]);
      setFallbackIndex(nextIndex);
      setImageSource({ uri: FALLBACK_IMAGES[nextIndex] });
    } else {
      // We've tried all fallbacks, show placeholder
      console.log('All fallbacks failed, showing error state');
    }
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Original or fallback image */}
      <Image
        {...props}
        source={imageSource}
        style={styles.image}
        onError={handleError}
        onLoad={handleLoad}
      />
      
      {/* Loading indicator */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color="#7950f2" />
        </View>
      )}
      
      {/* Error state - only if all fallbacks have failed */}
      {error && fallbackIndex >= FALLBACK_IMAGES.length && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>Image unavailable</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
    fontSize: 12,
  }
});

export default ReliableImage;
