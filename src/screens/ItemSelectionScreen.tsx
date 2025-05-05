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
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TradeStackParamList } from '../navigation/types';

type ItemSelectionScreenNavigationProp = NativeStackNavigationProp<TradeStackParamList, 'ItemSelection'>;

// Mock item data
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
  },
  {
    id: '3',
    name: 'Smart Watch',
    description: 'Slightly used smart watch, all features working',
    condition: 'Very Good',
    category: 'Electronics',
    imageUrl: 'https://via.placeholder.com/150'
  }
];

const ItemSelectionScreen = () => {
  const navigation = useNavigation<ItemSelectionScreenNavigationProp>();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // Simulate fetching items
  useEffect(() => {
    fetchItems();
  }, []);
  
  const fetchItems = () => {
    setIsLoading(true);
    // Simulate API call with delay
    setTimeout(() => {
      setItems(mockItems);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleItemSelect = (id: string) => {
    setSelectedItem(id);
  };
  
  const handleContinue = () => {
    if (selectedItem) {
      navigation.navigate('Swipe', { selectedItemId: selectedItem });
    }
  };
  
  const renderItemCard = ({ item }: { item: Item }) => (
    <TouchableOpacity 
      style={[
        styles.itemCard,
        selectedItem === item.id && styles.selectedItemCard
      ]}
      onPress={() => handleItemSelect(item.id)}
    >
      <View style={styles.itemImageContainer}>
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.itemImage} 
          resizeMode="cover"
        />
        {selectedItem === item.id && (
          <View style={styles.selectedOverlay}>
            <Text style={styles.selectedIcon}>✓</Text>
          </View>
        )}
      </View>
      
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
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select an Item to Trade</Text>
        <Text style={styles.headerSubtitle}>
          Choose one of your items to offer for trade
        </Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7950f2" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You don't have any items yet</Text>
          <TouchableOpacity style={styles.addItemButton}>
            <Text style={styles.addItemButtonText}>Add an Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItemCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
          />
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[
                styles.continueButton,
                !selectedItem && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={!selectedItem}
            >
              <Text style={styles.continueButtonText}>
                Continue to Trading
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  addItemButton: {
    backgroundColor: '#7950f2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addItemButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  list: {
    padding: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedItemCard: {
    borderWidth: 2,
    borderColor: '#7950f2',
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 200,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#7950f2',
    width: 30,
    height: 30,
    borderBottomLeftRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDetails: {
    padding: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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
  footer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  continueButton: {
    backgroundColor: '#7950f2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#d0bfff',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ItemSelectionScreen;
