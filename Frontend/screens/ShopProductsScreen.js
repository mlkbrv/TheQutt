import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG, getAuthHeaders } from '../config/api';
import { useCart } from '../contexts/CartContext';

const ShopProductsScreen = ({ route, navigation }) => {
  const { shopId, shopName } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageCache, setImageCache] = useState(new Map()); // Кэш для изображений
  const { token, refreshToken } = useAuth();
  const { addToCart } = useCart();

  // Функция для выбора эмоджи в зависимости от названия продукта
  const getProductEmoji = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('пицца') || name.includes('pizza')) return '🍕';
    if (name.includes('бургер') || name.includes('burger')) return '🍔';
    if (name.includes('суп') || name.includes('soup')) return '🍲';
    if (name.includes('салат') || name.includes('salad')) return '🥗';
    if (name.includes('напиток') || name.includes('drink') || name.includes('сок') || name.includes('juice')) return '🥤';
    if (name.includes('кофе') || name.includes('coffee')) return '☕';
    if (name.includes('чай') || name.includes('tea')) return '🫖';
    if (name.includes('десерт') || name.includes('dessert') || name.includes('торт') || name.includes('cake')) return '🍰';
    if (name.includes('хлеб') || name.includes('bread')) return '🥖';
    if (name.includes('мясо') || name.includes('meat') || name.includes('стейк') || name.includes('steak')) return '🥩';
    if (name.includes('рыба') || name.includes('fish')) return '🐟';
    if (name.includes('курица') || name.includes('chicken')) return '🍗';
    return '🛍️'; // По умолчанию
  };

  const isImageCached = (imageUrl) => {
    return imageCache.has(imageUrl);
  };

  const addImageToCache = (imageUrl) => {
    if (!imageCache.has(imageUrl)) {
      setImageCache(prev => new Map(prev).set(imageUrl, true));
    }
  };

  // Функция для получения правильного URL изображения продукта
  const getProductImageUrl = (picturePath) => {
    if (!picturePath) return null;
    
    // Если путь уже содержит полный URL, возвращаем его как есть
    if (picturePath.startsWith('http://') || picturePath.startsWith('https://')) {
      return picturePath;
    }
    
    // Если это относительный путь, добавляем базовый URL
    const cleanPath = picturePath.startsWith('/') ? picturePath.slice(1) : picturePath;
    
    // Определяем, это изображение магазина или продукта по расширению
    const isProductImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(cleanPath);
    const fullUrl = `${API_CONFIG.BASE_URL}/media/${isProductImage ? 'product_pictures' : 'shop_pictures'}/${cleanPath}`;
    
    return fullUrl;
  };

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const fetchProducts = async (forceRefresh = false) => {
    try {
      // Если данные уже есть и не требуется принудительное обновление, пропускаем загрузку
      if (!forceRefresh && products.length > 0) {
        console.log('📱 Products already loaded, skipping fetch');
        return;
      }
      
      setLoading(true);
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/products/shops/${shopId}/products/`,
        { headers: getAuthHeaders(token) }
      );
      setProducts(response.data);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('📊 Error response:', error.response?.data);
      console.error('🔢 Error status:', error.response?.status);
      
      // Если токен истек, пытаемся обновить его
      if (error.response?.status === 401 && error.response?.data?.code === 'token_not_valid') {
        console.log('🔄 Token expired, attempting to refresh...');
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess) {
          console.log('✅ Token refreshed, retrying products request...');
          // Повторяем запрос с новым токеном, но не перезагружаем изображения
          return fetchProducts(false);
        } else {
          console.log('❌ Failed to refresh token, user needs to login again');
          Alert.alert('Ошибка', 'Сессия истекла. Пожалуйста, войдите снова.');
        }
      } else {
        Alert.alert('Ошибка', 'Не удалось загрузить товары');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      addToCart({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: quantity,
        shopId: shopId,
        shopName: shopName,
        picture: selectedProduct.picture
      });
      
      Alert.alert(
        'Успешно!', 
        `${selectedProduct.name} добавлен в корзину (${quantity} шт.)`,
        [
          { text: 'Продолжить покупки', onPress: () => setModalVisible(false) },
          { text: 'Перейти в корзину', onPress: () => navigation.navigate('CartTab') }
        ]
      );
      
      setQuantity(1);
      setSelectedProduct(null);
    }
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setModalVisible(true);
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={() => openProductModal(item)}
    >
      <View style={styles.productImageContainer}>
        {item.picture ? (
                     <Image
             source={{ 
               uri: getProductImageUrl(item.picture)
             }}
             style={styles.productImage}
             resizeMode="cover"
             onLoad={() => {
               const imageUrl = getProductImageUrl(item.picture);
               if (!isImageCached(imageUrl)) {
                 addImageToCache(imageUrl);
               }
             }}
             onError={() => {
               // При ошибке загрузки изображения показываем эмоджи
               item.picture = null;
               setProducts([...products]);
             }}
           />
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>{getProductEmoji(item.name)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>💰 {item.price} ₽</Text>
          <Text style={styles.productQuantity}>📦 {item.quantity} шт.</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => openProductModal(item)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Загрузка товаров...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛍️ {shopName}</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
      />

      {/* Модальное окно для добавления в корзину */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                                 {selectedProduct.picture ? (
                   <Image
                     source={{ 
                       uri: getProductImageUrl(selectedProduct.picture)
                     }}
                     style={styles.modalImage}
                     resizeMode="cover"
                     onLoad={() => {
                       const imageUrl = getProductImageUrl(selectedProduct.picture);
                       if (!isImageCached(imageUrl)) {
                         addImageToCache(imageUrl);
                       }
                     }}
                     onError={() => {
                       // При ошибке загрузки изображения показываем эмоджи
                       setSelectedProduct({...selectedProduct, picture: null});
                     }}
                   />
                 ) : (
                  <View style={styles.modalNoImageContainer}>
                    <Text style={styles.noImageText}>{getProductEmoji(selectedProduct.name)}</Text>
                  </View>
                )}

                <Text style={styles.modalDescription}>
                  {selectedProduct.description}
                </Text>

                <View style={styles.modalInfo}>
                  <Text style={styles.modalPrice}>💰 Цена: {selectedProduct.price} ₽</Text>
                  <Text style={styles.modalStock}>📦 В наличии: {selectedProduct.quantity} шт.</Text>
                </View>

                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Количество:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => quantity < selectedProduct.quantity && setQuantity(quantity + 1)}
                      disabled={quantity >= selectedProduct.quantity}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalTotal}>
                  <Text style={styles.totalLabel}>Итого:</Text>
                  <Text style={styles.totalValue}>{selectedProduct.price * quantity} ₽</Text>
                </View>

                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={handleAddToCart}
                >
                  <Text style={styles.addToCartButtonText}>
                    🛒 Добавить в корзину
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonText: {
    color: 'white',
    fontSize: 20,
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 32,
    color: '#999',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  productQuantity: {
    fontSize: 14,
    color: '#888',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeModalButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalNoImageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  modalStock: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  modalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ShopProductsScreen;
