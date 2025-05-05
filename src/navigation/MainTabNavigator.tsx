import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';

// Import screens (to be implemented)
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import DealsScreen from '../screens/DealsScreen';
import TradeNavigator from './TradeNavigator';

// We'll use simple text for now, but will replace with icons later
const Tab = createBottomTabNavigator<MainTabParamList>();

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
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          paddingBottom: 5
        },
        headerShown: false
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home'
        }}
      />
      <Tab.Screen 
        name="Trade" 
        component={TradeNavigator}
        options={{
          tabBarLabel: 'Trade',
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile'
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts'
        }}
      />
      <Tab.Screen 
        name="Deals" 
        component={DealsScreen}
        options={{
          tabBarLabel: 'Deals'
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
