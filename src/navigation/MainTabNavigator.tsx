import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { Platform, Text, View } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import DealsScreen from '../screens/DealsScreen';
import TradeNavigator from './TradeNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom tab icons since the vector-icons are having issues
const TabIcon = ({ name, focused, color }: { name: string; focused: boolean; color: string }) => {
  // Use simple text-based icons as a fallback
  const getIconText = () => {
    switch (name) {
      case 'home':
        return '🏠';
      case 'trade':
        return '🔄';
      case 'profile':
        return '👤';
      case 'bell':
        return '🔔';
      case 'tag':
        return '🏷️';
      default:
        return '•';
    }
  };

  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      opacity: focused ? 1 : 0.7,
    }}>
      <Text style={{ 
        fontSize: 22,
      }}>
        {getIconText()}
      </Text>
    </View>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: '#7950f2',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          paddingTop: 5,
          height: 60,
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 }
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : 5
        },
        headerShown: false
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" focused={focused} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Trade" 
        component={TradeNavigator}
        options={{
          tabBarLabel: 'Trade',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="trade" focused={focused} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="profile" focused={focused} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bell" focused={focused} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Deals" 
        component={DealsScreen} 
        options={{
          tabBarLabel: 'Deals',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="tag" focused={focused} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
