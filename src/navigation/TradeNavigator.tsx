import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TradeStackParamList } from './types';

// Import screens for trade flow
import ItemSelectionScreen from '../screens/ItemSelectionScreen';
import TradeRequestScreen from '../screens/TradeRequestScreen';

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
        name="TradeRequest" 
        component={TradeRequestScreen} 
        options={{ title: 'Trade Request' }}
      />
    </Stack.Navigator>
  );
};

export default TradeNavigator;
