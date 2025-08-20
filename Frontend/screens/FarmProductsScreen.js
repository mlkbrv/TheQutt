import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { farmsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { API_CONFIG } from '../config/api'; // Added missing import

const ProductCard = ({ product, onPress, onAddToCart, imageCache, addImageToCache, isImageCached }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress}>
    <View style={styles.productImageContainer}>
      {product.image ? (
        <Image
          source={{ 
            uri: product.image.startsWith('http') 
              ? product.image 
              : `${API_CONFIG.BASE_URL}/media/product_pictures/${product.image}`
          }}
          style={styles.productImage}
          resizeMode="cover"
          onLoad={() => {
            const imageUrl = product.image.startsWith('http') 
              ? product.image 
              : `${API_CONFIG.BASE_URL}/media/product_pictures/${product.image}`;
            if (!isImageCached(imageUrl)) {
              addImageToCache(imageUrl);
            }
          }}
          onError={() => {
            console.log('❌ Şəkil yükləmə xətası:', product.name);
          }}
        />
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>{getProductEmoji(product.name)}</Text>
        </View>
      )}
    </View>
    
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{product.name}</Text>
      {product.description && (
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description}
        </Text>
      )}
      <View style={styles.productFooter}>
        <Text style={styles.productPrice}>💰 {product.price} ₼</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onAddToCart(product)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

// Функция для выбора эмоджи в зависимости от названия продукта
const getProductEmoji = (productName) => {
  const name = productName.toLowerCase();
  if (name.includes('зерно') || name.includes('grain')) return '🌾';
  if (name.includes('овощ') || name.includes('vegetable')) return '🥕';
  if (name.includes('фрукт') || name.includes('fruit')) return '🍎';
  if (name.includes('молоко') || name.includes('milk')) return '🥛';
  if (name.includes('мясо') || name.includes('meat')) return '🥩';
  if (name.includes('яйцо') || name.includes('egg')) return '🥚';
  if (name.includes('мед') || name.includes('honey')) return '🍯';
  if (name.includes('трактор') || name.includes('tractor')) return '🚜';
  if (name.includes('комбайн') || name.includes('combine')) return '🚜';
  return '🌱'; // По умолчанию
};

const FarmProductsScreen = ({ route, navigation }) => {
  const { farm } = route.params;
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [imageCache, setImageCache] = useState(new Map()); // Кэш для изображений
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

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

  const categories = [
    { id: 'all', name: 'All', icon: '🌾' },
    { id: 'crop', name: 'Crops', icon: '🌱' },
    { id: 'item', name: 'Items', icon: '📦' },
    { id: 'machinery', name: 'Machinery', icon: '🚜' },
  ];

  useEffect(() => {
    loadFarmProducts();
  }, []);

  useEffect(() => {
    filterByCategory(selectedCategory);
  }, [products, selectedCategory]);

  const isImageCached = (imageUrl) => {
    return imageCache.has(imageUrl);
  };

  const addImageToCache = (imageUrl) => {
    if (!imageCache.has(imageUrl)) {
      setImageCache(prev => new Map(prev).set(imageUrl, true));
    }
  };

  const loadFarmProducts = async (forceRefresh = false) => {
    try {
      // Если данные уже есть и не требуется принудительное обновление, пропускаем загрузку
      if (!forceRefresh && products.length > 0) {
        console.log('📱 Products already loaded, skipping fetch');
        return;
      }
      
      setIsLoading(true);
      const response = await farmsAPI.getFarmProducts(farm.id);
      // API возвращает данные с пагинацией, нужно взять results
      const productsData = response.data.results || response.data;
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('❌ Error loading farm products:', error);
      Alert.alert('Error', 'Failed to load farm products');
    } finally {
      setIsLoading(false);
    }
  };

  const filterByCategory = (category) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => product.type === category);
      setFilteredProducts(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFarmProducts(true); // Принудительное обновление
    setRefreshing(false);
  };

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setModalVisible(true);
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      type: product.type,
      quantity: 1,
      farmId: farm.id,
      farmName: farm.name,
      picture: product.image
    });
    Alert.alert('Success', 'Item added to cart');
  };

  const handleAddToCartFromModal = () => {
    if (selectedProduct) {
      addToCart({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        type: selectedProduct.type,
        quantity: quantity,
        farmId: farm.id,
        farmName: farm.name,
        picture: selectedProduct.image
      });
      
      Alert.alert(
        'Success!', 
        `${selectedProduct.name} added to cart (${quantity} pcs)`,
        [
          { text: 'Continue Shopping', onPress: () => setModalVisible(false) },
          { text: 'Go to Cart', onPress: () => navigation.navigate('CartTab') }
        ]
      );
      
      setQuantity(1);
      setSelectedProduct(null);
    }
  };

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
      onAddToCart={handleAddToCart}
      imageCache={imageCache}
      addImageToCache={addImageToCache}
      isImageCached={isImageCached}
    />
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonActive
      ]}
      onPress={() => filterByCategory(item.id)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading farm products... 🌾</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🌾 Farm Products</Text>
          <Text style={styles.farmName}>{farm.name}</Text>
          <Text style={styles.headerSubtitle}>
            {filteredProducts.length} products available
          </Text>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {filteredProducts.length === 0 && !isLoading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🌾</Text>
          <Text style={styles.emptyText}>Products not found</Text>
          <Text style={styles.emptySubtext}>
            No products in this category yet
          </Text>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        numColumns={2}
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

                {selectedProduct.image ? (
                  <Image
                    source={{ 
                      uri: selectedProduct.image.startsWith('http') 
                        ? selectedProduct.image 
                        : `https://thequtt-9nuq.onrender.com/media/${selectedProduct.image}` 
                    }}
                    style={styles.modalImage}
                    resizeMode="cover"
                    onLoad={() => {
                      const imageUrl = selectedProduct.image.startsWith('http') 
                        ? selectedProduct.image 
                        : `https://thequtt-9nuq.onrender.com/media/${selectedProduct.image}`;
                      if (!isImageCached(imageUrl)) {
                        addImageToCache(imageUrl);
                      }
                    }}
                    onError={() => {
                      setSelectedProduct({...selectedProduct, image: null});
                    }}
                  />
                ) : (
                  <View style={styles.modalNoImageContainer}>
                    <Text style={styles.noImageText}>{getProductEmoji(selectedProduct.name)}</Text>
                  </View>
                )}

                {selectedProduct.description && (
                  <Text style={styles.modalDescription}>
                    {selectedProduct.description}
                  </Text>
                )}

                <View style={styles.modalInfo}>
                  <Text style={styles.modalPrice}>💰 Цена: {selectedProduct.price} ₼</Text>
                  <Text style={styles.modalType}>🏷️ Тип: {selectedProduct.type}</Text>
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
                      onPress={() => setQuantity(quantity + 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalTotal}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>{selectedProduct.price * quantity} ₼</Text>
                </View>

                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={handleAddToCartFromModal}
                >
                  <Text style={styles.addToCartButtonText}>
                    🛒 Add to Cart
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  categoriesContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#2E7D32',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 8,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    flex: 1,
  },
  productImageContainer: {
    width: '100%',
    height: 120,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 40,
    color: '#4CAF50',
  },
  productInfo: {
    padding: 12,
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#E8F5E8',
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
  modalType: {
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

export default FarmProductsScreen;
