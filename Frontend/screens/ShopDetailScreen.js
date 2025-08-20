import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_CONFIG, getAuthHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const ShopDetailScreen = ({ route, navigation }) => {
  const { shop } = route.params;
  const [shopWithProducts, setShopWithProducts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchShopDetails();
    }
  }, [token]);

  const fetchShopDetails = async () => {
    try {
      setIsLoading(true);
      const headers = getAuthHeaders(token);
      const response = await axios.get(
        API_CONFIG.getShopWithProductsURL(shop.id),
        { headers }
      );
      
      if (response.data) {
        setShopWithProducts(response.data);
      }
    } catch (error) {
      console.error('Mağaza detallarını yükləmə xətası:', error);
      Alert.alert('Xəta', 'Mağaza detalları yüklənə bilmədi');
    } finally {
      setIsLoading(false);
    }
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
      console.log('Mağaza/məhsul üçün şəkil URL-i (artıq tam):', picturePath);
      return picturePath;
    }
    
    // Если это относительный путь, добавляем базовый URL
    const cleanPath = picturePath.startsWith('/') ? picturePath.slice(1) : picturePath;
    
    // Определяем, это изображение магазина или продукта
    let fullUrl;
    if (picturePath.includes('shop_pictures') || picturePath.includes('bakery') || picturePath.includes('pizzeria') || picturePath.includes('cafe') || picturePath.includes('restaurant') || picturePath.includes('bar')) {
      fullUrl = `${API_CONFIG.BASE_URL}/media/shop_pictures/${cleanPath}`;
    } else {
      fullUrl = `${API_CONFIG.BASE_URL}/media/product_pictures/${cleanPath}`;
    }
    
    console.log('Mağaza/məhsul üçün şəkil URL-i (quruldu):', fullUrl);
    return fullUrl;
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

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
             <View style={styles.productImageContainer}>
         {item.picture ? (
           <>
             <Image
               source={{ uri: getImageUrl(item.picture) }}
               style={styles.productImage}
               resizeMode="cover"
               onLoadStart={() => console.log('🔄 Загрузка изображения продукта:', item.name)}
               onLoad={() => console.log('✅ Изображение продукта загружено:', item.name)}
               onError={(error) => console.log('❌ Ошибка загрузки изображения продукта:', item.name, error)}
             />
             
           </>
         ) : (
           <View style={styles.productImagePlaceholder}>
             <Text style={styles.productImagePlaceholderText}>🍽️</Text>
           </View>
         )}
       </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>💰 {item.price} ₼</Text>
          <Text style={styles.productQuantity}>📦 {item.quantity} шт</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Загружаем детали... 🏪</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Shop Header */}
        <View style={styles.shopHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
                     <View style={styles.shopImageContainer}>
             {shop.picture ? (
               <>
                 <Image
                   source={{ uri: getImageUrl(shop.picture) }}
                   style={styles.shopImage}
                   resizeMode="cover"
                   onLoadStart={() => console.log('🔄 Loading shop image:', shop.name)}
                   onLoad={() => console.log('✅ Shop image loaded:', shop.name)}
                   onError={(error) => console.log('❌ Error loading shop image:', shop.name, error)}
                 />
                 
               </>
             ) : (
               <View style={[styles.shopImagePlaceholder, { backgroundColor: getCategoryColor(shop.category) }]}>
                 <Text style={styles.shopImagePlaceholderText}>
                   {getCategoryIcon(shop.category)}
                 </Text>
               </View>
             )}
             <View style={styles.categoryBadge}>
               <Text style={styles.categoryBadgeText}>{shop.category}</Text>
             </View>
           </View>
        </View>

        {/* Shop Info */}
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopDescription}>{shop.description}</Text>
          <Text style={styles.shopAddress}>📍 {shop.address}</Text>
          {shop.opening_hours && (
            <Text style={styles.shopHours}>🕒 {shop.opening_hours}</Text>
          )}
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.productsTitle}>🍽️ Menu</Text>
          {shopWithProducts?.products && shopWithProducts.products.length > 0 ? (
            <FlatList
              data={shopWithProducts.products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyProductsContainer}>
              <Text style={styles.emptyProductsText}>🍽️ Products not found</Text>
              <Text style={styles.emptyProductsSubtext}>No products available in this shop yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  shopHeader: {
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  shopImageContainer: {
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: 250,
  },
  shopImagePlaceholder: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
     shopImagePlaceholderText: {
     fontSize: 64,
   },
   
   categoryBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  shopInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  shopDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  shopAddress: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 8,
  },
  shopHours: {
    fontSize: 16,
    color: '#666',
  },
  productsSection: {
    backgroundColor: 'white',
    padding: 20,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: 100,
    height: 100,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
     productImagePlaceholderText: {
     fontSize: 32,
   },
   
   productInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  emptyProductsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyProductsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ShopDetailScreen;
