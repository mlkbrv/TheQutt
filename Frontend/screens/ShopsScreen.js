import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_CONFIG, getAuthHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const ShopsScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageCache, setImageCache] = useState(new Map());
  const { token, refreshToken } = useAuth();
  
  // Рефы для предотвращения повторных запросов
  const hasLoadedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Функция загрузки магазинов с кэшированием
  const fetchShops = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Если данные уже есть и не требуется принудительное обновление, пропускаем загрузку
      if (!forceRefresh && shops.length > 0 && !hasLoadedRef.current) {
        console.log('📱 Mağazalar artıq yüklənib, yükləmə atlanır');
        return;
      }
      
      // Проверяем, не делали ли мы запрос недавно (защита от спама)
      if (!forceRefresh && now - lastFetchTimeRef.current < 5000) { // 5 секунд
        console.log('⚠️ Son zamanlarda sorğu göndərilib, atlanır...');
        return;
      }
      
      setIsLoading(true);
      lastFetchTimeRef.current = now;
      
      if (!token) {
        console.error('❌ Mağaza sorğusu üçün token yoxdur');
        Alert.alert('Xəta', 'Avtorizasiya tokeni tapılmadı');
        return;
      }
      
      console.log('🔑 Token:', token.substring(0, 20) + '...');
      const headers = getAuthHeaders(token);
      console.log('📋 Headers:', headers);
      console.log('🌐 URL:', API_CONFIG.SHOPS_URL);
      
      const response = await axios.get(API_CONFIG.SHOPS_URL, { headers });
      
      if (response.data) {
        setShops(response.data);
        hasLoadedRef.current = true;
        
        // Извлекаем уникальные категории
        const uniqueCategories = [...new Set(response.data.map(shop => shop.category))];
        setCategories(['all', ...uniqueCategories]);
        
        console.log(`✅ ${response.data.length} mağaza uğurla yükləndi`);
      }
    } catch (error) {
      console.error('❌ Mağazaları yükləmə xətası:', error);
      console.error('📊 Xəta cavabı:', error.response?.data);
      console.error('🔢 Xəta statusu:', error.response?.status);
      
      // Если токен истек, пытаемся обновить его
      if (error.response?.status === 401 && error.response?.data?.code === 'token_not_valid') {
        console.log('🔄 Token vaxtı keçib, yeniləmə cəhdi...');
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess) {
          console.log('✅ Token yeniləndi, mağaza sorğusu təkrarlanır...');
          // Повторяем запрос с новым токеном, но не перезагружаем изображения
          return fetchShops(false);
        } else {
          console.log('❌ Token yenilənmədi, istifadəçi yenidən daxil olmalıdır');
          Alert.alert('Xəta', 'Sessiya vaxtı keçib. Yenidən daxil olun.');
        }
      } else {
        Alert.alert('Xəta', 'Mağazalar yüklənə bilmədi');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, refreshToken, shops.length]);

  // Загружаем данные только при первом рендере или изменении токена
  useEffect(() => {
    console.log('🔄 useEffect triggered, token:', token ? 'exists' : 'null');
    
    if (token && !hasLoadedRef.current) {
      console.log('✅ Token found, fetching shops...');
      fetchShops();
    } else if (!token) {
      console.log('⚠️ No token, setting loading to false');
      setIsLoading(false);
    }
  }, [token]); // Убираем fetchShops из зависимостей

  const onRefresh = async () => {
    setRefreshing(true);
    hasLoadedRef.current = false; // Сбрасываем флаг загрузки
    await fetchShops(true); // Принудительное обновление
    setRefreshing(false);
  };

  const handleShopPress = (shop) => {
    navigation.navigate('ShopProducts', { 
      shopId: shop.id, 
      shopName: shop.name 
    });
  };



  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'restaurant':
        return '🍽️';
      case 'cafe':
        return '☕';
      case 'bakery':
        return '🥐';
      case 'fast food':
        return '🍔';
      case 'bar':
        return '🍺';
      default:
        return '🏪';
    }
  };

  const getImageUrl = (picturePath) => {
    if (!picturePath) return null;
    
    // Если путь уже содержит полный URL, возвращаем его как есть
    if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
      return picturePath;
    }
    
    // Если это относительный путь, добавляем базовый URL
    const cleanPath = picturePath.startsWith('/') ? picturePath.slice(1) : picturePath;
    const fullUrl = `${API_CONFIG.BASE_URL}/media/shop_pictures/${cleanPath}`;
    
    return fullUrl;
  };

  const isImageCached = (imageUrl) => {
    return imageCache.has(imageUrl);
  };

  const addImageToCache = (imageUrl) => {
    if (!imageCache.has(imageUrl)) {
      setImageCache(prev => new Map(prev).set(imageUrl, true));
    }
  };



  const handleImageError = (shopId, picturePath, error) => {
    console.log('❌ Ошибка загрузки изображения для:', shopId, error);
    console.log('📁 Путь к изображению:', picturePath);
    console.log('🔍 Проверьте, что файл существует на сервере');
  };

  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'restaurant':
        return '#FF6B6B';
      case 'cafe':
        return '#4ECDC4';
      case 'bakery':
        return '#FFE66D';
      case 'fast food':
        return '#FF8E53';
      case 'bar':
        return '#A8E6CF';
      default:
        return '#2E7D32';
    }
  };

  const filteredShops = selectedCategory === 'all' 
    ? shops 
    : shops.filter(shop => shop.category === selectedCategory);

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item && styles.selectedCategoryText
      ]}>
        {item === 'all' ? 'Hamısı' : getCategoryIcon(item) + ' ' + item}
      </Text>
    </TouchableOpacity>
  );

  const renderShopItem = ({ item }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => handleShopPress(item)}
    >
             <View style={styles.shopImageContainer}>
                  {item.picture ? (
           <>
                           <Image
                source={{ 
                  uri: getImageUrl(item.picture),
                  headers: {
                    'Accept': 'image/*',
                    'User-Agent': 'QuttApp/1.0'
                  }
                }}
                style={styles.shopImage}
                resizeMode="cover"
                onLoadStart={() => {
                  if (!isImageCached(getImageUrl(item.picture))) {
                    console.log('🔄 Şəkil yüklənir:', item.name);
                  }
                }}
                onLoad={() => {
                  const imageUrl = getImageUrl(item.picture);
                  if (!isImageCached(imageUrl)) {
                    addImageToCache(imageUrl);
                    console.log('✅ Şəkil yükləndi:', item.name);
                  }
                }}
                onError={(error) => handleImageError(item.id, item.picture, error)}
              />
             
           </>
         ) : (
           <View style={[
             styles.shopImagePlaceholder, 
             { backgroundColor: getCategoryColor(item.category) }
           ]}>
             <Text style={styles.shopImagePlaceholderText}>
               {getCategoryIcon(item.category)}
             </Text>
           </View>
         )}
         <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
           <Text style={styles.categoryBadgeText}>{item.category}</Text>
         </View>
       </View>
      
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.name}</Text>
        <Text style={styles.shopDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.shopAddress}>📍 {item.address}</Text>
        {item.opening_hours && (
          <Text style={styles.shopHours}>🕒 {item.opening_hours}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Mağazalar yüklənir... 🏪</Text>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏪 Mağazalar və Restoranlar</Text>
        </View>
        <View style={styles.noAuthContainer}>
          <Text style={styles.noAuthIcon}>🔐</Text>
          <Text style={styles.noAuthTitle}>Avtorizasiya Lazımdır</Text>
          <Text style={styles.noAuthText}>
            Mağazaları görmək üçün daxil olmalısınız
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Sistemə daxil ol</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
             {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 Mağazalar və Restoranlar</Text>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Shops List */}
      <FlatList
        data={filteredShops}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shopsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E7D32']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🏪 Mağaza tapılmadı</Text>
            <Text style={styles.emptySubtext}>Başqa kateqoriya seçməyə çalışın</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  categoriesContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  selectedCategoryItem: {
    backgroundColor: '#2E7D32',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
  },
  shopsList: {
    padding: 20,
  },
  shopCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  shopImageContainer: {
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: 200,
  },
  shopImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
     shopImagePlaceholderText: {
     fontSize: 48,
   },
   
   categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  shopInfo: {
    padding: 20,
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  shopDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  shopAddress: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  shopHours: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartButtonText: {
    fontSize: 20,
    color: 'white',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noAuthIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  noAuthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  noAuthText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ShopsScreen;
