import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Создаем экземпляр axios с базовым URL
export const api = axios.create({
  baseURL: 'http://192.168.1.70:8000', // Ваш локальный IP адрес
  timeout: 30000, // Увеличиваем таймаут до 30 секунд
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.log('Request error:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.data);
    return response;
  },
  async (error) => {
    console.log('Response error:', error);
    console.log('Error response:', error.response?.data);
    console.log('Error status:', error.response?.status);
    
    if (error.code === 'ECONNABORTED') {
      console.log('Request timeout');
    }
    
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      try {
        await AsyncStorage.removeItem('token');
      } catch (storageError) {
        console.log('Error removing token:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

// API функции для работы с данными
export const authAPI = {
  login: (email, password) => api.post('/users/token/', { email, password }),
  register: (userData) => api.post('/users/register/', userData),
  getProfile: () => api.get('/users/profile/'),
};

export const shopsAPI = {
  getShops: () => api.get('/products/shops/'),
  getShopWithProducts: (shopId) => api.get(`/products/shops/${shopId}/with-products/`),
  getShopProducts: (shopId) => api.get(`/products/shops/${shopId}/products/`),
};

export const mapAPI = {
  getLocations: () => api.get('/map/locations/'),
};

export const ordersAPI = {
  getOrders: () => {
    console.log('Getting orders...');
    return api.get('/orders/');
  },
  createOrder: (orderData) => {
    console.log('Creating order with data:', orderData);
    return api.post('/orders/', orderData);
  },
  getOrderStatus: (orderId) => api.get(`/orders/${orderId}/status/`),
}; 