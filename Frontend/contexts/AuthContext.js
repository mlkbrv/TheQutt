import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { getTimeUntilExpiry, shouldRefreshToken, getTokenInfo } from '../utils/jwtUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef(null);
  const lastRefreshTimeRef = useRef(0);

  useEffect(() => {
    loadStoredToken();
    return () => {
      // Очищаем таймер при размонтировании
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const loadStoredToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      console.log('🔍 Loaded stored token:', storedToken ? 'exists' : 'not found');
      if (storedToken) {
        setToken(storedToken);
        console.log('✅ Token set in state:', storedToken.substring(0, 20) + '...');
        
        // Показываем информацию о токене для отладки
        const tokenInfo = getTokenInfo(storedToken);
        if (tokenInfo) {
          console.log('📊 Token info:', tokenInfo);
        }
        
        // Загружаем информацию о пользователе
        await loadUserInfo(storedToken);
        
        // Проверяем, нужно ли обновить токен
        if (shouldRefreshToken(storedToken)) {
          console.log('⚠️ Token needs immediate refresh');
          await refreshToken();
        } else {
          // Планируем обновление токена
          scheduleTokenRefresh(storedToken);
        }
      }
    } catch (error) {
      console.error('❌ Error loading stored token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserInfo = async (token) => {
    try {
      // Здесь можно добавить API вызов для получения информации о пользователе
      // Пока просто устанавливаем базовую информацию
      setUser({ token });
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const scheduleTokenRefresh = (currentToken) => {
    try {
      const timeUntilExpiry = getTimeUntilExpiry(currentToken);
      
      // Обновляем токен за 5 минут до истечения
      const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60000); // минимум 1 минута
      
      console.log(`⏰ Token expires in ${Math.round(timeUntilExpiry / 1000)}s, will refresh in ${Math.round(refreshTime / 1000)}s`);
      
      // Очищаем предыдущий таймер
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Устанавливаем новый таймер
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Scheduled token refresh triggered');
        refreshToken();
      }, refreshTime);
      
    } catch (error) {
      console.error('❌ Error scheduling token refresh:', error);
    }
  };

  const login = async (accessToken, refreshToken) => {
    try {
      console.log('🔐 Login called with token:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
      await AsyncStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      setToken(accessToken);
      console.log('✅ Token stored and set in state');
      
      // Показываем информацию о токене для отладки
      const tokenInfo = getTokenInfo(accessToken);
      if (tokenInfo) {
        console.log('📊 New token info:', tokenInfo);
      }
      
      // Загружаем информацию о пользователе
      await loadUserInfo(accessToken);
      // Планируем обновление токена
      scheduleTokenRefresh(accessToken);
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    // Предотвращаем множественные одновременные обновления
    if (isRefreshing) {
      console.log('⚠️ Token refresh already in progress, skipping...');
      return false;
    }

    // Проверяем, не обновляли ли мы токен недавно
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 30000) { // 30 секунд
      console.log('⚠️ Token was refreshed recently, skipping...');
      return false;
    }

    try {
      setIsRefreshing(true);
      lastRefreshTimeRef.current = now;
      
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      console.log('🔄 Refreshing token...');
      const response = await axios.post(API_CONFIG.REFRESH_TOKEN_URL, {
        refresh: storedRefreshToken
      });

      if (response.data.access) {
        const newAccessToken = response.data.access;
        await AsyncStorage.setItem('accessToken', newAccessToken);
        setToken(newAccessToken);
        console.log('✅ Token refreshed successfully');
        
        // Показываем информацию о новом токене для отладки
        const tokenInfo = getTokenInfo(newAccessToken);
        if (tokenInfo) {
          console.log('📊 Refreshed token info:', tokenInfo);
        }
        
        // Планируем следующее обновление
        scheduleTokenRefresh(newAccessToken);
        
        return true;
      }
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      // Если не удалось обновить токен, выходим из системы
      await logout();
    } finally {
      setIsRefreshing(false);
    }
    return false;
  };

  const logout = async () => {
    try {
      // Очищаем таймер обновления
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  const value = {
    token,
    user,
    isLoading,
    isAuthenticated: !!token,
    isRefreshing,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
