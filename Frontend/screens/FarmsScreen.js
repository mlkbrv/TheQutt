import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { farmsAPI } from '../services/api';
import { API_CONFIG } from '../config/api';

const FarmCard = ({ farm, onPress, imageCache, addImageToCache, isImageCached, getFarmImageUrl }) => (
  <TouchableOpacity style={styles.farmCard} onPress={onPress}>
    {farm.image ? (
      <Image
        source={{ 
          uri: getFarmImageUrl(farm.image)
        }}
        style={styles.farmImage}
        resizeMode="cover"
        onLoadStart={() => {
          const imageUrl = getFarmImageUrl(farm.image);
          if (!isImageCached(imageUrl)) {
            console.log('🔄 Şəkil yüklənir:', farm.name);
          }
        }}
        onLoad={() => {
          const imageUrl = getFarmImageUrl(farm.image);
          if (!isImageCached(imageUrl)) {
            addImageToCache(imageUrl);
            console.log('✅ Şəkil yükləndi:', farm.name);
          }
        }}
        onError={() => {
          console.log('❌ Şəkil yükləmə xətası:', farm.name);
        }}
      />
    ) : (
      <View style={styles.farmImagePlaceholder}>
        <Text style={styles.farmImagePlaceholderText}>🌾</Text>
      </View>
    )}
    
    <View style={styles.farmContent}>
      <View style={styles.farmHeader}>
        <Text style={styles.farmName}>{farm.name}</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.location}>📍 {farm.address}</Text>
        </View>
      </View>
      
      <View style={styles.farmDetails}>
        {farm.description && (
          <Text style={styles.description} numberOfLines={2}>
            {farm.description}
          </Text>
        )}
        
        <View style={styles.farmStats}>
          <Text style={styles.statText}>
            👤 Sahibkar: {farm.owner?.email || 'Göstərilməyib'}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const FarmsScreen = ({ navigation }) => {
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageCache, setImageCache] = useState(new Map()); // Кэш для изображений

  // Функция для получения правильного URL изображения фермы
  const getFarmImageUrl = (picturePath) => {
    if (!picturePath) return null;
    
    // Если путь уже содержит полный URL, возвращаем его как есть
    if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
      return picturePath;
    }
    
    // Если это относительный путь, добавляем базовый URL
    const cleanPath = picturePath.startsWith('/') ? picturePath.slice(1) : picturePath;
    
    // Определяем, это изображение фермы или продукта по расширению
    const isProductImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanPath);
    const fullUrl = `${API_CONFIG.BASE_URL}/media/${isProductImage ? 'product_pictures' : 'shop_pictures'}/${cleanPath}`;
    
    return fullUrl;
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const isImageCached = (imageUrl) => {
    return imageCache.has(imageUrl);
  };

  const addImageToCache = (imageUrl) => {
    if (!imageCache.has(imageUrl)) {
      setImageCache(prev => new Map(prev).set(imageUrl, true));
    }
  };

  const loadFarms = async (forceRefresh = false) => {
    try {
      // Если данные уже есть и не требуется принудительное обновление, пропускаем загрузку
      if (!forceRefresh && farms.length > 0) {
        console.log('📱 Farms already loaded, skipping fetch');
        return;
      }
      
      setIsLoading(true);
      const response = await farmsAPI.getAllFarms();
      // API возвращает данные с пагинацией, нужно взять results
      const farmsData = response.data.results || response.data;
      setFarms(farmsData);
    } catch (error) {
      console.error('❌ Error loading farms:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить фермы');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFarms(true); // Принудительное обновление
    setRefreshing(false);
  };

  const handleFarmPress = (farm) => {
    navigation.navigate('FarmDetail', { farm });
  };

  const renderFarm = ({ item }) => (
    <FarmCard
      farm={item}
      onPress={() => handleFarmPress(item)}
      imageCache={imageCache}
      addImageToCache={addImageToCache}
      isImageCached={isImageCached}
      getFarmImageUrl={getFarmImageUrl}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Загружаем фермы... 🌾</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌾 Фермы</Text>
        <Text style={styles.headerSubtitle}>
          {farms.length} ферм доступно
        </Text>
      </View>

      {farms.length === 0 && !isLoading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🌾</Text>
          <Text style={styles.emptyText}>Фермы не найдены</Text>
          <Text style={styles.emptySubtext}>Попробуйте обновить страницу</Text>
        </View>
      )}

      <FlatList
        data={farms}
        renderItem={renderFarm}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#2E7D32']}
          />
        }
        showsVerticalScrollIndicator={false}
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listContainer: {
    padding: 20,
  },
  farmCard: {
    backgroundColor: '#ffffff',
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
  farmImage: {
    width: '100%',
    height: 200,
  },
  farmImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmImagePlaceholderText: {
    fontSize: 80,
    color: '#4CAF50',
  },
  farmContent: {
    padding: 20,
  },
  farmHeader: {
    marginBottom: 12,
  },
  farmName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    alignSelf: 'flex-start',
  },
  location: {
    fontSize: 14,
    color: '#2E7D32',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  farmDetails: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  farmStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
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
});

export default FarmsScreen;
