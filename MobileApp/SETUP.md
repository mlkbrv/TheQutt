# 🚀 Настройка и запуск Qutt Mobile App

## 📋 Предварительные требования

1. **Node.js** (версия 16 или выше)
   ```bash
   node --version
   ```

2. **npm** или **yarn**
   ```bash
   npm --version
   ```

3. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

4. **Android Studio** (для Android) или **Xcode** (для iOS)

## 🔧 Установка

### 1. Переход в папку проекта
```bash
cd MobileApp
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка API сервера

Откройте файл `api/api.js` и измените `baseURL` на URL вашего Django сервера:

```javascript
export const api = axios.create({
  baseURL: 'http://localhost:8000', // Измените на ваш URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Важно:** Убедитесь, что ваш Django сервер запущен и доступен по указанному URL.

## 🏃‍♂️ Запуск приложения

### Разработка

1. **Запуск Expo Development Server**
   ```bash
   npm start
   ```

2. **Открытие в браузере**
   - Нажмите `w` в терминале или откройте http://localhost:19006

3. **Запуск на устройстве**
   - Установите Expo Go на ваш телефон
   - Отсканируйте QR код из терминала

### Платформы

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Web:**
```bash
npm run web
```

## 🔗 Интеграция с Django Backend

### Проверка API endpoints

Убедитесь, что ваш Django сервер предоставляет следующие endpoints:

#### Аутентификация
- `POST /users/register/` - Регистрация
- `POST /users/token/` - Получение токена
- `GET /users/profile/` - Профиль пользователя

#### Магазины и товары
- `GET /products/shops/` - Список магазинов
- `GET /products/shops/{id}/with-products/` - Магазин с товарами
- `GET /products/shops/{shop_id}/products/` - Товары магазина

#### Карта
- `GET /map/locations/` - Локации магазинов

#### Заказы
- `GET /orders/` - История заказов
- `POST /orders/` - Создание заказа
- `GET /orders/{order_id}/status/` - Статус заказа

### CORS настройки

Убедитесь, что ваш Django сервер настроен для CORS:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:19006",
    "http://localhost:3000",
    "http://localhost:8081",
]

CORS_ALLOW_CREDENTIALS = True
```

## 🐛 Отладка

### Просмотр логов
```bash
expo logs
```

### Отладка в браузере
```bash
expo start --web
```

### Проверка сети
```bash
# Проверьте доступность API
curl http://localhost:8000/users/profile/
```

## 📱 Тестирование

### Функциональность для тестирования

1. **Регистрация и вход**
   - Создайте новый аккаунт
   - Войдите в систему
   - Проверьте сохранение токена

2. **Просмотр магазинов**
   - Откройте главную страницу
   - Проверьте фильтрацию по категориям
   - Перейдите к товарам магазина

3. **Корзина**
   - Добавьте товары в корзину
   - Измените количество
   - Удалите товары
   - Оформите заказ

4. **Карта**
   - Откройте карту
   - Проверьте отображение маркеров
   - Нажмите на маркер
   - Перейдите к товарам

5. **Заказы**
   - Проверьте историю заказов
   - Просмотрите статусы

6. **Профиль**
   - Проверьте данные пользователя
   - Выйдите из системы

## 🔧 Настройка для продакшена

### 1. Создание production build

**Android:**
```bash
expo build:android
```

**iOS:**
```bash
expo build:ios
```

### 2. Настройка API для продакшена

Измените `baseURL` в `api/api.js` на продакшен URL:

```javascript
export const api = axios.create({
  baseURL: 'https://your-production-server.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи в терминале
2. Убедитесь, что Django сервер запущен
3. Проверьте настройки CORS
4. Убедитесь, что все API endpoints работают

## 🎯 Следующие шаги

1. Добавьте реальные изображения в папку `assets/`
2. Настройте push-уведомления
3. Добавьте аналитику
4. Оптимизируйте производительность
5. Добавьте тесты

---

**Удачи с вашим приложением Qutt! 🍽️♻️** 