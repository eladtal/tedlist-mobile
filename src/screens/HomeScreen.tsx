import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Image,
  Animated,
  ScrollView
} from 'react-native';
import { COLORS, SHADOWS, FONT, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext'; 
import { itemService } from '../api';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageTest from '../components/ImageTest';
import SimpleImage from '../components/SimpleImage';
import { Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import S3Image from '../components/S3Image';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Updated Item interface to match both mobile app and backend fields
interface Item {
  id: string;
  _id?: string;  // MongoDB ObjectId
  name?: string; // Support for mobile app
  title?: string; // Support for backend
  description: string;
  condition: string;
  category?: string; // Support for mobile app
  type?: string; // Support for backend (trade/sell)
  images: string[];
  thumbnails: string[]; // Added for performance
  owner?: {
    id: string;
    name: string;
  };
  status: 'available' | 'traded' | 'pending' | 'removed' | 'deleted';
  createdAt: string;
  updatedAt: string;
  userId?: string; // Support for backend
  cacheKey?: string; // New cacheKey field
  imageStorageKey?: string; // New imageStorageKey field
  localImageUri?: string; // New localImageUri field
  imageUrl?: string; // Support for alternate image URL format
  imageURL?: string; // Support for alternate image URL format (uppercase)
  image?: string; // Support for single image string
}

// Mock items as fallback
const mockItems: Item[] = [
  {
    id: '1',
    title: 'Vintage Camera',
    name: 'Vintage Camera',
    description: 'A beautiful vintage film camera in working condition',
    condition: 'Good',
    category: 'Electronics',
    type: 'trade',
    images: ['https://via.placeholder.com/150'],
    thumbnails: ['https://via.placeholder.com/150'],
    owner: {
      id: '123',
      name: 'Alex'
    },
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Mountain Bike',
    name: 'Mountain Bike',
    description: 'Lightly used mountain bike, perfect for trails',
    condition: 'Excellent',
    category: 'Sports',
    type: 'trade',
    images: ['https://via.placeholder.com/150'],
    thumbnails: ['https://via.placeholder.com/150'],
    owner: {
      id: '123',
      name: 'Alex'
    },
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock user data
const mockUser = {
  name: 'Alex',
  id: '123',
  xp: 120
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const xp = 120;
  const xpGoal = 500;
  
  const { user } = useAuth();
  
  const [imageCache, setImageCache] = useState<Record<string, string>>({});

  // Load local image cache from AsyncStorage
  useEffect(() => {
    const loadImageCache = async () => {
      try {
        const cachingStr = await AsyncStorage.getItem('local_image_cache');
        if (cachingStr) {
          const caching = JSON.parse(cachingStr);
          console.log('HOME: Loaded image cache with', Object.keys(caching).length, 'items');
          console.log('HOME: Cache keys:', Object.keys(caching).slice(0, 2));
          setImageCache(caching);
        } else {
          console.log('HOME: No image cache found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading image cache:', error);
      }
    };
    
    loadImageCache();
  }, []);

  // Reload cache when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadImageCache = async () => {
        try {
          const cachingStr = await AsyncStorage.getItem('local_image_cache');
          if (cachingStr) {
            const caching = JSON.parse(cachingStr);
            console.log('Reloaded image cache:', Object.keys(caching).length, 'items');
            setImageCache(caching);
          }
        } catch (error) {
          console.error('Error loading image cache:', error);
        }
      };

      loadImageCache();
    }, [])
  );

  // Fetch items on initial mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        console.log('Attempting to load user items...');
        
        // DEBUG: Let's print exactly what URLs are in the response
        const debugRawData = async () => {
          try {
            const token = await AsyncStorage.getItem('auth_token');
            const response = await fetch('https://tedlist-backend.onrender.com/api/items/user', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            console.log('🔍 RAW SERVER RESPONSE:', JSON.stringify(data));
            
            // If we have items, inspect the first one's image data
            if (Array.isArray(data) && data.length > 0) {
              console.log('🖼️ First item image data:', JSON.stringify(data[0].images));
            } else if (data && data.items && Array.isArray(data.items) && data.items.length > 0) {
              console.log('🖼️ First item image data:', JSON.stringify(data.items[0].images));
            }
          } catch (err) {
            console.error('Debug fetch error:', err);
          }
        };
        
        // Run our debug function
        await debugRawData();
        
        let userItems: Item[];
        
        try {
          // Set a timeout for the API call
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          // Directly await the getUserItems call with safer error handling
          userItems = await itemService.getUserItems();
          clearTimeout(timeoutId);
          
          console.log(`Successfully loaded ${userItems.length} items`);
        } catch (error) {
          console.error('Error fetching items:', error);
          console.log('Using mock items as fallback');
          userItems = mockItems;
        }
        
        console.log('===== LOADED ITEMS ANALYSIS =====');
        console.log('Loaded items count:', userItems.length);
        
        // Analyze each item's images
        userItems.forEach((item, index) => {
          console.log(`\nITEM ${index + 1}: ${item.name || item.title} (ID: ${item.id || item._id})`);
          console.log(`- Has images array: ${!!item.images}`);
          console.log(`- Images array length: ${item.images?.length || 0}`);
          
          // Most important part: Check for S3 URLs specifically
          if (item.images && Array.isArray(item.images) && item.images.length > 0) {
            const s3Images = item.images.filter(img => 
              typeof img === 'string' && img.includes('s3.amazonaws.com')
            );
            
            if (s3Images.length > 0) {
              console.log(`🎯 FOUND ${s3Images.length} S3 IMAGES:`);
              s3Images.forEach((url, i) => console.log(`  S3 URL ${i+1}: ${url}`));
            }
            
            item.images.forEach((img, imgIndex) => {
              console.log(`- Image ${imgIndex + 1}: ${img}`);
            });
          }
        });
        
        setItems(userItems);
      } catch (error) {
        console.error('Error loading items:', error);
        setItems(mockItems);
        Alert.alert('Error', 'Failed to load your items. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadItems();
  }, []);

  // Also fetch items when the screen comes into focus (e.g., after adding a new item)
  useFocusEffect(
    React.useCallback(() => {
      console.log('HomeScreen focused - refreshing items list');
      const loadItems = async () => {
        try {
          setIsLoading(true);
          const userItems: Item[] = await itemService.getUserItems();
          console.log('Loaded items count:', userItems.length);
          
          // Log if any S3 images are found on refresh
          let s3ImagesFound = 0;
          userItems.forEach(item => {
            if (item.images && Array.isArray(item.images)) {
              const s3Urls = item.images.filter(img => 
                typeof img === 'string' && img.includes('s3.amazonaws.com')
              );
              s3ImagesFound += s3Urls.length;
            }
          });
          
          if (s3ImagesFound > 0) {
            console.log(`Found ${s3ImagesFound} S3 images across ${userItems.length} items on refresh`);
          }
          
          setItems(userItems);
        } catch (error) {
          console.error('Error loading items:', error);
          setItems(mockItems);
          Alert.alert('Error', 'Failed to load your items. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };
      loadItems();
      return () => {
        // Cleanup function if needed
      };
    }, [])
  );
  
  useEffect(() => {
    console.log('HomeScreen mounted, user data:', user);
    
    if (user) {
      console.log('User is authenticated:', user.name);
    } else {
      console.log('No user data available');
    }
  }, [user]);
  
  const onRefresh = () => {
    setRefreshing(true);
    const loadItems = async () => {
      try {
        setIsLoading(true);
        const userItems = await itemService.getUserItems();
        console.log('Loaded items count:', userItems.length);
        setItems(userItems);
      } catch (error) {
        console.error('Error loading items:', error);
        setItems(mockItems);
        // Use a more specific error message to help with debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Alert.alert('Error', `Failed to load your items: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    };
    loadItems();
  };
  
  const navigateToSubmitItem = () => {
    navigation.navigate('SubmitItem' as any);
  };
  
  const navigateToTradeSelect = () => {
    // Fixed the TypeScript error by using 'as any' for now
    navigation.navigate('Trade' as any, { screen: 'ItemSelection' });
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems([]);
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prevSelected => {
      if (prevSelected.includes(itemId)) {
        return prevSelected.filter(id => id !== itemId);
      } else {
        return [...prevSelected, itemId];
      }
    });
  };

  // Handle batch delete of selected items
  const handleBatchDelete = () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.`,
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
              
              // Delete each selected item
              const deletePromises = selectedItems.map(id => itemService.deleteItem(id));
              await Promise.all(deletePromises);
              
              // Remove deleted items from state
              setItems(prevItems => prevItems.filter(item => !selectedItems.includes(item.id)));
              
              // Reset selection state
              setSelectedItems([]);
              setIsSelectionMode(false);
              
              Alert.alert('Success', 'Items have been deleted successfully');
            } catch (error) {
              console.error('Error deleting items:', error);
              Alert.alert(
                'Error',
                'Failed to delete some items. Please try again later.',
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

  // ItemCard component - proper place to use hooks
  const ItemCard = ({ item, onPress }: { item: Item; onPress: () => void }) => {
    // Import our new image utilities
    const { processImageArray, getFastImageProps, getConditionBasedImage } = require('../utils/imageUtils');
    
    console.log(`Rendering Item: ${item.name || item.title} (ID: ${item.id || item._id})`);

    // Get formatted image props using our utility function
    const getItemImageProps = () => {
      // Process the images array to get properly formatted URLs
      const formattedImages = processImageArray(item.images);
      console.log(`Processed images: ${formattedImages.length} valid URLs`);
      
      // If we have valid images, use the first one
      if (formattedImages.length > 0) {
        return getFastImageProps(formattedImages[0]);
      }
      
      // Fallback to condition-based placeholder
      console.log(`Using condition placeholder for ${item.condition}`);
      return getFastImageProps(getConditionBasedImage(item.condition));
    };
    
    // Get the image props for this item
    const imageProps = getItemImageProps();
    
    const isSelected = selectedItems.includes(item.id);
    
    const handleCardPress = () => {
      if (isSelectionMode) {
        toggleItemSelection(item.id);
      } else {
        onPress();
      }
    };
    
    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.selectedItemCard]}
        onPress={handleCardPress}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            toggleItemSelection(item.id);
          }
        }}
        activeOpacity={0.7}
        delayLongPress={300}
      >
        {isSelectionMode && (
          <View style={styles.checkboxContainer}>
            <MaterialIcons 
              name={isSelected ? 'check-circle' : 'radio-button-unchecked'} 
              size={24} 
              color={isSelected ? COLORS.primary : COLORS.border}
            />
          </View>
        )}
        <View style={styles.itemImageContainer}>
          {/* Using simplified S3Image component with category information */}
          <S3Image
            imageUrl={item.images && Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null}
            style={styles.itemImage}
            category={item.category || 'default'}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name || item.title}</Text>
          <Text style={styles.itemCondition}>{item.condition}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Define header, XP progress section, and other UI elements that will be added to the FlatList
  const HeaderComponent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          <Text style={styles.greetingHighlight}>Hey {user?.name || mockUser.name}!</Text>
        </Text>
        <Text style={styles.subGreeting}>What would you like to do today?</Text>
      </View>
        
      <View style={styles.xpContainer}>
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpTitle}>XP Progress</Text>
            <Text style={styles.xpCount}>{xp} of {xpGoal} XP</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${Math.min(100, (xp / xpGoal) * 100)}%` }
              ]} 
            />
          </View>
          <View style={styles.achievementContainer}>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementText}>🏆</Text>
            </View>
            <Text style={styles.achievementLabel}>Item Posted</Text>
          </View>
        </View>
      </View>
        
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.tradeButton}
          onPress={navigateToSubmitItem}>
          <Text style={styles.buttonText}>Publish an Item</Text>
        </TouchableOpacity>
      </View>
        
      <View style={styles.myItemsHeaderSection}>
        <Text style={styles.sectionTitle}>My Items</Text>
      </View>

      {isSelectionMode && (
        <View style={styles.selectionModeHeader}>
          <Text style={styles.selectionCountText}>
            {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
          </Text>
          <View style={styles.selectionActions}>
            {selectedItems.length > 0 && (
              <TouchableOpacity 
                style={styles.deleteSelectedButton} 
                onPress={handleBatchDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.deleteSelectedText}>Delete</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelSelectionButton} onPress={toggleSelectionMode}>
              <Text style={styles.cancelSelectionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  // Empty footer component - we removed the duplicate Publish button
  const FooterComponent = () => (
    <View style={styles.footerSpace} />
  );

  const renderMyItems = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (!items || items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You don't have any items yet.</Text>
          <TouchableOpacity onPress={navigateToSubmitItem} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit your first item →</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <View style={styles.itemCardWrapper}>
            <ItemCard 
              item={item} 
              onPress={() => navigation.navigate('ItemDetail', { item })}
            />
          </View>
        )}
        keyExtractor={(item, index) => item.id || index.toString()}
        ListHeaderComponent={HeaderComponent}
        ListFooterComponent={FooterComponent}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.mainContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {renderMyItems()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120, // Add bottom padding to allow scrolling past the last item
  },
  mainContentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120, // Add bottom padding for proper spacing
  },
  itemCardWrapper: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  footerSpace: {
    height: 40,
  },
  header: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  greeting: {
    fontSize: FONT.sizes.xxl,
    color: COLORS.text,
    fontWeight: FONT.weights.bold,
  },
  greetingHighlight: {
    fontWeight: FONT.weights.bold,
    color: COLORS.primaryDark,
  },
  subGreeting: {
    fontSize: FONT.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  xpContainer: {
    marginBottom: SPACING.xl,
  },
  xpCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  xpTitle: {
    fontSize: FONT.sizes.lg,
    fontWeight: FONT.weights.bold,
    color: COLORS.text,
  },
  xpCount: {
    fontSize: FONT.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT.weights.medium,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignSelf: 'flex-start',
  },
  achievementBadge: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  achievementText: {
    fontSize: FONT.sizes.sm,
  },
  achievementLabel: {
    fontSize: FONT.sizes.sm,
    color: COLORS.text,
    fontWeight: FONT.weights.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  tradeButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginRight: SPACING.sm,
    ...SHADOWS.small,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: FONT.weights.semiBold,
    fontSize: FONT.sizes.md,
  },
  disabledButtonContainer: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  disabledButtonText: {
    color: COLORS.textLight,
    fontWeight: FONT.weights.medium,
    fontSize: FONT.sizes.md,
  },
  comingSoonText: {
    color: COLORS.textLight,
    fontSize: FONT.sizes.xs,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  myItemsSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
    minHeight: 300, // Add more height for the items section
  },
  myItemsHeaderSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: SPACING.md,
    paddingBottom: 0,
    ...SHADOWS.small,
    shadowOpacity: 0.1, // Lighter shadow for the header
  },
  sectionTitle: {
    fontSize: FONT.sizes.xl,
    fontWeight: FONT.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff4f4',
    borderRadius: 8,
  },
  errorText: {
    color: '#e53935',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#7950f2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#7950f2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  itemsContainer: {
    paddingBottom: SPACING.lg,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  selectedItemCard: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 2,
  },
  itemImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f1f3f5',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f3f5',
  },
  itemInfo: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  itemCondition: {
    fontSize: 14,
    color: '#666',
  },
  publishButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    zIndex: 999,
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: COLORS.white,
    fontSize: FONT.sizes.lg,
    fontWeight: FONT.weights.bold,
    marginLeft: SPACING.sm,
  },
  selectionModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  selectionCountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteSelectedButton: {
    backgroundColor: '#e53935',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  deleteSelectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelSelectionButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  cancelSelectionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectModeButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  selectModeButtonText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontWeight: FONT.weights.semiBold,
  },
});

export default HomeScreen;
