import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AuthNavigator from './navigation/AuthNavigator';
import MainTabNavigator from './navigation/MainTabNavigator';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <StatusBar style="auto" />
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
} 