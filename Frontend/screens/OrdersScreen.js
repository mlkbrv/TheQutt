import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG, getAuthHeaders } from '../config/api';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, refreshToken } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/orders/`,
        { headers: getAuthHeaders(token) }
      );
      console.log('📋 Sifarişlər alındı:', response.data);
      console.log('📊 Sifariş sayı:', response.data.length);
      if (response.data.length > 0) {
        console.log('🔍 İlk sifariş:', JSON.stringify(response.data[0], null, 2));
      }
      setOrders(response.data);
    } catch (error) {
      console.error('❌ Sifarişləri yükləmə xətası:', error);
      console.error('📊 Xəta cavabı:', error.response?.data);
      console.error('🔢 Xəta statusu:', error.response?.status);
      
      // Если токен истек, пытаемся обновить его
      if (error.response?.status === 401 && error.response?.data?.code === 'token_not_valid') {
        console.log('🔄 Token vaxtı keçib, yeniləmə cəhdi...');
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess) {
          console.log('✅ Token yeniləndi, sifariş sorğusu təkrarlanır...');
          // Повторяем запрос с новым токеном
          return fetchOrders();
        } else {
          console.log('❌ Token yenilənmədi, istifadəçi yenidən daxil olmalıdır');
          Alert.alert('Xəta', 'Sessiya vaxtı keçib. Yenidən daxil olun.');
        }
      } else {
        Alert.alert('Xəta', 'Sifarişlər yüklənə bilmədi');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#2196F3';
      case 'preparing':
        return '#9C27B0';
      case 'ready':
        return '#4CAF50';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Təsdiq gözləyir';
      case 'confirmed':
        return 'Təsdiqləndi';
      case 'preparing':
        return 'Hazırlanır';
      case 'ready':
        return 'Götürməyə hazırdır';
      case 'delivered':
        return 'Çatdırıldı';
      case 'cancelled':
        return 'Ləğv edildi';
      default:
        return status;
    }
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.order_id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Sifariş #{item.order_id}</Text>
        <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
      
      <View style={styles.orderInfo}>
        <Text style={styles.shopName}>🏪 {item.shop_names ? item.shop_names.join(', ') : 'Mağaza'}</Text>
        <Text style={styles.orderDate}>📅 {new Date(item.created_at).toLocaleDateString('az-AZ')}</Text>
        <Text style={styles.orderTime}>🕐 {new Date(item.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>💰 Ümumi: {item.total_sum} ₼</Text>
        <Text style={styles.itemsCount}>📦 {item.items ? item.items.length : 0} məhsul</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Sifarişlər yüklənir...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Mənim Sifarişlərim</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Hələ heç bir sifarişiniz yoxdur</Text>
          <Text style={styles.emptyText}>
            Mağazalarımızdan ilk sifarişinizi verin!
          </Text>
                      <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('ShopsTab')}
            >
            <Text style={styles.shopButtonText}>Mağazalara Get</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.order_id.toString()}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  shopButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ordersList: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderInfo: {
    marginBottom: 16,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemsCount: {
    fontSize: 14,
    color: '#666',
  },
});

export default OrdersScreen;
