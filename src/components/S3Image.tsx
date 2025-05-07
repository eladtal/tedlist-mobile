import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface S3ImageProps {
  imageUrl: string | null | undefined;
  style?: any;
}

/**
 * Ultra-simplified image component with a static fallback
 */
const S3Image = ({ imageUrl, style }: S3ImageProps) => {
  // Choose a default placeholder image that's stable and fast to load
  const defaultImageUrl = 'https://via.placeholder.com/300/607D8B/FFFFFF?text=Item';

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: defaultImageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default S3Image;
