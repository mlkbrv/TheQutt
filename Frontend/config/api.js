// API Configuration for Qutt App
export const BASE_URL = 'https://thequtt-9nuq.onrender.com';

export const API_CONFIG = {
  // Base URL for Django backend
  BASE_URL: BASE_URL,
  
  // User authentication endpoints
  ENDPOINTS: {
    LOGIN: '/users/token/',
    REGISTER: '/users/register/',
    REFRESH_TOKEN: '/users/token/refresh/',
    PROFILE: '/users/profile/',
  },
  
  // Products and shops endpoints
  SHOP_ENDPOINTS: {
    SHOPS: '/products/shops/',
    SHOP_DETAIL: '/products/shops/{id}/',
    SHOP_WITH_PRODUCTS: '/products/shops/{id}/with-products/',
    PRODUCTS: '/products/products/',
    SHOP_PRODUCTS: '/products/shops/{shop_id}/products/',
  },
  
  // Full URLs
  get LOGIN_URL() {
    return this.BASE_URL + this.ENDPOINTS.LOGIN;
  },
  
  get REGISTER_URL() {
    return this.BASE_URL + this.ENDPOINTS.REGISTER;
  },
  
  get REFRESH_TOKEN_URL() {
    return this.BASE_URL + this.ENDPOINTS.REFRESH_TOKEN;
  },
  
  get PROFILE_URL() {
    return this.BASE_URL + this.ENDPOINTS.PROFILE;
  },
  
  // Shop URLs
  get SHOPS_URL() {
    return this.BASE_URL + this.SHOP_ENDPOINTS.SHOPS;
  },
  
  getShopDetailURL(id) {
    return this.BASE_URL + this.SHOP_ENDPOINTS.SHOP_DETAIL.replace('{id}', id);
  },
  
  getShopWithProductsURL(id) {
    return this.BASE_URL + this.SHOP_ENDPOINTS.SHOP_WITH_PRODUCTS.replace('{id}', id);
  },
  
  getShopProductsURL(shopId) {
    return this.BASE_URL + this.SHOP_ENDPOINTS.SHOP_PRODUCTS.replace('{shop_id}', shopId);
  }
};

// API Headers
export const getAuthHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Auth header set:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.log('⚠️ No token provided for auth headers');
  }
  
  return headers;
};

// API Error Messages
export const API_ERRORS = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  VALIDATION_ERROR: 'Ошибка валидации данных.',
  AUTH_ERROR: 'Ошибка аутентификации.',
};
