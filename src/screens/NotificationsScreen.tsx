import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  StatusBar
} from 'react-native';

// Mock notification data
interface Notification {
  id: string;
  type: 'match' | 'trade' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'match',
    title: 'New Match Found!',
    message: 'Your Vintage Camera matched with Sarah\'s Acoustic Guitar',
    timestamp: '10 min ago',
    read: false
  },
  {
    id: '2',
    type: 'trade',
    title: 'Trade Completed',
    message: 'You successfully traded your Mountain Bike with John\'s Drone',
    timestamp: '3 hours ago',
    read: false
  },
  {
    id: '3',
    type: 'system',
    title: 'Welcome to Tedlist!',
    message: 'Start by adding items you would like to trade.',
    timestamp: '2 days ago',
    read: true
  },
  {
    id: '4',
    type: 'match',
    title: 'Potential Trade',
    message: 'Michael is interested in your Smartphone',
    timestamp: '3 days ago',
    read: true
  }
];

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        !item.read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={[styles.notificationTypeIndicator, getTypeStyle(item.type)]} />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{item.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'match':
        return styles.matchType;
      case 'trade':
        return styles.tradeType;
      default:
        return styles.systemType;
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>When you get notifications, they'll appear here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  markAllButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  markAllText: {
    color: '#7950f2',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 15,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#f0f7ff',
  },
  notificationTypeIndicator: {
    width: 5,
    height: '100%',
  },
  matchType: {
    backgroundColor: '#7950f2',
  },
  tradeType: {
    backgroundColor: '#69db7c',
  },
  systemType: {
    backgroundColor: '#74c0fc',
  },
  notificationContent: {
    flex: 1,
    padding: 15,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
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

export default NotificationsScreen;
