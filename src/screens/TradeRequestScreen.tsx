import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TradeStackParamList, RootStackParamList } from '../navigation/types';
import S3Image from '../components/S3Image';
import { Item } from '../api/itemService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define route types
type TradeRequestRouteProp = RouteProp<TradeStackParamList, 'TradeRequest'>;
type TradeRequestNavigationProp = NativeStackNavigationProp<
  TradeStackParamList & RootStackParamList,
  'TradeRequest'
>;

const TradeRequestScreen = () => {
  const route = useRoute<TradeRequestRouteProp>();
  const navigation = useNavigation<TradeRequestNavigationProp>();
  const { item } = route.params;
  
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userItems, setUserItems] = useState<Item[]>([]);
  
  // Sample user items for demonstration
  const mockUserItems = [
    {
      id: '201',
      name: 'Leather Messenger Bag',
      description: 'Handcrafted leather messenger bag, perfect for carrying laptops and documents. Adjustable strap and multiple compartments.',
      condition: 'Excellent',
      category: 'Accessories',
      images: ['https://placehold.co/400x300/2a9d8f/FFFFFF.png?text=Leather+Bag'],
      thumbnails: ['https://placehold.co/400x300/2a9d8f/FFFFFF.png?text=Leather+Bag'],
      owner: {
        id: '123',
        name: 'You'
      },
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '202',
      name: 'Acoustic Guitar',
      description: 'Beginner acoustic guitar with carrying case. Great sound quality, only a few small scratches.',
      condition: 'Good',
      category: 'Musical Instruments',
      images: ['https://placehold.co/400x300/2a9d8f/FFFFFF.png?text=Acoustic+Guitar'],
      thumbnails: ['https://placehold.co/400x300/2a9d8f/FFFFFF.png?text=Acoustic+Guitar'],
      owner: {
        id: '123',
        name: 'You'
      },
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] as Item[];
  
  // Simulate fetching user items for trade
  React.useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      setUserItems(mockUserItems);
    }, 500);
  }, []);
  
  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
  };
  
  const sendTradeRequest = () => {
    if (!selectedItem) {
      Alert.alert('Please select an item', 'You need to select one of your items to offer for trade.');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call to create trade request
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Trade Request Sent!',
        `Your trade request for ${item.name} has been sent. We'll notify you when the owner responds.`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.getParent()?.navigate('Home')
          }
        ]
      );
    }, 1500);
  };
  
  const renderUserItem = (userItem: Item) => {
    const isSelected = selectedItem?.id === userItem.id;
    
    return (
      <TouchableOpacity 
        key={userItem.id}
        style={[styles.userItemCard, isSelected && styles.selectedItemCard]}
        onPress={() => handleItemSelect(userItem)}
      >
        <View style={styles.userItemImageContainer}>
          <S3Image 
            imageUrl={userItem.images && userItem.images.length > 0 ? userItem.images[0] : null} 
            style={styles.userItemImage}
            category={userItem.category || 'default'}
          />
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <MaterialCommunityIcons name="check-circle" size={40} color="#fff" />
            </View>
          )}
        </View>
        
        <View style={styles.userItemDetails}>
          <Text style={styles.userItemName}>{userItem.name}</Text>
          <Text style={styles.userItemCondition}>{userItem.condition}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.targetItemSection}>
          <Text style={styles.sectionTitle}>Item You Want</Text>
          
          <View style={styles.targetItem}>
            <View style={styles.targetItemImageContainer}>
              <S3Image 
                imageUrl={item.images && item.images.length > 0 ? item.images[0] : null} 
                style={styles.targetItemImage}
                category={item.category || 'default'}
              />
            </View>
            
            <View style={styles.targetItemDetails}>
              <Text style={styles.targetItemName}>{item.name}</Text>
              <Text style={styles.targetItemDescription} numberOfLines={3}>{item.description}</Text>
              
              <View style={styles.ownerInfo}>
                <View style={styles.ownerAvatar}>
                  <Text style={styles.ownerInitial}>{item.owner.name.charAt(0)}</Text>
                </View>
                <Text style={styles.ownerName}>Owner: {item.owner.name}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.userItemsSection}>
          <Text style={styles.sectionTitle}>Choose Your Item to Trade</Text>
          <Text style={styles.sectionSubtitle}>Select one of your items to offer in exchange</Text>
          
          <View style={styles.userItemsGrid}>
            {userItems.map(userItem => renderUserItem(userItem))}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.tradeButton,
            !selectedItem && styles.disabledButton
          ]}
          onPress={sendTradeRequest}
          disabled={!selectedItem || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="swap-horizontal" size={22} color="#fff" />
              <Text style={styles.tradeButtonText}>Send Trade Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  targetItemSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  targetItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  targetItemImageContainer: {
    width: 120,
    height: 120,
  },
  targetItemImage: {
    width: '100%',
    height: '100%',
  },
  targetItemDetails: {
    flex: 1,
    padding: 12,
  },
  targetItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  targetItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2a9d8f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  ownerInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ownerName: {
    fontSize: 12,
    color: '#666',
  },
  userItemsSection: {
    backgroundColor: '#fff',
    padding: 16,
    flex: 1,
  },
  userItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  userItemCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedItemCard: {
    borderColor: '#2a9d8f',
    borderWidth: 2,
  },
  userItemImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  userItemImage: {
    width: '100%',
    height: '100%',
  },
  userItemDetails: {
    padding: 8,
  },
  userItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userItemCondition: {
    fontSize: 12,
    color: '#2a9d8f',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(42, 157, 143, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tradeButton: {
    backgroundColor: '#2a9d8f',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  tradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default TradeRequestScreen;
