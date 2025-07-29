import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ShopNavigator from './ShopNavigator';
import MapScreen from '../screens/Map/MapScreen';
import CartScreen from '../screens/Cart/CartScreen';
import OrdersScreen from '../screens/Orders/OrdersScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let emoji;

          if (route.name === 'Home') {
            emoji = '🏠';
          } else if (route.name === 'Map') {
            emoji = '🗺️';
          } else if (route.name === 'Cart') {
            emoji = '🛒';
          } else if (route.name === 'Orders') {
            emoji = '📋';
          } else if (route.name === 'Profile') {
            emoji = '👤';
          }

          return <Text style={{ fontSize: size, color: color }}>{emoji}</Text>;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={ShopNavigator}
        options={{ title: 'Ana Səhifə' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Xəritə' }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'Səbət' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersScreen}
        options={{ title: 'Sifarişlər' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 