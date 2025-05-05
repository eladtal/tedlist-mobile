import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

// Import standalone screens (to be implemented)
import SubmitItemScreen from '../screens/SubmitItemScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  // Use the authentication context
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7950f2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth flow when not authenticated
          <Stack.Screen 
            name="Auth" 
            component={AuthNavigator}
          />
        ) : (
          // Main app flow when authenticated
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
            />
            <Stack.Group screenOptions={{ presentation: 'modal', headerShown: true }}>
              <Stack.Screen 
                name="SubmitItem" 
                component={SubmitItemScreen} 
                options={{ title: 'Add New Item' }}
              />
              <Stack.Screen 
                name="AdminPanel" 
                component={AdminPanelScreen} 
                options={{ title: 'Admin Panel' }}
              />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AppNavigator;
