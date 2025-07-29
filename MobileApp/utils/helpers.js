// Форматирование цены
export const formatPrice = (price) => {
  return `${parseFloat(price).toFixed(2)} ₼`;
};

// Форматирование времени
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  const time = new Date(`2000-01-01T${timeString}`);
  return time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Форматирование даты
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Получение статуса заказа
export const getOrderStatusText = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing',
    'ready': 'Ready for Pickup',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
  return statusMap[status] || status;
};

// Получение цвета статуса
export const getOrderStatusColor = (status) => {
  const colorMap = {
    'pending': '#FFA500',
    'confirmed': '#007AFF',
    'preparing': '#FF6B35',
    'ready': '#4CAF50',
    'completed': '#4CAF50',
    'cancelled': '#FF3B30',
  };
  return colorMap[status] || '#666';
};

// Валидация email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Валидация пароля
export const validatePassword = (password) => {
  return password.length >= 6;
};

// Вычисление общей суммы корзины
export const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// Проверка доступности товара
export const isProductAvailable = (product) => {
  const now = new Date();
  const availableTime = new Date(`2000-01-01T${product.available_time}`);
  const currentTime = new Date(`2000-01-01T${now.getHours()}:${now.getMinutes()}:00`);
  
  return product.quantity > 0 && currentTime <= availableTime;
}; 