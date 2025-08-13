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
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { API_CONFIG, getAuthHeaders } from '../config/api';

const ShopOwnerOrdersScreen = ({ navigation }) => {
  const { token } = useAuth();
  const { myShops } = useUserRole();
  const [shopOrders, setShopOrders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  useEffect(() => {
    if (myShops.length > 0) {
      loadShopOrders();
    }
  }, [myShops]);

  const loadShopOrders = async () => {
    try {
      setIsLoading(true);
      const ordersData = {};

      // Загружаем заказы для каждого магазина
      for (const shop of myShops) {
        try {
          const response = await axios.get(
            `${API_CONFIG.BASE_URL}/orders/shop-orders/${shop.id}/`,
            { headers: getAuthHeaders(token) }
          );
          ordersData[shop.id] = {
            shop: shop,
            orders: response.data
          };
        } catch (error) {
          console.error(`❌ Ошибка загрузки заказов для магазина ${shop.id}:`, error);
          ordersData[shop.id] = {
            shop: shop,
            orders: []
          };
        }
      }

      setShopOrders(ordersData);
      console.log('📦 Заказы магазинов загружены:', ordersData);
    } catch (error) {
      console.error('❌ Ошибка загрузки заказов:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заказы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${API_CONFIG.BASE_URL}/orders/${orderId}/`,
        { status: newStatus },
        { headers: getAuthHeaders(token) }
      );
      
      Alert.alert('Успех', `Статус заказа обновлен на: ${getStatusText(newStatus)}`);
      loadShopOrders(); // Обновляем список заказов
      setOrderModalVisible(false);
    } catch (error) {
      console.error('❌ Ошибка обновления статуса:', error);
      Alert.alert('Ошибка', 'Не удалось обновить статус заказа');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'В ожидании',
      'confirmed': 'Подтвержден',
      'preparing': 'Готовится',
      'ready': 'Готов к выдаче',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#FF9800',
      'confirmed': '#2196F3',
      'preparing': '#9C27B0',
      'ready': '#4CAF50',
      'delivered': '#4CAF50',
      'cancelled': '#F44336'
    };
    return colorMap[status] || '#666';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShopOrders();
    setRefreshing(false);
  };

  const renderOrder = ({ item, shopId }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleOrderPress({ ...item, shopId })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>📋 Заказ #{item.order_id}</Text>
        <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
      
      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>
          📅 {new Date(item.created_at).toLocaleDateString('ru-RU')}
        </Text>
        <Text style={styles.orderTime}>
          🕒 {new Date(item.created_at).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsCount}>
          📦 {item.items ? item.items.length : 0} товар(ов)
        </Text>
        <Text style={styles.orderTotal}>
          💰 {item.total_sum} ₽
        </Text>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>
          👤 {item.user_name || 'Клиент'}
        </Text>
        {item.delivery_address && (
          <Text style={styles.deliveryAddress}>
            🚚 {item.delivery_address}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderShopSection = ({ item: shopData }) => {
    const shop = shopData.shop;
    const orders = shopData.orders;

    return (
      <View style={styles.shopSection}>
        <View style={styles.shopHeader}>
          <Text style={styles.shopName}>🏪 {shop.name}</Text>
          <Text style={styles.ordersCount}>
            {orders.length} заказ(ов)
          </Text>
        </View>

        {orders.length > 0 ? (
          <FlatList
            data={orders}
            renderItem={(item) => renderOrder({ ...item, shopId: shop.id })}
            keyExtractor={(order) => order.order_id.toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.noOrdersContainer}>
            <Text style={styles.noOrdersText}>
              В этом магазине пока нет заказов
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Загружаем заказы... 📦</Text>
      </SafeAreaView>
    );
  }

  if (myShops.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📦 Заказы магазинов</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏪</Text>
          <Text style={styles.emptyTitle}>У вас пока нет магазинов</Text>
          <Text style={styles.emptyText}>
            Создайте магазин, чтобы начать получать заказы!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const allShopData = Object.values(shopOrders);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Заказы магазинов</Text>
        <Text style={styles.headerSubtitle}>
          Управляйте заказами ваших магазинов
        </Text>
      </View>

      <FlatList
        data={allShopData}
        renderItem={renderShopSection}
        keyExtractor={(item) => item.shop.id.toString()}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Модальное окно с деталями заказа */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    📋 Заказ #{selectedOrder.order_id}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setOrderModalVisible(false)}
                  >
                    <Text style={styles.closeModalButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.orderDetails}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>📊 Статус заказа</Text>
                    <Text style={[styles.detailStatus, { color: getStatusColor(selectedOrder.status) }]}>
                      {getStatusText(selectedOrder.status)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>📅 Дата и время</Text>
                    <Text style={styles.detailText}>
                      {new Date(selectedOrder.created_at).toLocaleString('ru-RU')}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>👤 Информация о клиенте</Text>
                    <Text style={styles.detailText}>
                      Имя: {selectedOrder.user_name || 'Не указано'}
                    </Text>
                    {selectedOrder.delivery_address && (
                      <Text style={styles.detailText}>
                        Адрес: {selectedOrder.delivery_address}
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>📦 Товары в заказе</Text>
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <View key={index} style={styles.orderItem}>
                        <Text style={styles.itemName}>• {item.product_name}</Text>
                        <Text style={styles.itemDetails}>
                          {item.quantity} шт. × {item.price} ₽ = {item.quantity * item.price} ₽
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>💰 Итого</Text>
                    <Text style={styles.totalAmount}>
                      {selectedOrder.total_sum} ₽
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailTitle}>🔄 Изменить статус</Text>
                    <View style={styles.statusButtons}>
                      {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusButton,
                            selectedOrder.status === status && styles.statusButtonActive
                          ]}
                          onPress={() => updateOrderStatus(selectedOrder.order_id, status)}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            selectedOrder.status === status && styles.statusButtonTextActive
                          ]}>
                            {getStatusText(status)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  ordersList: {
    padding: 20,
  },
  shopSection: {
    marginBottom: 24,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ordersCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
  },
  orderItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  customerInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  customerName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#666',
  },
  noOrdersContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noOrdersText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeModalButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDetails: {
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderItem: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginLeft: 16,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: 'white',
  },
});

export default ShopOwnerOrdersScreen;
