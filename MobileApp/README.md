# Qutt Mobile App

React Native приложение для заказа еды со скидками, аналог Too Good To Go.

## 🚀 Установка и запуск

### Предварительные требования

- Node.js (версия 16 или выше)
- npm или yarn
- Expo CLI
- Android Studio (для Android) или Xcode (для iOS)

### Установка зависимостей

```bash
cd MobileApp
npm install
```

### Настройка API

Откройте файл `api/api.js` и измените `baseURL` на URL вашего Django сервера:

```javascript
export const api = axios.create({
  baseURL: 'http://your-server-ip:8000', // Измените на ваш URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Запуск приложения

```bash
# Запуск Expo
npm start

# Или для конкретной платформы
npm run android
npm run ios
```

## 📱 Функциональность

### 🔐 Аутентификация
- Регистрация новых пользователей
- Вход в систему
- JWT токены с AsyncStorage
- Автоматический выход при истечении токена

### 🏠 Главная страница
- Просмотр магазинов по категориям
- Фильтрация по типам заведений
- Переход к товарам магазина
- Добавление товаров в корзину

### 🗺️ Карта
- Отображение магазинов на карте
- Интерактивные маркеры
- Карточки магазинов при нажатии
- Переход к товарам магазина

### 🛒 Корзина
- Просмотр добавленных товаров
- Изменение количества
- Удаление товаров
- Подсчет общей суммы
- Оформление заказа

### 📋 Заказы
- История заказов пользователя
- Статусы заказов
- Детали заказов
- Обновление статусов

### 👤 Профиль
- Информация о пользователе
- Настройки аккаунта
- Выход из системы

## 🏗️ Архитектура

### Структура проекта
```
MobileApp/
├── App.js                 # Главный компонент
├── navigation/            # Навигация
│   ├── AuthNavigator.js
│   └── MainTabNavigator.js
├── screens/              # Экраны приложения
│   ├── Auth/            # Авторизация
│   ├── Home/            # Главная
│   ├── Map/             # Карта
│   ├── Cart/            # Корзина
│   ├── Orders/          # Заказы
│   └── Profile/         # Профиль
├── components/           # Переиспользуемые компоненты
│   ├── ShopCard.js
│   ├── ProductCard.js
│   └── MapMarkerCard.js
├── context/             # React Context
│   └── AuthContext.js
├── api/                 # API клиент
│   └── api.js
└── utils/               # Вспомогательные функции
    └── helpers.js
```

### State Management
- **Context API** для управления состоянием авторизации
- **Local State** для корзины и данных экранов
- **AsyncStorage** для хранения токенов

### Навигация
- **React Navigation** для навигации между экранами
- **Stack Navigator** для авторизации
- **Tab Navigator** для основного приложения

## 🔧 API Endpoints

### Аутентификация
- `POST /users/register/` - Регистрация
- `POST /users/token/` - Получение токена
- `GET /users/profile/` - Профиль пользователя

### Магазины и товары
- `GET /products/shops/` - Список магазинов
- `GET /products/shops/{id}/with-products/` - Магазин с товарами
- `GET /products/shops/{shop_id}/products/` - Товары магазина

### Карта
- `GET /map/locations/` - Локации магазинов

### Заказы
- `GET /orders/` - История заказов
- `POST /orders/` - Создание заказа
- `GET /orders/{order_id}/status/` - Статус заказа

## 🎨 UI/UX Особенности

- Современный дизайн с Material Design принципами
- Адаптивная верстка для разных размеров экранов
- Плавные анимации и переходы
- Интуитивная навигация
- Обратная связь для пользовательских действий

## 🔒 Безопасность

- JWT токены для аутентификации
- Автоматическое обновление токенов
- Безопасное хранение в AsyncStorage
- Валидация данных на клиенте

## 📦 Зависимости

### Основные
- `expo` - Фреймворк для React Native
- `react-navigation` - Навигация
- `react-native-maps` - Карты
- `axios` - HTTP клиент
- `@react-native-async-storage/async-storage` - Локальное хранилище

### UI/UX
- `react-native-vector-icons` - Иконки
- `expo-image-picker` - Выбор изображений
- `expo-location` - Геолокация

## 🚀 Развертывание

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

### Web
```bash
expo build:web
```

## 🐛 Отладка

### Логи
```bash
expo logs
```

### Отладка в браузере
```bash
expo start --web
```

## 📝 Лицензия

MIT License

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

---

**Qutt** - Приложение для сокращения пищевых отходов 🍽️♻️ 