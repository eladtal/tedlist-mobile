import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../navigation/types';
import { itemService } from '../api';
import { Item } from '../api/itemService';

type ItemDetailScreenRouteProp = RouteProp<MainTabParamList, 'ItemDetail'>;
type ItemDetailScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'ItemDetail'>;

const { width } = Dimensions.get('window');

const ItemDetailScreen = () => {
  const navigation = useNavigation<ItemDetailScreenNavigationProp>();
  const route = useRoute<ItemDetailScreenRouteProp>();
  const { item } = route.params || {};
  
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Handle item deletion
  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await itemService.deleteItem(item.id);
              Alert.alert('Success', 'Item has been deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert(
                'Error',
                'Failed to delete item. Please try again later.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Item not found</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.images[0] || 'https://via.placeholder.com/400' }}
            style={styles.image}
            resizeMode="cover"
          />
          
          {/* Image count indicator if multiple images */}
          {item.images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>{item.images.length} photos</Text>
            </View>
          )}
        </View>

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{item.title || item.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>{item.condition}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>{item.category || item.type}</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Owner</Text>
            <Text style={styles.ownerName}>{item.owner?.name || 'You'}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
              <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#e53935" />
          ) : (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Item</Text>
            </TouchableOpacity>
          )}
        
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to format status text
const formatStatus = (status: string): string => {
  switch (status) {
    case 'available':
      return 'Available';
    case 'traded':
      return 'Traded';
    case 'pending':
      return 'Trade Pending';
    case 'removed':
    case 'deleted':
      return 'No Longer Available';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

// Helper function to get status style
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'available':
      return styles.statusAvailable;
    case 'traded':
      return styles.statusTraded;
    case 'pending':
      return styles.statusPending;
    case 'removed':
    case 'deleted':
      return styles.statusRemoved;
    default:
      return styles.statusAvailable;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  metaBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  ownerName: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusAvailable: {
    backgroundColor: '#e3f2fd',
  },
  statusTraded: {
    backgroundColor: '#e8f5e9',
  },
  statusPending: {
    backgroundColor: '#fff8e1',
  },
  statusRemoved: {
    backgroundColor: '#ffebee',
  },
  actionsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#e53935',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#7950f2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ItemDetailScreen;
