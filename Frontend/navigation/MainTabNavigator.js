import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useUserRole } from '../hooks/useUserRole';

// Импортируем экраны
import ShopsScreen from '../screens/ShopsScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopProductsScreen from '../screens/ShopProductsScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ShopOwnerScreen from '../screens/ShopOwnerScreen';
import ShopOwnerOrdersScreen from '../screens/ShopOwnerOrdersScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Стек навигации для вкладки "Магазины"
const ShopsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ShopsMain" component={ShopsScreen} />
    <Stack.Screen name="ShopProducts" component={ShopProductsScreen} />
  </Stack.Navigator>
);

// Стек навигации для вкладки "Карта"
const MapStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MapMain" component={MapScreen} />
    <Stack.Screen name="ShopProducts" component={ShopProductsScreen} />
  </Stack.Navigator>
);

// Стек навигации для вкладки "Профиль"
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
  </Stack.Navigator>
);

// Стек навигации для владельцев магазинов
const ShopOwnerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ShopOwnerMain" component={ShopOwnerScreen} />
  </Stack.Navigator>
);

const MainTabNavigator = () => {
  const { isShopOwner, isLoading } = useUserRole();

  // Показываем загрузку, пока определяем роль
  if (isLoading) {
    return null; // Или можно показать спиннер
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Shops') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'MyShops') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'ShopOrders') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      {isShopOwner ? (
        // Для владельцев магазинов показываем специальные вкладки
        <>
          <Tab.Screen 
            name="MyShops" 
            component={ShopOwnerStack}
            options={{ title: 'Mənim Mağazalarım' }}
          />
          <Tab.Screen 
            name="ShopOrders" 
            component={ShopOwnerOrdersScreen}
            options={{ title: 'Mağaza Sifarişləri' }}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileStack}
            options={{ title: 'Profil' }}
          />
        </>
      ) : (
        // Для обычных пользователей показываем стандартные вкладки
        <>
          <Tab.Screen 
            name="Shops" 
            component={ShopsStack}
            options={{ title: 'Mağazalar' }}
          />
          <Tab.Screen 
            name="Map" 
            component={MapStack}
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
            component={ProfileStack}
            options={{ title: 'Profil' }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
