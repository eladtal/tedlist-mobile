import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TradeStackParamList } from './types';

// Import screens (to be implemented)
import ItemSelectionScreen from '../screens/ItemSelectionScreen';
import SwipeScreen from '../screens/SwipeScreen';

const Stack = createNativeStackNavigator<TradeStackParamList>();

const TradeNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ItemSelection"
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      <Stack.Screen 
        name="ItemSelection" 
        component={ItemSelectionScreen} 
        options={{ title: 'Select an Item' }}
      />
      <Stack.Screen 
        name="Swipe" 
        component={SwipeScreen} 
        options={{ title: 'Find Trades' }}
      />
    </Stack.Navigator>
  );
};

export default TradeNavigator;
