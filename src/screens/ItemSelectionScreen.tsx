import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TradeStackParamList } from '../navigation/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext'; 

type ItemSelectionScreenNavigationProp = NativeStackNavigationProp<TradeStackParamList, 'ItemSelection'>;

import S3Image from '../components/S3Image';
import itemService, { Item } from '../api/itemService';

// Extended Item interface to match backend fields we're seeing
interface BackendItem extends Partial<Item> {
  _id?: string;
  title?: string;
  userId?: string;
  type?: string; // Item type (trade/sell)
  user?: {
    name: string;
    _id: string;
  };
  teddyBonus?: number;
}

// Response formats we might get from the API
interface ApiResponse {
  data?: BackendItem[] | { items?: BackendItem[] };
  items?: BackendItem[];
  [key: string]: any;
}

// Fallback items in case API fails
const fallbackItems: Item[] = [
  {
    id: '101',
    name: 'Vintage Film Camera',
    description: 'Classic film camera from the 1970s. Perfect for photography enthusiasts. Works great and produces beautiful analog photos.',
    condition: 'Good',
    category: 'Electronics',
    images: ['https://placehold.co/400x300/2a9d8f/FFFFFF.png?text=Vintage+Camera'],
    thumbnails: ['https://placehold.co/400x300/2a9d8f/FFFFFF.png?text=Vintage+Camera'],
    owner: {
      id: '456',
      name: 'Emily'
    },
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '102',
    name: 'Indoor Plant Set',
    description: 'Collection of 3 small indoor plants. Easy to care for and perfect for adding greenery to any room. Includes succulents and snake plant.',
    condition: 'Excellent',
    category: 'Home & Garden',
    images: ['https://placehold.co/400x300/2a9d8f/FFFFFF.png?text=Indoor+Plants'],
    thumbnails: ['https://placehold.co/400x300/2a9d8f/FFFFFF.png?text=Indoor+Plants'],
    owner: {
      id: '789',
      name: 'Sophia'
    },
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const ItemSelectionScreen = () => {
  const navigation = useNavigation<ItemSelectionScreenNavigationProp>();
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, []);
  
  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching items from other users for trading...');
      
      // Get all items from the API
      let response = await itemService.getAllItems() as unknown as ApiResponse;
      console.log('API response received - type:', typeof response);
      
      // Extract items based on response structure
      let backendItems: BackendItem[] = [];
      
      // Handle different response formats from the API
      if (Array.isArray(response)) {
        // Direct array response
        backendItems = response as BackendItem[];
      } else if (response && typeof response === 'object') {
        // Check if items are nested in a data or items property (common API pattern)
        if (response.data && Array.isArray(response.data)) {
          backendItems = response.data;
        } else if (response.items && Array.isArray(response.items)) {
          backendItems = response.items;
        } else if (response.data && typeof response.data === 'object' && 
                  response.data.items && Array.isArray(response.data.items)) {
          backendItems = response.data.items;
        }
      }
      
      console.log(`Extracted ${backendItems.length} total items from response`);
      
      // If still no items found, try one more approach - maybe items are direct properties
      if (backendItems.length === 0 && response && typeof response === 'object') {
        // Try to identify if the response itself might be an object with item properties
        const possibleItems = Object.values(response).filter(val => 
          val && typeof val === 'object' && (val.title || val.name) && val.status
        );
        
        if (possibleItems.length > 0) {
          backendItems = possibleItems as BackendItem[];
          console.log(`Found ${backendItems.length} items by scanning object properties`);
        }
      }
      
      // Convert backend items to our Item format
      const allItems: Item[] = backendItems.map(item => {
        return {
          id: item._id || item.id || '',
          name: item.title || item.name || 'Unnamed Item',
          description: item.description || '',
          condition: item.condition || 'Good',
          category: item.category || item.type || 'Other',
          images: item.images || [],
          thumbnails: item.images || [],
          owner: {
            id: item.user?._id || (item as any).userId || '',
            name: item.user?.name || 'Unknown Owner'
          },
          status: item.status || 'available',
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString()
        };
      });
      
      console.log(`Mapped ${allItems.length} items to app format`);
      
      // Remove any fallback items
      setItems([]);
      
      // Safety check - if we don't have items, use fallback
      if (allItems.length === 0) {
        console.log('No items could be extracted from API response, using fallback data');
        setItems(fallbackItems);
        return;
      }
      
      // Filter out the current user's items
      const currentUserId = user?.id;
      console.log('Current user ID:', currentUserId);
      
      const otherUsersItems = allItems.filter(item => {
        if (!item) return false; // Skip null/undefined items
        
        // Debug item owner info
        // Use type assertion to handle both MongoDB and regular item formats
        const itemId = item.id || (item as any)._id || 'unknown';
        console.log(`Item ${itemId} owner:`, 
          item.owner?.id || (item as any).userId || 'unknown');
        
        // Some items might use userId field (from backend) instead of owner.id
        const itemOwnerId = item.owner?.id || (item as any).userId || (item as any)._id || '';
        
        // Only include items from other users that are available
        return (
          itemOwnerId !== currentUserId &&
          item.status === 'available' // Only show available items
        );
      });
      
      console.log(`Found ${otherUsersItems.length} items from other users`);
      
      if (otherUsersItems.length > 0) {
        setItems(otherUsersItems);
      } else {
        console.log('No items from other users found, using fallback data');
        setItems(fallbackItems);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to load items. Please try again later.');
      setItems(fallbackItems);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };
  
  const viewItemDetails = (item: Item) => {
    // Navigate back to the parent stack's ItemDetail screen
    navigation.getParent()?.navigate('ItemDetail', { item });
  };
  
  // Render individual feed item
  const renderFeedItem = ({ item }: { item: Item }) => (
    <View style={styles.feedItem}>
      {/* Item owner info */}
      <View style={styles.itemOwnerRow}>
        <View style={styles.ownerAvatar}>
          <Text style={styles.ownerInitial}>{item.owner.name.charAt(0)}</Text>
        </View>
        <Text style={styles.ownerName}>{item.owner.name}</Text>
      </View>
      
      {/* Item image */}
      <TouchableOpacity onPress={() => viewItemDetails(item)}>
        <View style={styles.feedImageContainer}>
          <S3Image 
            imageUrl={item.images && item.images.length > 0 ? item.images[0] : null} 
            style={styles.feedImage} 
            category={item.category || 'default'}
          />
        </View>
      </TouchableOpacity>
      
      {/* Item details */}
      <View style={styles.feedItemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription} numberOfLines={3}>
          {item.description}
        </Text>
        
        <View style={styles.tagsContainer}>
          <View style={styles.tagBadge}>
            <MaterialCommunityIcons name="star-outline" size={14} color="#333" />
            <Text style={styles.tagText}>{item.condition}</Text>
          </View>
          <View style={styles.tagBadge}>
            <MaterialCommunityIcons name="tag-outline" size={14} color="#333" />
            <Text style={styles.tagText}>{item.category}</Text>
          </View>
        </View>
        
        {/* Action buttons */}
        <View style={styles.feedItemActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => viewItemDetails(item)}
          >
            <MaterialCommunityIcons name="information-outline" size={22} color="#2a9d8f" />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]} 
            onPress={() => navigation.navigate('TradeRequest', { item })}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={22} color="#fff" />
            <Text style={styles.primaryActionText}>Trade</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trade Feed</Text>
        <Text style={styles.headerSubtitle}>
          Browse items available for trading
        </Text>
      </View>
      
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#e76f51" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchItems}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2a9d8f" />
          <Text style={styles.loadingText}>Discovering available items...</Text>
        </View>
      ) : items.length > 0 ? (
        <FlatList
          data={items}
          renderItem={renderFeedItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={['#2a9d8f']} 
              tintColor="#2a9d8f"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="swap-horizontal" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No items available for trade</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchItems}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e76f51',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2a9d8f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  refreshButton: {
    backgroundColor: '#2a9d8f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Feed specific styles
  feedList: {
    padding: 12,
  },
  feedItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemOwnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ownerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2a9d8f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  ownerInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  feedImageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#f0f0f0',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedItemContent: {
    padding: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  feedItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    color: '#2a9d8f',
  },
  primaryAction: {
    backgroundColor: '#2a9d8f',
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  itemSeparator: {
    height: 15,
  },
  
  // Legacy styles (keeping for compatibility)
  itemImageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(42, 157, 143, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemCondition: {
    fontSize: 13,
    color: '#2a9d8f',
    backgroundColor: 'rgba(42, 157, 143, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  itemCategory: {
    fontSize: 13,
    color: '#666',
  },
});

export default ItemSelectionScreen;
