import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG, getAuthHeaders } from '../config/api';
import axios from 'axios';

const CartScreen = ({ navigation }) => {
  const { cartItems, total, removeFromCart, updateQuantity, clearCart, getCartItemsByShop } = useCart();
  const { token } = useAuth();
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  // Функция для получения правильного URL изображения продукта
  const getProductImageUrl = (picturePath) => {
    if (!picturePath) return null;
    
    // Если путь уже содержит полный URL, возвращаем его как есть
    if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
      return picturePath;
    }
    
    // Если это относительный путь, добавляем базовый URL
    const cleanPath = picturePath.startsWith('/') ? picturePath.slice(1) : picturePath;
    
    // Определяем, это изображение магазина или продукта по расширению
    const isProductImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanPath);
    const fullUrl = `${API_CONFIG.BASE_URL}/media/${isProductImage ? 'product_pictures' : 'shop_pictures'}/${cleanPath}`;
    
    return fullUrl;
  };

  const handleUpdateQuantity = (itemId, shopId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    updateQuantity(itemId, shopId, newQuantity);
  };

  const handleRemoveItem = (itemId, shopId, itemName) => {
    Alert.alert(
      'Удалить товар',
      `Убрать "${itemName}" из корзины?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', onPress: () => removeFromCart(itemId, shopId), style: 'destructive' }
      ]
    );
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    
    Alert.alert(
      'Очистить корзину',
      'Убрать все товары из корзины?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Очистить', onPress: clearCart, style: 'destructive' }
      ]
    );
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Корзина пуста', 'Добавьте товары в корзину для оформления заказа');
      return;
    }

    setOrderLoading(true);
    try {
      // Группируем товары по магазинам
      const shops = getCartItemsByShop();
      
      // Создаем заказы для каждого магазина
      for (const [shopId, shopData] of Object.entries(shops)) {
        const orderData = {
          items: shopData.items.map(item => ({
            product_id: item.id,
            shop_id: parseInt(shopId),
            quantity: item.quantity
          }))
        };

        console.log('📦 Отправляем заказ для магазина:', shopId);
        console.log('📋 Данные заказа:', JSON.stringify(orderData, null, 2));

        await axios.post(
          `${API_CONFIG.BASE_URL}/orders/`,
          orderData,
          { headers: getAuthHeaders(token) }
        );
      }

      // Очищаем корзину после успешного заказа
      clearCart();
      setOrderModalVisible(false);
      
      Alert.alert(
        'Заказ оформлен! 🎉',
        'Ваш заказ успешно создан. Ожидайте подтверждения от магазина.',
        [
          { 
            text: 'Отлично!', 
            onPress: () => navigation.navigate('Shops') 
          }
        ]
      );

    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
      let errorMessage = 'Не удалось оформить заказ';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = 'Проверьте данные заказа';
        } else if (error.response.status === 401) {
          errorMessage = 'Необходимо войти в систему';
        } else if (error.response.status === 403) {
          errorMessage = 'Недостаточно прав для оформления заказа';
        }
      }
      
      Alert.alert('Ошибка', errorMessage);
    } finally {
      setOrderLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        {item.picture ? (
          <Image
            source={{ uri: getProductImageUrl(item.picture) }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>🛍️</Text>
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemShop}>🏪 {item.shopName}</Text>
        <Text style={styles.itemPrice}>💰 {item.price} ₽</Text>
      </View>

      <View style={styles.itemControls}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.id, item.shopId, item.quantity, -1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantityValue}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.id, item.shopId, item.quantity, 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.itemTotal}>{item.price * item.quantity} ₽</Text>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id, item.shopId, item.name)}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🛒 Корзина</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.emptyContent}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Корзина пуста</Text>
          <Text style={styles.emptySubtitle}>
            Добавьте товары из магазинов, чтобы оформить заказ
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Shops')}
          >
            <Text style={styles.browseButtonText}>🛍️ Перейти к магазинам</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛒 Корзина</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearCart}
        >
          <Text style={styles.clearButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item, index) => `${item.id}-${item.shopId}-${index}`}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Итого:</Text>
          <Text style={styles.totalValue}>{total} ₽</Text>
        </View>
        
        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => setOrderModalVisible(true)}
        >
          <Text style={styles.orderButtonText}>📋 Оформить заказ</Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно подтверждения заказа */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📋 Подтверждение заказа</Text>
            
            <ScrollView style={styles.orderSummary}>
              {Object.entries(getCartItemsByShop()).map(([shopId, shopData]) => (
                <View key={shopId} style={styles.shopOrder}>
                  <Text style={styles.shopOrderTitle}>🏪 {shopData.shopName}</Text>
                  {shopData.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <Text style={styles.orderItemName}>{item.name}</Text>
                      <Text style={styles.orderItemDetails}>
                        {item.quantity} шт. × {item.price} ₽ = {item.quantity * item.price} ₽
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalTotal}>
              <Text style={styles.modalTotalLabel}>Общая сумма:</Text>
              <Text style={styles.modalTotalValue}>{total} ₽</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setOrderModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, orderLoading && styles.disabledButton]}
                onPress={handlePlaceOrder}
                disabled={orderLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {orderLoading ? 'Оформляем...' : 'Подтвердить'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
  },
  placeholder: {
    width: 40,
  },
  cartList: {
    padding: 16,
    paddingBottom: 100,
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemShop: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  itemControls: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContent: {
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
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  orderSummary: {
    maxHeight: 300,
    marginBottom: 20,
  },
  shopOrder: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  shopOrderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  orderItemDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  modalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default CartScreen;
