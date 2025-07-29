import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/helpers';
import { ordersAPI } from '../../api/api';

const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart, updateCartItemQuantity, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (item, increment) => {
    const newQuantity = item.quantity + increment;
    if (newQuantity >= 1) {
      updateCartItemQuantity(item.id, newQuantity);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.length === 0) {
      Alert.alert('Boş səbət', 'Səbətiniz boşdur');
      return;
    }

    console.log('Cart items:', cart);

    setLoading(true);
    try {
      // Группируем товары по магазинам
      const itemsByShop = {};
      cart.forEach(item => {
        console.log('Processing item:', item);
        if (!item.shop) {
          console.log('Item has no shop info:', item);
          return;
        }
        
        if (!itemsByShop[item.shop.id]) {
          itemsByShop[item.shop.id] = [];
        }
        itemsByShop[item.shop.id].push({
          product_id: item.id,
          shop_id: item.shop.id,
          quantity: item.quantity
        });
      });

      console.log('Items by shop:', itemsByShop);

      // Создаем заказы для каждого магазина
      const orderPromises = Object.entries(itemsByShop).map(([shopId, items]) => {
        const orderData = {
          items: items
        };
        console.log('Creating order with data:', orderData);
        return ordersAPI.createOrder(orderData);
      });

      const results = await Promise.all(orderPromises);
      console.log('Orders created:', results);

      Alert.alert('Uğurlu', 'Sifariş uğurla verildi!');
      clearCart();
    } catch (error) {
      console.log('Checkout error:', error);
      Alert.alert('Xəta', 'Sifariş verilə bilmədi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImage}>
        <Text style={styles.itemEmoji}>🍔</Text>
      </View>
      
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
        
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item, -1)}
          >
            <Text style={styles.quantityEmoji}>➖</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item, 1)}
          >
            <Text style={styles.quantityEmoji}>➕</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Text style={styles.removeEmoji}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const total = cart && cart.length > 0 
    ? cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : 0;

  if (!cart || cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyText}>Səbətiniz boşdur</Text>
        <Text style={styles.emptySubtext}>
          Başlamaq üçün ləzzətli yemək əlavə edin
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.browseButtonText}>Mağazaları baxın</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Cart</Text>
        <Text style={styles.subtitle}>
          {cart ? cart.length : 0} {(cart ? cart.length : 0) === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <FlatList
        data={cart || []}
        renderItem={renderCartItem}
        keyExtractor={(item) => (item?.id || Math.random()).toString()}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.disabledButton]}
          onPress={handleCheckout}
          disabled={loading}
        >
          <Text style={styles.checkoutEmoji}>💳</Text>
          <Text style={styles.checkoutText}>
            {loading ? 'Processing...' : 'Checkout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  cartList: {
    paddingVertical: 8,
  },
  cartItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemEmoji: {
    fontSize: 30,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  quantityEmoji: {
    fontSize: 14,
    color: '#4CAF50',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: '#333',
  },
  removeButton: {
    padding: 8,
  },
  removeEmoji: {
    fontSize: 20,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalRow: {
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
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  checkoutEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  checkoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen; 