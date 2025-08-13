import axios from 'axios';
import { API_CONFIG, getAuthHeaders } from '../config/api';

// API для работы с фермами
export const farmsAPI = {
  // Получить список всех ферм
  async getFarms() {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/farms/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching farms:', error);
      throw error;
    }
  },

  // Получить продукты конкретной фермы
  async getFarmProducts(farmId) {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/farms/${farmId}/products/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching farm products:', error);
      throw error;
    }
  },

  // Получить детали фермы
  async getFarmDetails(farmId) {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/farms/${farmId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching farm details:', error);
      throw error;
    }
  },

  // Алиас для совместимости
  getAllFarms() {
    return this.getFarms();
  }
};

// API для работы с заказами
export const ordersAPI = {
  // Создать новый заказ
  async createOrder(orderData, token) {
    try {
      const headers = getAuthHeaders(token);
      const response = await axios.post(`${API_CONFIG.BASE_URL}/orders/`, orderData, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Получить заказы пользователя
  async getUserOrders(token) {
    try {
      const headers = getAuthHeaders(token);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/orders/`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  // Получить все заказы (для админов)
  async getAllOrders(token) {
    try {
      const headers = getAuthHeaders(token);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/orders/`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  }
};
