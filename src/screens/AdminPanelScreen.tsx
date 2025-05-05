import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';

// Mock data for admin panel
interface ItemData {
  id: string;
  name: string;
  owner: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockItems: ItemData[] = [
  { id: '1', name: 'Vintage Camera', owner: 'User123', status: 'pending' },
  { id: '2', name: 'Mountain Bike', owner: 'User456', status: 'approved' },
  { id: '3', name: 'Smart Watch', owner: 'User789', status: 'pending' },
  { id: '4', name: 'Acoustic Guitar', owner: 'User234', status: 'rejected' },
  { id: '5', name: 'Drone', owner: 'User567', status: 'pending' },
];

interface UserData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'suspended';
}

const mockUsers: UserData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Sarah Smith', email: 'sarah@example.com', status: 'active' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', status: 'suspended' },
];

const AdminPanelScreen = () => {
  const [items, setItems] = useState<ItemData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'users'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate data fetching
  useEffect(() => {
    setTimeout(() => {
      setItems(mockItems);
      setUsers(mockUsers);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const handleApproveItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: 'approved' } : item
    ));
    Alert.alert('Success', 'Item has been approved');
  };
  
  const handleRejectItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: 'rejected' } : item
    ));
    Alert.alert('Success', 'Item has been rejected');
  };
  
  const handleToggleUserStatus = (id: string) => {
    setUsers(users.map(user => {
      if (user.id === id) {
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        return { ...user, status: newStatus };
      }
      return user;
    }));
    
    const user = users.find(u => u.id === id);
    const newStatus = user?.status === 'active' ? 'suspended' : 'active';
    Alert.alert('Success', `User has been ${newStatus}`);
  };
  
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const renderItemsTab = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7950f2" />
        </View>
      );
    }
    
    if (filteredItems.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items found</Text>
        </View>
      );
    }
    
    return (
      <View>
        {filteredItems.map(item => (
          <View key={item.id} style={styles.listItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemOwner}>Owner: {item.owner}</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            
            {item.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveItem(item.id)}
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectItem(item.id)}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };
  
  const renderUsersTab = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7950f2" />
        </View>
      );
    }
    
    if (filteredUsers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      );
    }
    
    return (
      <View>
        {filteredUsers.map(user => (
          <View key={user.id} style={styles.listItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{user.name}</Text>
              <Text style={styles.itemOwner}>{user.email}</Text>
              <View style={[
                styles.statusBadge, 
                user.status === 'active' ? styles.activeStatus : styles.suspendedStatus
              ]}>
                <Text style={styles.statusText}>{user.status}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.userActionButton,
                user.status === 'active' ? styles.suspendButton : styles.activateButton
              ]}
              onPress={() => handleToggleUserStatus(user.id)}
            >
              <Text style={styles.actionButtonText}>
                {user.status === 'active' ? 'Suspend' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };
  
  const getStatusBadgeStyle = (status: string) => {
    switch(status) {
      case 'approved':
        return styles.approvedStatus;
      case 'rejected':
        return styles.rejectedStatus;
      default:
        return styles.pendingStatus;
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search..."
          placeholderTextColor="#999"
        />
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'items' && styles.activeTab]}
          onPress={() => setActiveTab('items')}
        >
          <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
            Items
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'items' ? renderItemsTab() : renderUsersTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#7950f2',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#7950f2',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#7950f2',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    marginBottom: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemOwner: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pendingStatus: {
    backgroundColor: '#fff9db',
  },
  approvedStatus: {
    backgroundColor: '#d3f9d8',
  },
  rejectedStatus: {
    backgroundColor: '#ffe3e3',
  },
  activeStatus: {
    backgroundColor: '#d3f9d8',
  },
  suspendedStatus: {
    backgroundColor: '#ffe3e3',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#69db7c',
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
  },
  userActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderRadius: 4,
  },
  suspendButton: {
    backgroundColor: '#ff6b6b',
  },
  activateButton: {
    backgroundColor: '#69db7c',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AdminPanelScreen;
