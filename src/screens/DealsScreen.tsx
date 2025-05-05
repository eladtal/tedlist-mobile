import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  StatusBar,
  Image
} from 'react-native';

// Mock deal data
interface Deal {
  id: string;
  type: 'incoming' | 'outgoing' | 'completed';
  itemName: string;
  otherItemName: string;
  otherPersonName: string;
  timestamp: string;
  imageUrl: string;
  otherImageUrl: string;
}

const mockDeals: Deal[] = [
  {
    id: '1',
    type: 'completed',
    itemName: 'Vintage Camera',
    otherItemName: 'Acoustic Guitar',
    otherPersonName: 'Sarah',
    timestamp: '2 days ago',
    imageUrl: 'https://via.placeholder.com/150',
    otherImageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: '2',
    type: 'incoming',
    itemName: 'Mountain Bike',
    otherItemName: 'Drone',
    otherPersonName: 'John',
    timestamp: 'Just now',
    imageUrl: 'https://via.placeholder.com/150',
    otherImageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: '3',
    type: 'outgoing',
    itemName: 'Smart Watch',
    otherItemName: 'Bluetooth Headphones',
    otherPersonName: 'Mike',
    timestamp: '5 hours ago',
    imageUrl: 'https://via.placeholder.com/150',
    otherImageUrl: 'https://via.placeholder.com/150'
  }
];

const DealsScreen = () => {
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'outgoing' | 'completed'>('all');
  
  const filteredDeals = activeTab === 'all' 
    ? deals 
    : deals.filter(deal => deal.type === activeTab);
  
  const renderDealItem = ({ item }: { item: Deal }) => (
    <TouchableOpacity style={styles.dealItem}>
      <View style={styles.dealItemContent}>
        <View style={styles.dealImages}>
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.dealImage} 
          />
          <View style={styles.exchangeIconContainer}>
            <Text style={styles.exchangeIcon}>⇄</Text>
          </View>
          <Image 
            source={{ uri: item.otherImageUrl }} 
            style={styles.dealImage} 
          />
        </View>
        
        <View style={styles.dealInfo}>
          <View style={[styles.dealStatusBadge, getDealStatusStyle(item.type)]}>
            <Text style={styles.dealStatusText}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          
          <Text style={styles.dealTitle}>
            {getTransactionText(item)}
          </Text>
          
          <Text style={styles.dealTimestamp}>{item.timestamp}</Text>
        </View>
      </View>
      
      {item.type === 'incoming' && (
        <View style={styles.dealActions}>
          <TouchableOpacity style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
  
  const getTransactionText = (deal: Deal) => {
    switch(deal.type) {
      case 'incoming':
        return `${deal.otherPersonName} wants to trade their ${deal.otherItemName} for your ${deal.itemName}`;
      case 'outgoing':
        return `You offered your ${deal.itemName} for ${deal.otherPersonName}'s ${deal.otherItemName}`;
      case 'completed':
        return `You traded your ${deal.itemName} for ${deal.otherPersonName}'s ${deal.otherItemName}`;
      default:
        return '';
    }
  };
  
  const getDealStatusStyle = (type: string) => {
    switch(type) {
      case 'incoming':
        return styles.incomingStatus;
      case 'outgoing':
        return styles.outgoingStatus;
      case 'completed':
        return styles.completedStatus;
      default:
        return {};
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deals</Text>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
            Incoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'outgoing' && styles.activeTab]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text style={[styles.tabText, activeTab === 'outgoing' && styles.activeTabText]}>
            Outgoing
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      
      {filteredDeals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No deals available</Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'all' 
              ? 'Start trading to see your deals here'
              : `You don't have any ${activeTab} deals`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDeals}
          renderItem={renderDealItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#7950f2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  list: {
    padding: 15,
  },
  dealItem: {
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
  dealItemContent: {
    padding: 15,
  },
  dealImages: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'center',
  },
  dealImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  exchangeIconContainer: {
    marginHorizontal: 10,
  },
  exchangeIcon: {
    fontSize: 24,
    color: '#7950f2',
  },
  dealInfo: {
    marginBottom: 10,
  },
  dealStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  incomingStatus: {
    backgroundColor: '#e3fafc',
  },
  outgoingStatus: {
    backgroundColor: '#fff9db',
  },
  completedStatus: {
    backgroundColor: '#ebfbee',
  },
  dealStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  dealTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  dealTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  dealActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#69db7c',
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 5,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#ff8787',
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 5,
  },
  declineButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default DealsScreen;
