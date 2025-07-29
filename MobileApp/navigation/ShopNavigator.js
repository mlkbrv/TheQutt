import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home/HomeScreen';
import ShopProductsScreen from '../screens/Home/ShopProductsScreen';

const Stack = createStackNavigator();

const ShopNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ShopProducts" component={ShopProductsScreen} />
    </Stack.Navigator>
  );
};

export default ShopNavigator; 