/**
 * JWT tokenləri ilə iş üçün utilitlər
 */

// Полифилл для Buffer в React Native
if (typeof global !== 'undefined' && !global.Buffer) {
  global.Buffer = require('buffer').Buffer;
}

/**
 * JWT tokeni parse edir və payload qaytarır
 * @param {string} token - JWT token
 * @returns {object|null} - token payload və ya xəta zamanı null
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
    console.error('❌ JWT token parse etmə xətası:', error);
    return null;
  }
};

/**
 * Tokenin vaxtının keçib-keçmədiyini yoxlayır
 * @param {string} token - JWT token
 * @returns {boolean} - true əgər token vaxtı keçibsə
 */
export const isTokenExpired = (token) => {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('❌ Token vaxtı yoxlanılarkən xəta:', error);
    return true;
  }
};

/**
 * Tokenin vaxtının keçməsinə qədər olan vaxtı millisaniyələrdə qaytarır
 * @param {string} token - JWT token
 * @returns {number} - vaxtının keçməsinə qədər olan vaxt millisaniyələrdə
 */
export const getTimeUntilExpiry = (token) => {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) return 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;
    
    return Math.max(timeUntilExpiry * 1000, 0); // конвертируем в миллисекунды
  } catch (error) {
    console.error('❌ Vaxtın keçməsinə qədər olan vaxtı alma xətası:', error);
    return 0;
  }
};

/**
 * Tokenin yenilənməli olub-olmadığını yoxlayır (vaxtının keçməsindən 5 dəqiqə əvvəl)
 * @param {string} token - JWT token
 * @returns {boolean} - true əgər yenilənməlidirsə
 */
export const shouldRefreshToken = (token) => {
  try {
    const timeUntilExpiry = getTimeUntilExpiry(token);
    const fiveMinutes = 5 * 60 * 1000; // 5 минут в миллисекундах
    
    return timeUntilExpiry <= fiveMinutes;
  } catch (error) {
    console.error('❌ Tokenin yenilənməli olub-olmadığını yoxlama xətası:', error);
    return true;
  }
};

/**
 * Debug üçün token haqqında məlumat alır
 * @param {string} token - JWT token
 * @returns {object} - token haqqında məlumat
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
    console.error('❌ Token məlumatlarını alma xətası:', error);
    return null;
  }
};

/**
 * Vaxtı oxunaqlı formada format edir
 * @param {number} seconds - vaxt saniyələrdə
 * @returns {string} - format edilmiş vaxt
 */
const formatTime = (seconds) => {
  if (seconds <= 0) return 'Vaxtı keçib';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}s ${minutes}d ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}d ${secs}s`;
  } else {
    return `${secs}s`;
  }
};
