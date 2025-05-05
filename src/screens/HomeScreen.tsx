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
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext'; 
import { itemService } from '../api';
import { API_BASE_URL } from '../api/config';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Home'>;

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
  
  const xp = 120;
  const xpGoal = 500;
  
  const { user } = useAuth();
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  useEffect(() => {
    console.log('HomeScreen mounted, user data:', user);
    
    if (user) {
      console.log('User is authenticated:', user.name);
    } else {
      console.log('No user data available');
    }
  }, [user]);
  
  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await itemService.getUserItems();
      console.log('Items fetched successfully:', data);
      setItems(data);
      
    } catch (err) {
      console.error('Error fetching items:', err);
      
      if (__DEV__) {
        console.log('Using mock data as fallback');
        setItems(mockItems);
        setError('Could not fetch items from server - using mock data');
      } else {
        setError('Could not fetch your items. Please try again later.');
        setItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchItems()
      .finally(() => {
        setRefreshing(false);
      });
  };
  
  const navigateToSubmitItem = () => {
    navigation.navigate('SubmitItem' as any);
  };
  
  const navigateToTradeSelect = () => {
    navigation.navigate('Trade', { screen: 'ItemSelection' });
  };

  // Render a single item (optimized for FlatList)
  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    // Use thumbnail for list view (much better performance)
    const imageUrl = item.thumbnails && item.thumbnails.length > 0 
      ? item.thumbnails[0] 
      : 'https://via.placeholder.com/150';

    return (
      <TouchableOpacity 
        key={item.id || index} 
        style={styles.itemCard}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.itemImage} 
          resizeMode="cover"
          onError={(e) => console.error(`Image load error: ${e.nativeEvent.error}`)}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.title || item.name}</Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={styles.itemCondition}>{item.condition}</Text>
            <Text style={styles.itemCategory}>{item.category || item.type}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderMyItems = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7950f2" />
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchItems} style={styles.retryButton}>
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
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || index.toString()}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        contentContainerStyle={styles.itemsContainer}
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.scrollContent}>
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
            onPress={navigateToTradeSelect}>
            <Text style={styles.buttonText}>Trade an Item</Text>
          </TouchableOpacity>
          
          <View style={styles.disabledButtonContainer}>
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Buy Something</Text>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
          
          <View style={styles.disabledButtonContainer}>
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Sell an Item</Text>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.myItemsSection}>
          <Text style={styles.sectionTitle}>My Items</Text>
          {renderMyItems()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 15,
  },
  header: {
    marginTop: 15,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    color: '#333',
  },
  greetingHighlight: {
    fontWeight: 'bold',
    color: '#7950f2',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  xpContainer: {
    marginBottom: 20,
  },
  xpCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  xpCount: {
    fontSize: 14,
    color: '#666',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#7950f2',
    borderRadius: 4,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f9f7fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  achievementText: {
    fontSize: 16,
  },
  achievementLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tradeButton: {
    flex: 1,
    backgroundColor: '#7950f2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButtonContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButtonText: {
    color: '#adb5bd',
    fontWeight: '600',
    fontSize: 14,
  },
  comingSoonText: {
    color: '#adb5bd',
    fontSize: 10,
    marginTop: 2,
  },
  myItemsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  itemImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f1f3f5',
  },
  itemDetails: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
  },
  itemCondition: {
    fontSize: 12,
    color: '#7950f2',
    backgroundColor: '#f3f0ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  itemCategory: {
    fontSize: 12,
    color: '#2b8a3e',
    backgroundColor: '#e6f7ef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default HomeScreen;
