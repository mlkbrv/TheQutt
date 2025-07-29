import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../api/api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
      if (token) {
        loadProfile();
      } else {
        setUser({ name: 'Qonaq İstifadəçi', email: 'guest@example.com' });
        setLoading(false);
      }
    } catch (error) {
      console.log('Error checking auth status:', error);
      setUser({ name: 'Qonaq İstifadəçi', email: 'guest@example.com' });
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.log('Error loading profile:', error);
      // Если ошибка 401 (Unauthorized), показываем дефолтные данные
      if (error.response?.status === 401) {
        setUser({ name: 'Qonaq İstifadəçi', email: 'guest@example.com' });
        setIsAuthenticated(false);
      } else if (error.code === 'ECONNABORTED' || !error.response) {
        setUser({ name: 'Qonaq İstifadəçi', email: 'guest@example.com' });
        setIsAuthenticated(false);
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıxış',
      'Çıxmaq istədiyinizə əminsiniz?',
      [
        { text: 'Ləğv et', style: 'cancel' },
        {
          text: 'Çıx',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser({ name: 'Qonaq İstifadəçi', email: 'guest@example.com' });
            Alert.alert('Uğurlu', 'Uğurla çıxdınız');
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    Alert.alert(
      'Giriş tələb olunur',
      'Tam funksiyalara daxil olmaq üçün giriş edin',
      [
        { text: 'Ləğv et', style: 'cancel' },
        { text: 'Giriş', onPress: () => {
          // Здесь можно добавить навигацию к экрану входа
          Alert.alert('Məlumat', 'Giriş ekranı tezliklə tətbiq ediləcək');
        }},
      ]
    );
  };

  const menuItems = [
    { title: 'Profil redaktə et', emoji: '✏️', onPress: () => Alert.alert('Profil redaktə et', 'Funksiya tezliklə gələcək') },
    { title: 'Parametrlər', emoji: '⚙️', onPress: () => Alert.alert('Parametrlər', 'Funksiya tezliklə gələcək') },
    { title: 'Kömək və Dəstək', emoji: '❓', onPress: () => Alert.alert('Kömək', 'Funksiya tezliklə gələcək') },
    { title: 'Haqqında', emoji: 'ℹ️', onPress: () => Alert.alert('Haqqında', 'TheQutt v1.0.0') },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>⏳</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImage}>
          <Text style={styles.profileEmoji}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
        <Text style={styles.email}>{user?.email || 'guest@example.com'}</Text>
        {!isAuthenticated && (
          <Text style={styles.guestText}>Guest Mode</Text>
        )}
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <Text style={styles.arrowEmoji}>➡️</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isAuthenticated ? (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutEmoji}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginEmoji}>🔑</Text>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 40,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileEmoji: {
    fontSize: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  guestText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  menuSection: {
    backgroundColor: 'white',
    marginTop: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  arrowEmoji: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 