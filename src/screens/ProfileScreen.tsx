import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image 
} from 'react-native';

// Mock user data
const mockUser = {
  name: 'Alex',
  email: 'alex@example.com',
  joined: 'March 2025',
  avatar: 'https://via.placeholder.com/150',
  stats: {
    trades: 12,
    listings: 8,
    xp: 120
  }
};

const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: mockUser.avatar }} 
              style={styles.avatar} 
            />
          </View>
          <Text style={styles.name}>{mockUser.name}</Text>
          <Text style={styles.email}>{mockUser.email}</Text>
          <Text style={styles.joinedDate}>Member since {mockUser.joined}</Text>
        </View>
        
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.trades}</Text>
            <Text style={styles.statLabel}>Trades</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.listings}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mockUser.stats.xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>
        
        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Privacy Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Notification Preferences</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option}>
            <Text style={styles.optionText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.option, styles.logoutOption]}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#7950f2',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  joinedDate: {
    fontSize: 14,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  optionsContainer: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  option: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  logoutOption: {
    marginTop: 20,
    backgroundColor: '#ffeded',
  },
  logoutText: {
    color: '#e53935',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;
