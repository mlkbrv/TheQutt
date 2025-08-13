import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import AuthNavigator from './navigation/AuthNavigator';
import MainTabNavigator from './navigation/MainTabNavigator';

// Отдельный компонент для навигации
const AppContent = () => {
  const { useAuth } = require('./contexts/AuthContext');
  const { isAuthenticated } = useAuth();
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
