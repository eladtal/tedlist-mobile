import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext'; // Assuming you have an auth hook

type HomeScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Home'>;

// Temporary mock data
interface Item {
  id: string;
  name: string;
  description: string;
  condition: string;
  category: string;
  imageUrl: string;
}

const mockItems: Item[] = [
  {
    id: '1',
    name: 'Vintage Camera',
    description: 'A beautiful vintage film camera in working condition',
    condition: 'Good',
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: '2',
    name: 'Mountain Bike',
    description: 'Lightly used mountain bike, perfect for trails',
    condition: 'Excellent',
    category: 'Sports',
    imageUrl: 'https://via.placeholder.com/150'
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
  
  // Simulated XP data
  const xp = 120;
  const xpGoal = 500;
  
  const { user } = useAuth();
  
  // Simulate fetching items
  useEffect(() => {
    fetchItems();
  }, []);
  
  useEffect(() => {
    console.log('HomeScreen mounted, user data:', user);
    
    // This will help us debug if the user data is correctly loaded
    if (user) {
      console.log('User is authenticated:', user.name);
    } else {
      console.log('No user data available');
    }
  }, [user]);
  
  const fetchItems = () => {
    setIsLoading(true);
    // Simulate API call with delay
    setTimeout(() => {
      setItems(mockItems);
      setIsLoading(false);
      setError(null);
    }, 1000);
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      fetchItems();
      setRefreshing(false);
    }, 1500);
  };
  
  const navigateToSubmitItem = () => {
    navigation.navigate('SubmitItem' as any);
  };
  
  const navigateToTradeSelect = () => {
    navigation.navigate('Trade', { screen: 'ItemSelection' });
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
    
    if (items.length === 0) {
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
      <View style={styles.itemsContainer}>
        {items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.itemImage} 
              resizeMode="cover"
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemCondition}>{item.condition}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            <Text style={styles.greetingHighlight}>Hey {mockUser.name}!</Text>
          </Text>
          <Text style={styles.subGreeting}>What would you like to do today?</Text>
        </View>
        
        {/* XP Progress */}
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
                <Text style={styles.achievementText}>Top Trader of the Week</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.tradeButton}
            onPress={navigateToTradeSelect}
          >
            <Text style={styles.buttonText}>Trade an Item</Text>
          </TouchableOpacity>
          
          {/* Buy button (Coming Soon) */}
          <View style={styles.disabledButtonContainer}>
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Buy Something</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
          
          {/* Sell button (Coming Soon) */}
          <View style={styles.disabledButtonContainer}>
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Sell an Item</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        </View>
        
        {/* My Items Section */}
        <View style={styles.myItemsSection}>
          <Text style={styles.sectionTitle}>My Items</Text>
          {renderMyItems()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  greetingHighlight: {
    color: '#7950f2',
  },
  subGreeting: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  xpContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    alignItems: 'center',
  },
  xpCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  xpCount: {
    fontSize: 14,
    color: '#777',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#69db7c',
    borderRadius: 5,
  },
  achievementContainer: {
    marginTop: 12,
    flexDirection: 'row',
  },
  achievementBadge: {
    backgroundColor: '#d3f9d8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  achievementText: {
    color: '#2b8a3e',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  tradeButton: {
    backgroundColor: '#d3f9d8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#2b8a3e',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#eee',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  comingSoonText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  myItemsSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#d32f2f',
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  emptyText: {
    color: '#666',
    marginBottom: 10,
  },
  submitButton: {
    paddingVertical: 8,
  },
  submitButtonText: {
    color: '#69db7c',
    fontWeight: '600',
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemDetails: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
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
    backgroundColor: '#e6f3ff',
    color: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  itemCategory: {
    fontSize: 12,
    backgroundColor: '#fff2e6',
    color: '#ff8c00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default HomeScreen;
