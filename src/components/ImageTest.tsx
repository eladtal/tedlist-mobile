import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const TEST_IMAGES = [
  {
    name: 'Remote HTTPS Image',
    uri: 'https://i.imgur.com/DKSFyuw.jpg'
  },
  {
    name: 'Server Image',
    uri: 'https://tedlist-backend.onrender.com/uploads/images-1746376825577-932466702.png'
  },
  {
    name: 'Server Image (no /uploads)',
    uri: 'https://tedlist-backend.onrender.com/images-1746376825577-932466702.png'
  }
];

interface Props {
  serverUrls?: string[];
}

export const ImageTest: React.FC<Props> = ({ serverUrls = [] }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const allImages = [
    ...TEST_IMAGES,
    ...serverUrls.map((url, index) => ({
      name: `Your Image ${index + 1}`,
      uri: url
    }))
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Image Loading Test</Text>
      <TouchableOpacity 
        style={styles.detailsButton}
        onPress={() => setShowDetails(!showDetails)}>
        <Text style={styles.buttonText}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Text>
      </TouchableOpacity>
      
      {allImages.map((img, index) => (
        <View key={index} style={styles.imageContainer}>
          <Text style={styles.imageTitle}>{img.name}</Text>
          {showDetails && (
            <Text style={styles.imageUri}>{img.uri}</Text>
          )}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: img.uri }}
              style={styles.image}
              resizeMode="cover"
              onLoad={() => console.log(`Image ${index} loaded successfully`)}
              onError={(e) => console.error(`Image ${index} error:`, e.nativeEvent.error)}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  imageContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  imageUri: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'monospace'
  },
  imageWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsButton: {
    backgroundColor: '#7950f2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default ImageTest;
