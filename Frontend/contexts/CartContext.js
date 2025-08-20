import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Загружаем корзину из AsyncStorage при запуске
  useEffect(() => {
    loadCart();
  }, []);

  // Обновляем общую сумму при изменении корзины
  useEffect(() => {
    const newTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
    saveCart();
  }, [cartItems]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Səbəti yükləmə xətası:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Səbəti saxlama xətası:', error);
    }
  };

  const addToCart = (product) => {
    setCartItems(prevItems => {
      // Проверяем, есть ли уже такой товар в корзине
      const existingItemIndex = prevItems.findIndex(
        item => item.id === product.id && item.shopId === product.shopId
      );

      if (existingItemIndex !== -1) {
        // Если товар уже есть, увеличиваем количество
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += product.quantity;
        return updatedItems;
      } else {
        // Если товара нет, добавляем новый
        return [...prevItems, product];
      }
    });
  };

  const removeFromCart = (itemId, shopId) => {
    setCartItems(prevItems => 
      prevItems.filter(item => !(item.id === itemId && item.shopId === shopId))
    );
  };

  const updateQuantity = (itemId, shopId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, shopId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId && item.shopId === shopId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItemsByShop = () => {
    const shops = {};
    cartItems.forEach(item => {
      if (!shops[item.shopId]) {
        shops[item.shopId] = {
          shopName: item.shopName,
          items: []
        };
      }
      shops[item.shopId].items.push(item);
    });
    return shops;
  };

  const value = {
    cartItems,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartItemsByShop,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
