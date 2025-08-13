/**
 * Утилиты для работы с JWT токенами
 */

// Полифилл для Buffer в React Native
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = require('buffer').Buffer;
}

/**
 * Парсит JWT токен и возвращает payload
 * @param {string} token - JWT токен
 * @returns {object|null} - payload токена или null при ошибке
 */
export const parseJWT = (token) => {
  try {
    if (!token) return null;
    
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Используем Buffer для React Native совместимости
    let jsonPayload;
    if (typeof Buffer !== 'undefined') {
      // Для Node.js/React Native
      jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    } else {
      // Fallback для браузера
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    }
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Error parsing JWT token:', error);
    return null;
  }
};

/**
 * Проверяет, истек ли токен
 * @param {string} token - JWT токен
 * @returns {boolean} - true если токен истек
 */
export const isTokenExpired = (token) => {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true;
  }
};

/**
 * Возвращает время до истечения токена в миллисекундах
 * @param {string} token - JWT токен
 * @returns {number} - время до истечения в миллисекундах
 */
export const getTimeUntilExpiry = (token) => {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) return 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;
    
    return Math.max(timeUntilExpiry * 1000, 0); // конвертируем в миллисекунды
  } catch (error) {
    console.error('❌ Error getting time until expiry:', error);
    return 0;
  }
};

/**
 * Проверяет, нужно ли обновить токен (за 5 минут до истечения)
 * @param {string} token - JWT токен
 * @returns {boolean} - true если нужно обновить
 */
export const shouldRefreshToken = (token) => {
  try {
    const timeUntilExpiry = getTimeUntilExpiry(token);
    const fiveMinutes = 5 * 60 * 1000; // 5 минут в миллисекундах
    
    return timeUntilExpiry <= fiveMinutes;
  } catch (error) {
    console.error('❌ Error checking if token should be refreshed:', error);
    return true;
  }
};

/**
 * Получает информацию о токене для отладки
 * @param {string} token - JWT токен
 * @returns {object} - информация о токене
 */
export const getTokenInfo = (token) => {
  try {
    const payload = parseJWT(token);
    if (!payload) return null;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;
    
    return {
      userId: payload.user_id,
      issuedAt: new Date(payload.iat * 1000).toLocaleString(),
      expiresAt: new Date(payload.exp * 1000).toLocaleString(),
      timeUntilExpiry: timeUntilExpiry,
      timeUntilExpiryFormatted: formatTime(timeUntilExpiry),
      shouldRefresh: shouldRefreshToken(token)
    };
  } catch (error) {
    console.error('❌ Error getting token info:', error);
    return null;
  }
};

/**
 * Форматирует время в читаемом виде
 * @param {number} seconds - время в секундах
 * @returns {string} - отформатированное время
 */
const formatTime = (seconds) => {
  if (seconds <= 0) return 'Истек';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м ${secs}с`;
  } else if (minutes > 0) {
    return `${minutes}м ${secs}с`;
  } else {
    return `${secs}с`;
  }
};
